import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert } from 'react-native';
import { ActivityIndicator, Card, Button } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { API_URL } from '../constants/apiConfig';
import { getSubscriptionPlans } from '../constants/apiService';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';

type SubscriptionPlan = {
  plan_id: number;
  name: string;
  plan_code: string;
  price: number;
  duration: number;
  max_fields: number;
  description: string;
};

type SubscriptionPlansProps = {
  userId: number | string;
};

export default function SubscriptionPlans({ userId }: SubscriptionPlansProps) {  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<number | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchSubscriptionPlans();
  }, []);

  const fetchSubscriptionPlans = async () => {
    try {
      const response = await getSubscriptionPlans();
      setPlans(response);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching subscription plans:', err);
      setError('Failed to load subscription plans');
      setLoading(false);
    }
  };

  const handleSelectPlan = (planId: number) => {
    setSelectedPlan(planId);
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

  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <ThemedText style={styles.loadingText}>Loading subscription plans...</ThemedText>
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={styles.errorContainer}>
        <ThemedText style={styles.errorText}>{error}</ThemedText>
        <Button mode="contained" onPress={fetchSubscriptionPlans}>Try Again</Button>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.title}>Subscription Plans</ThemedText>
      <ThemedText style={styles.subtitle}>Choose a plan that fits your business</ThemedText>

      <FlatList
        data={plans}
        keyExtractor={(item) => item.plan_id.toString()}
        renderItem={({ item }) => (
          <Card
            style={[
              styles.planCard,
              selectedPlan === item.plan_id && styles.selectedPlan
            ]}
            onPress={() => handleSelectPlan(item.plan_id)}
          >
            <Card.Content>
              <ThemedText style={styles.planName}>{item.name}</ThemedText>
              <ThemedText style={styles.planPrice}>{item.price.toLocaleString('vi-VN')} VND</ThemedText>
              <ThemedText style={styles.planDuration}>Duration: {item.duration} months</ThemedText>
              <ThemedText style={styles.planFields}>Max Fields: {item.max_fields}</ThemedText>
              <ThemedText style={styles.planDescription}>{item.description}</ThemedText>
            </Card.Content>
          </Card>
        )}
        contentContainerStyle={styles.listContainer}
      />

      <Button
        mode="contained"
        style={styles.proceedButton}
        disabled={!selectedPlan}
        onPress={handleProceedToPayment}
      >
        Proceed to Payment
      </Button>
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
    paddingVertical: 8,
  },
});
