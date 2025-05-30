import React, { useState, useEffect } from 'react';
import { LogBox } from 'react-native';
LogBox.ignoreLogs([
  'VirtualizedLists should never be nested inside plain ScrollViews',
]);
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Alert,
  Dimensions,
} from 'react-native';
import { useRouter } from "expo-router";
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { getSubscriptionHistory, getSubscriptionPlans, purchaseSubscription } from '@/constants/apiService';
import SubscriptionHistory from '@/components/SubscriptionHistory';

interface Subscription {
  subscription_id: number;
  owner_id: number;
  plan_id: number;
  plan_name: string;
  price: number;
  max_fields: number;
  start_date: string | null;
  end_date: string | null;
  status: 'active' | 'expired' | 'cancelled';
  description?: string;
  total_cost: number;
}

interface SubscriptionPlan {
  plan_id: number;
  name: string;
  price: number;
  duration: number;
  max_fields: number;
  description: string;
}

const SubscriptionsScreen = () => {
  const router = useRouter();
  const [currentSubscription, setCurrentSubscription] = useState<Subscription | null>(null);
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [plansLoading, setPlansLoading] = useState(true);
  const [purchaseModalVisible, setPurchaseModalVisible] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [selectedMonths, setSelectedMonths] = useState(1);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);
  const loadData = async () => {
  try {
    setLoading(true);
    setPlansLoading(true);

    // Lấy toàn bộ lịch sử
    const history = await getSubscriptionHistory();

    if (Array.isArray(history) && history.length > 0) {
      // 🔎 Lọc các gói active hoặc expired
      const activeOrExpiredSubscriptions = history.filter(item => 
        item.status === 'active' || item.status === 'expired'
      );

      // 🔁 Sắp xếp theo start_date giảm dần
      activeOrExpiredSubscriptions.sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime());

      // ✅ Lấy gói mới nhất (active hoặc expired)
      const newestSubscription = activeOrExpiredSubscriptions[0] || null;
      setCurrentSubscription(newestSubscription);
    } else {
      setCurrentSubscription(null);
    }

    // Load các gói có thể mua
    const plansData = await getSubscriptionPlans();
    if (Array.isArray(plansData)) {
      setSubscriptionPlans(plansData);
    } else if (plansData && typeof plansData === 'object') {
      const planArray = plansData.plans || plansData.data || [];
      setSubscriptionPlans(planArray);
    }
  } catch (error) {
    console.error("Lỗi khi load dữ liệu:", error);
    Alert.alert("Lỗi", "Không thể tải dữ liệu gói đăng ký.");
  } finally {
    setLoading(false);
    setPlansLoading(false);
  }
};



  const handlePurchase = () => {
    if (!selectedPlan) {
      Alert.alert("Lỗi", "Vui lòng chọn gói đăng ký");
      return;
    }

    // Check if user already has an active subscription (excluding the default "Free" plan if plan_id === 1)
    if (currentSubscription && currentSubscription.status === 'active' && currentSubscription.plan_id !== 1) {
      Alert.alert(
        "Thông báo",
        "Bạn đã có gói đăng ký đang hoạt động. Bạn có muốn gia hạn hoặc thay đổi gói không?",
        [
          {
            text: "Hủy",
            style: "cancel"
          },
          {
            text: "Đến trang thanh toán",
            onPress: () => proceedToPayment()
          }
        ]
      );
      return;
    }

    proceedToPayment();
  };

  const proceedToPayment = () => {
    if (!selectedPlan) {
      // This should ideally not happen if handlePurchase is called correctly
      Alert.alert("Lỗi", "Chưa chọn gói để thanh toán.");
      return;
    }
    try {
      setPurchaseModalVisible(false);
      const planName = selectedPlan.name || 'unknown';
      let planCode = "";
      const planNameLower = selectedPlan.name.toLowerCase(); // For robust checking

      // Determine planCode based on plan_id or name
      // Assuming plan_id 3 is 'pro' (maps to 'premium' in DB)
      // Assuming plan_id 2 is 'classic' (maps to 'standard' in DB)
      if (selectedPlan.plan_id === 2 || planNameLower.includes('pro')) {
        planCode = "premium"; // Send 'premium' for pro plans
      } else if (selectedPlan.plan_id === 1 || planNameLower.includes('standard') || planNameLower.includes('classic')) {
        planCode = "standard"; // Send 'standard' for classic/standard plans
      }

      if (planCode === "") {
        Alert.alert("Lỗi", `Gói "${planName}" không thể được xử lý qua kênh thanh toán này hoặc không hợp lệ. Vui lòng chọn gói được hỗ trợ (Standard/Premium).`);
        return;
      }

      router.push({
        pathname: "/owner/subscription-payment",
        params: {
          planId: selectedPlan.plan_id.toString(),
          planName: planName,
          planCode: planCode, // Pass the determined planCode
          months: selectedMonths.toString(),
          price: (selectedPlan.price || 0).toString(),
          type: "subscription"
        }
      });
    } catch (error) {
      console.error("Navigation error:", error);
      Alert.alert("Lỗi", "Không thể chuyển đến trang thanh toán. Vui lòng thử lại sau.");
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

  const formatPrice = (price: number | string | null | undefined) => {
  const num = typeof price === "string" ? parseFloat(price) : price;

  if (typeof num !== 'number' || isNaN(num)) return "--";

  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(num);
};



  const calculateRemainingDays = (endDateString: string | null) => {
    if (!endDateString) return 0;

    const endDate = new Date(endDateString);
    const today = new Date();
    const diffTime = endDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const renderCurrentSubscription = () => {
    if (loading) {
      return (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#42ba96" />
        </View>
      );
    }    if (!currentSubscription ||
      (currentSubscription.status !== 'active' && currentSubscription.status !== 'expired') ||
      currentSubscription.plan_name.toLowerCase() === 'basic') {
      return (
        <View style={styles.noSubscriptionContainer}>
          <FontAwesome5 name="crown" size={40} color="#ddd" style={styles.noSubIcon} />
          <Text style={styles.noSubscriptionText}>
            Bạn chưa có gói đăng ký nào
          </Text>
          <Text style={styles.noSubscriptionSubtext}>
            Nâng cấp ngay để mở khóa thêm nhiều tính năng
          </Text>
          <TouchableOpacity
            style={styles.upgradeButton}
            onPress={() => setPurchaseModalVisible(true)}
          >
            <Text style={styles.upgradeButtonText}>Nâng cấp ngay</Text>
          </TouchableOpacity>
        </View>
      );
    }

    const remainingDays = calculateRemainingDays(currentSubscription.end_date);
    const isPro = currentSubscription.plan_name.toLowerCase().includes('pro');
    const isClassic = currentSubscription.plan_name.toLowerCase().includes('classic');

    return (
      <View style={styles.currentSubContainer}>
        <View style={[
          styles.subHeader,
          isPro ? styles.proHeader :
            isClassic ? styles.classicHeader :
              styles.basicHeader
        ]}>
          <Text style={styles.planNameText}>{currentSubscription.plan_name}</Text>
          <View style={styles.statusContainer}>
            <Text style={styles.statusText}>
              {currentSubscription.status === 'active' ? 'Còn hạn' : 'Hết hạn'}
            </Text>
          </View>
        </View>

        <View style={styles.subDetailsContainer}>
          <View style={styles.subDetail}>
            <Text style={styles.subDetailLabel}>Ngày bắt đầu:</Text>
            <Text style={styles.subDetailValue}>
              {formatDate(currentSubscription.start_date)}
            </Text>
          </View>

          <View style={styles.subDetail}>
            <Text style={styles.subDetailLabel}>Ngày kết thúc:</Text>
            <Text style={styles.subDetailValue}>
              {formatDate(currentSubscription.end_date)}
            </Text>
          </View>

          <View style={styles.subDetail}>
            <Text style={styles.subDetailLabel}>Số sân tối đa:</Text>
            <Text style={styles.subDetailValue}>{currentSubscription.max_fields}</Text>
          </View>

          <View style={styles.subDetail}>
            <Text style={styles.subDetailLabel}>Giá gói:</Text>
            <Text style={styles.subDetailValue}>{formatPrice(currentSubscription.total_cost)}</Text>
          </View>

          {currentSubscription.status === 'active' && (
            <View style={styles.remainingContainer}>
              <Text style={styles.remainingText}>
                Còn {remainingDays} ngày sử dụng
              </Text>
            </View>
          )}          {currentSubscription.description && (
            <View style={styles.descriptionBox}>
              <Text style={styles.descriptionTitle}>Mô tả gói:</Text>
              {Array.isArray(currentSubscription.description)
                ? currentSubscription.description.map((line, index) => (
                  <Text key={index} style={styles.descriptionText}>• {line}</Text>
                ))
                : <Text style={styles.descriptionText}>{currentSubscription.description}</Text>}
            </View>
          )}          {/* Chỉ hiển thị nút Gia hạn gói khi: status = 'expired' HOẶC còn dưới 10 ngày */}
          {(currentSubscription.status === 'expired' || (currentSubscription.status === 'active' && remainingDays <= 10)) && (
            <TouchableOpacity
              style={styles.renewButton}
              onPress={() => setPurchaseModalVisible(true)}
            >
              <Text style={styles.renewButtonText}>
                {currentSubscription.status === 'expired' ? 'Gia hạn gói' : 'Gia hạn sớm'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };
  const renderPurchaseModal = () => {
    return (
      <Modal
        visible={purchaseModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setPurchaseModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Chọn gói đăng ký</Text>

            {plansLoading ? (
              <ActivityIndicator size="small" color="#42ba96" />
            ) : (
              <>
                <Text style={styles.sectionTitle}>Chọn gói:</Text>

                {subscriptionPlans.length === 0 ? (
                  <View style={styles.noPlansContainer}>
                    <Text style={styles.noPlansText}>Không có gói đăng ký nào hiện có</Text>
                    <TouchableOpacity
                      style={styles.retryButton}
                      onPress={loadData}
                    >
                      <Text style={styles.retryButtonText}>Thử lại</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.planCardsContainer}>
                    {subscriptionPlans.map((plan) => (
                      <TouchableOpacity
                        key={plan.plan_id}
                        style={[
                          styles.enhancedPlanCard,
                          selectedPlan?.plan_id === plan.plan_id && styles.selectedPlanCard,
                          plan.name?.toLowerCase().includes('pro') ? styles.proPlanCard :
                            plan.name?.toLowerCase().includes('classic') ? styles.classicPlanCard :
                              styles.basicPlanCard
                        ]}
                        onPress={() => setSelectedPlan(plan)}
                      >
                        <Text style={[
                          styles.planCardName,
                          selectedPlan?.plan_id === plan.plan_id && styles.selectedPlanCardText
                        ]}>
                          {plan.name || "Gói đăng ký"}
                        </Text>
                        <Text style={styles.planCardPrice}>{formatPrice(plan.price || 0)}</Text>
                        <View style={styles.planFeaturesList}>
                          <View style={styles.planFeatureItem}>
                            <FontAwesome5 name="check-circle" size={14} color="#42ba96" />
                            <Text style={styles.planCardFeature}>
                              {plan.name?.toLowerCase().includes('standard') ? 'Tối đa 10 sân' : 'Tối đa 30 sân'}
                            </Text>
                          </View>
                          <View style={styles.planFeatureItem}>
                            <FontAwesome5 name="headset" size={14} color="#42ba96" />
                            <Text style={styles.planCardFeature}>
                              {plan.name?.toLowerCase().includes('standard') ? 'Hỗ trợ 16/7' : 'Hỗ trợ 24/7'}
                            </Text>
                          </View>
                          <View style={styles.planFeatureItem}>
                            <Ionicons name="pricetag-outline" size={14} color="#42ba96" />
                            <Text style={styles.planCardFeature}>
                              {plan.name?.toLowerCase().includes('standard') ? 'Giảm 10% phí dịch vụ. ' : 'Giảm 15% phí dịch vụ. '}
                            </Text>
                          </View>
                        </View>
                        {plan.name?.toLowerCase().includes('pro') && (
                          <View style={styles.recommendBadge}>
                            <Text style={styles.recommendText}>Đề xuất</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                <Text style={styles.sectionTitle}>Chọn thời gian:</Text>
                <View style={styles.durationContainer}>
                  <TouchableOpacity
                    style={[styles.durationOption, selectedMonths === 1 && styles.selectedDuration]}
                    onPress={() => setSelectedMonths(1)}
                  >
                    <Text style={styles.durationText}>1 tháng</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.durationOption, selectedMonths === 3 && styles.selectedDuration]}
                    onPress={() => setSelectedMonths(3)}
                  >
                    <Text style={styles.durationText}>3 tháng</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.durationOption, selectedMonths === 6 && styles.selectedDuration]}
                    onPress={() => setSelectedMonths(6)}
                  >
                    <Text style={styles.durationText}>6 tháng</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.durationOption, selectedMonths === 12 && styles.selectedDuration]}
                    onPress={() => setSelectedMonths(12)}
                  >
                    <Text style={styles.durationText}>12 tháng</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.totalContainer}>
                  <Text style={styles.totalLabel}>Tổng thanh toán:</Text>
                  <Text style={styles.totalAmount}>
                    {selectedPlan ? formatPrice(selectedPlan.price * selectedMonths) : "0 VND"}
                  </Text>
                </View>

                <TouchableOpacity
                  style={[
                    styles.purchaseButton,
                    (!selectedPlan || purchasing) && { opacity: 0.7 }
                  ]}
                  onPress={handlePurchase}
                  disabled={!selectedPlan || purchasing}
                >
                  {purchasing ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.purchaseButtonText}>Thanh toán</Text>
                  )}
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity
              style={styles.closeModalButton}
              onPress={() => setPurchaseModalVisible(false)}
            >
              <Text style={styles.closeModalText}>Hủy</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace("/owner/profile")}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Quản lý gói đăng ký</Text>
        <TouchableOpacity onPress={loadData}>
          <Ionicons name="refresh" size={24} color="#42ba96" />
        </TouchableOpacity>
      </View>      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Gói đăng ký hiện tại</Text>
        {renderCurrentSubscription()}
      </View>

      {/* Chỉ hiển thị phần "Các gói đăng ký có sẵn" khi KHÔNG có gói active */}
      {(!currentSubscription || 
        currentSubscription.status !== 'active' || 
        currentSubscription.plan_name.toLowerCase() === 'basic') && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Các gói đăng ký có sẵn</Text>
          {plansLoading ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="small" color="#42ba96" />
            </View>
          ) : subscriptionPlans.length === 0 ? (
            <View style={styles.noPlansContainer}>
              <Text style={styles.noPlansText}>Không có gói đăng ký nào hiện có</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={loadData}
              >
                <Text style={styles.retryButtonText}>Thử lại</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.availablePlansContainer}>
              {subscriptionPlans.map((plan) => (
                <View
                  key={plan.plan_id}
                  style={[
                    styles.enhancedPlanCard,
                    plan.name?.toLowerCase().includes('pro') ? styles.proPlanCard :
                      plan.name?.toLowerCase().includes('classic') || plan.name?.toLowerCase().includes('standard') ? styles.classicPlanCard :
                        styles.basicPlanCard
                  ]}
                >
                  <Text style={styles.planCardName}>
                    {plan.name || "Gói đăng ký"}
                  </Text>
                  <Text style={styles.planCardPrice}>{formatPrice(plan.price || 0)}</Text>

                  <View style={styles.planFeaturesList}>
                    <View style={styles.planFeatureItem}>
                      <FontAwesome5 name="check-circle" size={14} color="#42ba96" />
                      <Text style={styles.planCardFeature}>
                        {plan.name?.toLowerCase().includes('standard') || plan.name?.toLowerCase().includes('classic') ? 'Tối đa 10 sân' : 'Tối đa 30 sân'}
                      </Text>
                    </View>
                    <View style={styles.planFeatureItem}>
                      <FontAwesome5 name="headset" size={14} color="#42ba96" />
                      <Text style={styles.planCardFeature}>
                        {plan.name?.toLowerCase().includes('standard') || plan.name?.toLowerCase().includes('classic') ? ' Hỗ trợ 16/7' : ' Hỗ trợ 24/7'}
                      </Text>
                    </View>
                    <View style={styles.planFeatureItem}>
                      <Ionicons name="pricetag-outline" size={14} color="#42ba96" />
                      <Text style={styles.planCardFeature}>
                        {plan.name?.toLowerCase().includes('standard') || plan.name?.toLowerCase().includes('classic') ? 'Giảm 10% phí dịch vụ. ' : 'Giảm 15% phí dịch vụ. '}
                      </Text>
                    </View>
                  </View>

                  {plan.name?.toLowerCase().includes('pro') && (
                    <View style={styles.recommendBadge}>
                      <Text style={styles.recommendText}>Đề xuất</Text>
                    </View>
                  )}

                  <TouchableOpacity
                    style={styles.upgradeToPlanButton}
                    onPress={() => {
                      setSelectedPlan(plan);
                      setPurchaseModalVisible(true);
                    }}
                  >
                    <Text style={styles.upgradeToPlanButtonText}>Chọn gói này</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      <View style={styles.section}>
        <SubscriptionHistory />
      </View>

      {renderPurchaseModal()}
    </ScrollView>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  section: {
    padding: 15,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#555',
    marginBottom: 10,
  },
  loaderContainer: {
    paddingVertical: 30,
    alignItems: 'center',
  },
  noSubscriptionContainer: {
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 30,
  },
  noSubIcon: {
    marginBottom: 15,
  },
  noSubscriptionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#555',
    marginBottom: 8,
  },
  noSubscriptionSubtext: {
    fontSize: 14,
    color: '#777',
    textAlign: 'center',
    marginBottom: 20,
  },
  upgradeButton: {
    backgroundColor: '#42ba96',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  upgradeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  currentSubContainer: {
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  subHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  proHeader: {
    backgroundColor: '#e6f7f2',
  },
  classicHeader: {
    backgroundColor: '#fff8e6',
  },
  basicHeader: {
    backgroundColor: '#f5f5f5',
  },
  planNameText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  statusContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 15,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#42ba96',
  },
  subDetailsContainer: {
    padding: 15,
  },
  subDetail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  subDetailLabel: {
    fontSize: 14,
    color: '#777',
  },
  subDetailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  remainingContainer: {
    alignItems: 'center',
    marginVertical: 15,
  },
  remainingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#42ba96',
  },
  descriptionBox: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 6,
    marginBottom: 15,
    borderLeftWidth: 3,
    borderLeftColor: '#42ba96',
  },
  descriptionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginBottom: 5,
  },
  descriptionText: {
    fontSize: 14,
    color: '#777',
    lineHeight: 20,
  },
  renewButton: {
    backgroundColor: '#42ba96',
    paddingVertical: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  renewButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  // Modal styles
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    width: '100%',
    maxHeight: '90%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  plansScrollView: {
    marginBottom: 20,
  },
  planCard: {
    width: width * 0.4,
    padding: 15,
    borderRadius: 10,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  selectedPlanCard: {
    borderColor: '#42ba96',
    backgroundColor: '#f5fffa',
  },
  proPlanCard: {
    borderColor: '#42ba96',
  },
  classicPlanCard: {
    borderColor: '#f59f00',
  },
  planCardName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  selectedPlanCardText: {
    color: '#42ba96',
  },
  planCardPrice: {
    fontSize: 14,
    marginBottom: 10,
    color: '#777',
  },
  planCardFeature: {
    fontSize: 13,
    color: '#555',
  },
  recommendBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#42ba96',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderBottomLeftRadius: 5,
  },
  recommendText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  durationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  durationOption: {
    width: '22%',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    alignItems: 'center',
  },
  selectedDuration: {
    borderColor: '#42ba96',
    backgroundColor: '#f5fffa',
  },
  durationText: {
    fontSize: 13,
    color: '#333',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  }, totalAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#42ba96',
  },
  purchaseButton: {
    backgroundColor: '#42ba96',
    paddingVertical: 12,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 10,
  },
  purchaseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  noPlansContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    marginBottom: 20,
    width: '100%',
  },
  noPlansText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#777',
    marginBottom: 15,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#42ba96',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  closeModalButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  closeModalText: {
    color: '#777',
    fontSize: 16,
  },
  planCardsContainer: {
    marginBottom: 20,
  },
  enhancedPlanCard: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  basicPlanCard: {
    borderColor: '#ccc',
  },
  planFeaturesList: {
    marginTop: 10,
  },
  planFeatureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  availablePlansContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  upgradeToPlanButton: {
    backgroundColor: '#42ba96',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 12,
  },
  upgradeToPlanButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default SubscriptionsScreen;
