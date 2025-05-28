import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert } from 'react-native';
import { ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { getSubscriptionPlans, getOwnerSubscription } from '../constants/apiService';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';

type SubscriptionPlan = {
  plan_id: number;
  name: string;
  plan_code: string;
  price: number;
  duration: number;
  max_fields: number;
  description: string;
};

type CurrentSubscription = {
  subscription_id: number;
  owner_id: number;
  plan_id: number;
  plan_name: string;
  price: number;
  max_fields: number;
  start_date: string | null;
  end_date: string | null;
  status: 'active' | 'expired';
  description?: string;
};

type SubscriptionPlansProps = {
  userId: number | string;
};

export default function SubscriptionPlans({ userId }: SubscriptionPlansProps) {  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<CurrentSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<number | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch current subscription first
      const subscription = await getOwnerSubscription();
      setCurrentSubscription(subscription);
      
      // Only fetch plans if no active subscription or subscription is expired
      if (!subscription || subscription.status !== 'active' || subscription.plan_name.toLowerCase() === 'basic') {
        const response = await getSubscriptionPlans();
        setPlans(response);
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load subscription data');
      setLoading(false);
    }
  };  const handleSelectPlan = (planId: number) => {
    setSelectedPlan(planId);
  };

  const formatPrice = (price: number) => {
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") + " VND";
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN");
  };

  const calculateRemainingDays = (endDateString: string | null) => {
    if (!endDateString) return 0;
    const endDate = new Date(endDateString);
    const today = new Date();
    const diffTime = endDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const handleProceedToPayment = () => {
    if (!selectedPlan) {
      Alert.alert('Error', 'Please select a subscription plan');
      return;
    }

    const selectedPlanDetails = plans.find(plan => plan.plan_id === selectedPlan);
    
    if (!selectedPlanDetails) return;

    // Generate a unique subscription code for the order
    const subscriptionCode = `SUB-${Date.now()}-${userId}`;
      // Navigate to subscription payment screen with plan details
    router.push({
      pathname: '/owner/subscription-payment',
      params: {
        userId,
        plan: selectedPlanDetails.plan_code,
        planName: selectedPlanDetails.name,
        months: selectedPlanDetails.duration.toString(),
        price: selectedPlanDetails.price.toString()
      }
    });
  };
  const handleRenewPlan = () => {
    if (!currentSubscription) return;
    
    // Find the same plan or navigate to plans selection
    router.push({
      pathname: '/owner/subscription-payment',
      params: {
        userId,
        plan: currentSubscription.plan_name.toLowerCase(),
        planName: currentSubscription.plan_name,
        months: '1', // Default to 1 month renewal
        price: currentSubscription.price.toString(),
        isRenewal: 'true'
      }
    });
  };

  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#42ba96" />
        <ThemedText style={styles.loadingText}>Loading subscription information...</ThemedText>
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={styles.errorContainer}>
        <ThemedText style={styles.errorText}>{error}</ThemedText>
        <TouchableOpacity style={styles.retryButton} onPress={fetchData}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  // If user has an active subscription, show current subscription info
  if (currentSubscription && currentSubscription.status === 'active' && currentSubscription.plan_name.toLowerCase() !== 'basic') {
    const remainingDays = calculateRemainingDays(currentSubscription.end_date);
    const isPro = currentSubscription.plan_name.toLowerCase().includes('pro');
    const isClassic = currentSubscription.plan_name.toLowerCase().includes('classic');

    return (
      <ThemedView style={styles.container}>
        <ThemedText style={styles.title}>Gói đăng ký hiện tại</ThemedText>
        
        <View style={[
          styles.currentSubContainer,
          isPro ? styles.proContainer :
            isClassic ? styles.classicContainer :
              styles.basicContainer
        ]}>
          <View style={styles.currentSubHeader}>
            <Text style={[
              styles.currentPlanName,
              isPro ? styles.proPlan :
                isClassic ? styles.classicPlan :
                  styles.basicPlan
            ]}>
              {currentSubscription.plan_name}
            </Text>
            <View style={styles.activeStatusBadge}>
              <Text style={styles.activeStatusText}>Đang hoạt động</Text>
            </View>
          </View>

          <View style={styles.subscriptionDetails}>
            <View style={styles.detailRow}>
              <Ionicons name="calendar-outline" size={16} color="#777" />
              <Text style={styles.detailLabel}>Từ:</Text>
              <Text style={styles.detailValue}>{formatDate(currentSubscription.start_date)}</Text>
            </View>

            <View style={styles.detailRow}>
              <Ionicons name="calendar" size={16} color="#777" />
              <Text style={styles.detailLabel}>Đến:</Text>
              <Text style={styles.detailValue}>{formatDate(currentSubscription.end_date)}</Text>
            </View>

            <View style={styles.detailRow}>
              <Ionicons name="business" size={16} color="#777" />
              <Text style={styles.detailLabel}>Số sân tối đa:</Text>
              <Text style={styles.detailValue}>{currentSubscription.max_fields}</Text>
            </View>

            <View style={styles.detailRow}>
              <Ionicons name="cash" size={16} color="#777" />
              <Text style={styles.detailLabel}>Giá gói:</Text>
              <Text style={styles.detailValue}>{formatPrice(currentSubscription.price)}</Text>
            </View>
          </View>

          {remainingDays > 0 && (
            <View style={styles.remainingContainer}>
              <Text style={styles.remainingText}>
                Còn {remainingDays} ngày sử dụng
              </Text>
            </View>
          )}

          {currentSubscription.description && (
            <View style={styles.descriptionBox}>
              <Text style={styles.descriptionTitle}>Mô tả gói:</Text>
              <Text style={styles.descriptionText}>{currentSubscription.description}</Text>
            </View>
          )}
        </View>
      </ThemedView>
    );
  }

  // If user has expired subscription, show renewal option
  if (currentSubscription && currentSubscription.status === 'expired') {
    return (
      <ThemedView style={styles.container}>
        <ThemedText style={styles.title}>Gói đăng ký đã hết hạn</ThemedText>
        
        <View style={styles.expiredContainer}>
          <FontAwesome5 name="exclamation-triangle" size={40} color="#ff4d4d" />
          <Text style={styles.expiredTitle}>Gói {currentSubscription.plan_name} đã hết hạn</Text>
          <Text style={styles.expiredText}>
            Gói đăng ký của bạn đã hết hạn vào {formatDate(currentSubscription.end_date)}
          </Text>
          
          <TouchableOpacity
            style={styles.renewButton}
            onPress={handleRenewPlan}
          >
            <Text style={styles.renewButtonText}>Gia hạn gói</Text>
          </TouchableOpacity>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.title}>Subscription Plans</ThemedText>
      <ThemedText style={styles.subtitle}>Choose a plan that fits your business</ThemedText>      <FlatList
        data={plans}
        keyExtractor={(item) => item.plan_id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.planCard,
              selectedPlan === item.plan_id && styles.selectedPlan
            ]}
            onPress={() => handleSelectPlan(item.plan_id)}
          >
            <View style={styles.planContent}>
              <ThemedText style={styles.planName}>{item.name}</ThemedText>
              <ThemedText style={styles.planPrice}>{item.price.toLocaleString('vi-VN')} VND</ThemedText>
              <ThemedText style={styles.planDuration}>Duration: {item.duration} months</ThemedText>
              <ThemedText style={styles.planFields}>Max Fields: {item.max_fields}</ThemedText>
              <ThemedText style={styles.planDescription}>{item.description}</ThemedText>
            </View>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.listContainer}
      />

      <TouchableOpacity
        style={[styles.proceedButton, !selectedPlan && styles.disabledButton]}
        disabled={!selectedPlan}
        onPress={handleProceedToPayment}
      >
        <Text style={styles.proceedButtonText}>Proceed to Payment</Text>
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#0070f3',
    padding: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 16,
  },
  listContainer: {
    paddingBottom: 16,
  },
  planCard: {
    marginBottom: 16,
    elevation: 2,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  planContent: {
    flex: 1,
  },
  selectedPlan: {
    borderWidth: 2,
    borderColor: '#0070f3',
  },
  planName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  planPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0070f3',
    marginBottom: 8,
  },
  planDuration: {
    fontSize: 16,
    marginBottom: 4,
  },
  planFields: {
    fontSize: 16,
    marginBottom: 8,
  },
  planDescription: {
    fontSize: 14,
    color: '#666',
  },
  proceedButton: {
    marginTop: 16,
    paddingVertical: 16,
    backgroundColor: '#0070f3',
    borderRadius: 8,
    alignItems: 'center',
  },
  proceedButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  // Current subscription styles
  currentSubContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    margin: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  proContainer: {
    borderLeftWidth: 5,
    borderLeftColor: '#ff6b35',
  },
  classicContainer: {
    borderLeftWidth: 5,
    borderLeftColor: '#4ecdc4',
  },
  basicContainer: {
    borderLeftWidth: 5,
    borderLeftColor: '#95a5a6',
  },
  currentSubHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  currentPlanName: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  proPlan: {
    color: '#ff6b35',
  },
  classicPlan: {
    color: '#4ecdc4',
  },
  basicPlan: {
    color: '#95a5a6',
  },
  activeStatusBadge: {
    backgroundColor: '#2ecc71',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeStatusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  subscriptionDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 16,
    color: '#777',
    marginLeft: 8,
    marginRight: 8,
    minWidth: 100,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  remainingContainer: {
    backgroundColor: '#e8f4fd',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  remainingText: {
    fontSize: 16,
    color: '#0070f3',
    fontWeight: '600',
    textAlign: 'center',
  },
  descriptionBox: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
  },
  descriptionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  descriptionText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  // Expired subscription styles
  expiredContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    margin: 8,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  expiredTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ff4d4d',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  expiredText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  renewButton: {
    backgroundColor: '#ff6b35',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  renewButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
