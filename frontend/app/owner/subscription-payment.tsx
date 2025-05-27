import React, { useEffect, useState, useRef, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ScrollView,
  Platform,
  ToastAndroid,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  purchaseSubscription,
  getUserInfo,
  getOwnerSubscription,
  createSubscriptionPendingOrder,
  updateSubscriptionOrderStatus,
} from "@/constants/apiService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AntDesign } from "@expo/vector-icons";

const SubscriptionPayment = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [countdown, setCountdown] = useState(300); // 5 phút
  const [isPaid, setIsPaid] = useState(false);
  const [subscriptionPurchased, setSubscriptionPurchased] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [currentOrderId, setCurrentOrderId] = useState<number | null>(null); // State to store order_id

  const getParam = (val: string | string[] | undefined) =>
    Array.isArray(val) ? val[0] : val || "";

  // Correctly get and parse parameters
  const planId = getParam(params.planId);
  const planName = getParam(params.planName);
  const planCode = getParam(params.planCode); // This should be "classic" or "pro"
  const monthsParam = getParam(params.months) || "1";
  const priceParam = getParam(params.price) || "0";
  
  const months = parseInt(monthsParam, 10);
  const price = parseInt(priceParam, 10);
  const totalPrice = price * months;
  const subscriptionCode = useMemo(() => `SUB${Date.now()}`, []);

  // Thông tin ngân hàng và mã QR
  const bankId = "970436";  // Agribank
  const accountNo = "1031505171";
  const accountName = "LaanLee";
  const qrCodeUrl = `https://img.vietqr.io/image/${bankId}-${accountNo}-compact.png?amount=${totalPrice}&addInfo=${subscriptionCode}&accountName=${accountName}`;

  useEffect(() => {
    const fetchUserInfoAndCreateOrder = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (token) {
          const userInfo = await getUserInfo(); // Assuming getUserInfo fetches logged-in user's details
          if (userInfo && userInfo.user_id) {
            setUserId(userInfo.user_id.toString());
            // Create pending order
            const pendingOrderPayload = {
              user_id: userInfo.user_id,
              subscription_code: subscriptionCode,
              plan: planCode, // 'classic' or 'pro'
              plan_display_name: planName, // <<< ADDED: Pass planName as plan_display_name
              months: months,
              total_cost: totalPrice,
              payment_method: 'banking'
            };
            console.log('Creating pending order with payload:', pendingOrderPayload);
            const createdOrder = await createSubscriptionPendingOrder(
              pendingOrderPayload.user_id.toString(),
              pendingOrderPayload.subscription_code,
              pendingOrderPayload.plan,
              pendingOrderPayload.plan_display_name, // <<< ADDED: Pass plan_display_name
              pendingOrderPayload.months,
              pendingOrderPayload.total_cost,
              pendingOrderPayload.payment_method
            );
            console.log('Pending order created for subscription code:', subscriptionCode, 'Order ID:', createdOrder.order_id);
            if (createdOrder && createdOrder.order_id) {
              setCurrentOrderId(createdOrder.order_id); // Store the order_id
            } else {
              Alert.alert("Lỗi", "Không nhận được ID đơn hàng từ máy chủ.");
              router.back();
              return; // Stop further execution if order_id is not received
            }
          } else {
            Alert.alert("Lỗi", "Không thể lấy thông tin người dùng để tạo đơn hàng.");
            router.back();
          }
        } else {
          Alert.alert("Lỗi", "Bạn chưa đăng nhập.");
          router.replace("/customer"); // Or your login screen
        }
      } catch (error) {
        console.error("Error fetching user info or creating pending order:", error);
        Alert.alert("Lỗi", "Không thể khởi tạo đơn hàng. Vui lòng thử lại.");
        router.back();
      }
    };

    fetchUserInfoAndCreateOrder();

    // Bắt đầu đếm ngược
    timerRef.current = setInterval(() => {
      setCountdown(t => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          onExpire();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const notify = (msg: string) => {
    if (Platform.OS === "android") ToastAndroid.show(msg, ToastAndroid.SHORT);
    else Alert.alert("Thông báo", msg);
  };

  const onExpire = async () => {
    if (subscriptionPurchased) return;
    
    if (!currentOrderId) {
      console.warn("onExpire: currentOrderId is null, cannot update status to expired.");
      // Optionally, still show the alert to the user
      Alert.alert(
        "Hết thời gian thanh toán", 
        "Phiên thanh toán đã hết hạn. Bạn có muốn tạo phiên thanh toán mới không?",
        [
          {
            text: "Hủy",
            onPress: () => router.push('/owner/subscriptions'),
            style: "cancel"
          },
          {
            text: "Tạo mới",
            onPress: () => {
              router.replace({
                pathname: "/owner/subscription-payment",
                params: { 
                  planId: planId,
                  planName: planName,
                  planCode: planCode,
                  months: monthsParam, 
                  price: priceParam,   
                }
              });
            }
          }
        ]
      );
      return;
    }

    try {
      // Update order status to 'expired' using order_id
      await updateSubscriptionOrderStatus(currentOrderId.toString(), 'expired');
      console.log('Subscription order expired:', currentOrderId);
    } catch (error) {
      console.error("Error updating order status to expired:", error);
      // Continue with user notification even if API call fails
    }

    Alert.alert(
      "Hết thời gian thanh toán", 
      "Phiên thanh toán đã hết hạn. Bạn có muốn tạo phiên thanh toán mới không?",
      [
        {
          text: "Hủy",
          onPress: () => router.push('/owner/subscriptions'),
          style: "cancel"
        },
        {
          text: "Tạo mới",
          onPress: () => {
            router.replace({
              pathname: "/owner/subscription-payment",
              params: { 
                planId: planId,
                planName: planName,
                planCode: planCode,
                months: monthsParam, 
                price: priceParam,   
              }
            });
          }
        }
      ]
    );
  };

  const handleMarkAsPaid = async () => {
    if (isPaid || loading) return;
    
    if (!currentOrderId) {
      Alert.alert("Lỗi", "Không tìm thấy ID đơn hàng để cập nhật. Vui lòng thử tạo lại đơn hàng.");
      setLoading(false);
      return;
    }

    console.log("[SubscriptionPayment] handleMarkAsPaid: Called. Order ID:", currentOrderId, "planCode:", planCode, "months:", months); // Log call
    setLoading(true); 
    
    try {
      // Validate planCode against 'standard' and 'premium'
      if (!planCode || (planCode !== "standard" && planCode !== "premium")) {
          Alert.alert("Lỗi", `Gói đăng ký không hợp lệ. Mã gói nhận được: '${planCode}'. Vui lòng đảm bảo mã gói là 'standard' hoặc 'premium'.`);
          setLoading(false);
          return;
      }
      
      console.log("[SubscriptionPayment] handleMarkAsPaid: Calling updateSubscriptionOrderStatus with 'paid' for order ID:", currentOrderId); // Log API call
      const response = await updateSubscriptionOrderStatus(currentOrderId.toString(), 'paid');
      console.log("[SubscriptionPayment] handleMarkAsPaid: API response:", response); // Log API response
      
      setSubscriptionPurchased(true); 
      setIsPaid(true); 
      
      Alert.alert(
        "Xác nhận thành công", 
        "Yêu cầu thanh toán của bạn đã được ghi nhận. Gói sẽ được kích hoạt sau khi quản trị viên xác nhận.",
        [
          {
            text: "OK",
            onPress: () => router.replace('/owner/subscriptions')
          }
        ]
      );
    } catch (error: any) {
      console.error("[SubscriptionPayment] handleMarkAsPaid: Error:", error); // Log error
      Alert.alert("Lỗi", `Có lỗi xảy ra khi xác nhận thanh toán: ${error.message || 'Vui lòng thử lại.'}`);
    } finally {
      console.log("[SubscriptionPayment] handleMarkAsPaid: Finally block. Setting loading to false."); // Log finally
      setLoading(false);
    }
  };

  const handleCancelPayment = async () => {
    if (loading) return;

    if (!currentOrderId) {
      Alert.alert("Lỗi", "Không tìm thấy ID đơn hàng để hủy. Vui lòng thử lại.");
      return;
    }

    setLoading(true);
    try {
      console.log("[SubscriptionPayment] handleCancelPayment: Calling updateSubscriptionOrderStatus with 'cancelled' for order ID:", currentOrderId);
      await updateSubscriptionOrderStatus(currentOrderId.toString(), 'cancelled');
      console.log("[SubscriptionPayment] handleCancelPayment: Order cancelled successfully.");

      Alert.alert(
        "Thông báo",
        "Đơn hàng đã được hủy.",
        [
          {
            text: "OK",
            onPress: () => router.replace('/owner/subscriptions')
          }
        ]
      );
    } catch (error: any) {
      console.error("[SubscriptionPayment] handleCancelPayment: Error:", error);
      Alert.alert("Lỗi", `Có lỗi xảy ra khi hủy đơn hàng: ${error.message || 'Vui lòng thử lại.'}`);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") + " VND";
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <AntDesign name="arrowleft" size={24} color="green" />
          </TouchableOpacity>
          <Text style={styles.title}>Xác nhận thanh toán</Text>
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.sectionTitle}>Mã đơn hàng: {subscriptionCode}</Text>
          <Text style={styles.infoItem}>Gói đăng ký: <Text style={styles.highlight}>{planName}</Text></Text>
          <Text style={styles.infoItem}>Thời hạn: <Text style={styles.highlight}>{months} tháng</Text></Text>
          <Text style={styles.infoItem}>Giá/tháng: <Text style={styles.highlight}>{formatPrice(price)}</Text></Text>
          <Text style={styles.totalPrice}>Tổng tiền: {formatPrice(totalPrice)}</Text>
        </View>

        <View style={styles.qrContainer}>
          <Text style={styles.sectionTitle}>
            Thời gian còn lại: {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, "0")}
          </Text>
          <Text style={styles.qrTitle}>Quét mã QR để thanh toán</Text>
          <Image source={{ uri: qrCodeUrl }} style={styles.qrCode} />
        </View>

        <View style={styles.instructionContainer}>
          <Text style={styles.instructionTitle}>Hướng dẫn thanh toán:</Text>
          <Text style={styles.instructionText}>1. Mở ứng dụng ngân hàng hoặc ví điện tử</Text>
          <Text style={styles.instructionText}>2. Quét mã QR ở trên</Text>
          <Text style={styles.instructionText}>3. Xác nhận thanh toán số tiền {formatPrice(totalPrice)}</Text>
          <Text style={styles.instructionText}>4. Chọn "Xác nhận đã thanh toán" bên dưới</Text>
          <Text style={styles.instructionText}>5. Hoặc chọn "Hủy thanh toán" nếu bạn không muốn tiếp tục.</Text>
        </View>

        <TouchableOpacity 
          onPress={handleMarkAsPaid} 
          style={[
            styles.payButton,
            (isPaid || loading) && styles.disabledButton // Disable if already paid or loading
          ]}
          disabled={isPaid || loading} // Disable if already paid or loading
        >
          {loading && !isPaid ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.payButtonText}>Xác nhận đã thanh toán</Text>
          )}
        </TouchableOpacity>

        {!isPaid && (
          <TouchableOpacity 
            onPress={handleCancelPayment} 
            style={[
              styles.cancelButton,
              loading && styles.disabledButton
            ]}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#dc3545" size="small" />
            ) : (
              <Text style={styles.cancelButtonText}>Hủy thanh toán</Text>
            )}
          </TouchableOpacity>
        )}

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#fff" 
  },
  scrollContainer: { 
    padding: 16,
    paddingBottom: 40 
  },
  header: { 
    flexDirection: "row", 
    alignItems: "center", 
    marginBottom: 20 
  },
  title: { 
    fontSize: 20, 
    fontWeight: "bold", 
    marginLeft: 10 
  },
  infoContainer: { 
    padding: 16, 
    borderWidth: 1, 
    borderColor: "#e0e0e0",
    borderRadius: 8, 
    marginBottom: 20,
    backgroundColor: "#f9f9f9"
  },
  sectionTitle: { 
    fontSize: 16, 
    fontWeight: "bold", 
    marginBottom: 12,
    color: "#333"
  },
  infoItem: {
    fontSize: 15,
    marginBottom: 8,
    color: "#555"
  },
  highlight: {
    fontWeight: "bold",
    color: "#42ba96"
  },
  totalPrice: { 
    fontSize: 18, 
    fontWeight: "bold", 
    marginTop: 10,
    color: "#16A34A"
  },
  qrContainer: { 
    alignItems: "center", 
    marginVertical: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    backgroundColor: "#fff"
  },
  qrTitle: { 
    fontSize: 16, 
    fontWeight: "600", 
    marginBottom: 15,
    color: "#333" 
  },
  qrCode: { 
    width: 220, 
    height: 220,
    borderRadius: 8
  },
  instructionContainer: {
    padding: 16,
    marginBottom: 20,
    backgroundColor: "#f0fdf4",
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#16A34A"
  },
  instructionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333"
  },
  instructionText: {
    fontSize: 14,
    marginBottom: 6,
    color: "#555",
    lineHeight: 20
  },
  payButton: { 
    backgroundColor: "#16A34A", 
    paddingVertical: 14, 
    borderRadius: 8, 
    alignItems: "center", 
    marginBottom: 12 
  },
  cancelButton: {
    backgroundColor: '#f8f9fa', // Light grey background
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10, // Add some space above the cancel button
    borderWidth: 1,
    borderColor: '#dc3545' // Red border
  },
  cancelButtonText: {
    color: '#dc3545', // Red text
    fontSize: 16,
    fontWeight: "bold",
  },
  disabledButton: {
    backgroundColor: "#94d3a2",
    opacity: 0.8
  },
  payButtonText: { 
    color: "white", 
    fontSize: 16, 
    fontWeight: "bold" 
  }
});

export default SubscriptionPayment;
