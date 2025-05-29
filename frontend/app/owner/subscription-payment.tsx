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
  deleteSubscriptionPendingOrder,
  fetchAPI,
} from "@/constants/apiService";
import { API_ENDPOINTS } from "@/constants/apiConfig";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AntDesign } from "@expo/vector-icons";

const SubscriptionPayment = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const fetchOrderPromiseRef = useRef<Promise<number | null> | null>(null); // Store promise resolving to order_id or null
 
  const [isPaid, setIsPaid] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  const [countdown, setCountdown] = useState(60); // 1 minute countdown
  const [subscriptionPurchased, setSubscriptionPurchased] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [currentOrderId, setCurrentOrderId] = useState<number | null>(null); // State to store order_id

  const getParam = (val: string | string[] | undefined) =>
    Array.isArray(val) ? val[0] : val || "";

  // Correctly get and parse parameters
  const planId = getParam(params.planId);
  const planName = getParam(params.planName);
  const planCode = getParam(params.planCode); 
  const monthsParam = getParam(params.months);
  const priceParam = getParam(params.price) || "0";
  
  const months = parseInt(monthsParam, 10);
  const price = parseInt(priceParam, 10);
  const totalPrice = price * months;
  const subscriptionCode = useMemo(() => `SUB${Date.now()}`, [planId, months, price]); // Regenerate if key params change

  // Thông tin ngân hàng và mã QR
  const bankId = "970436";  // Agribank
  const accountNo = "1031505171";
  const accountName = "LaanLee";
  const qrCodeUrl = `https://img.vietqr.io/image/${bankId}-${accountNo}-compact.png?amount=${totalPrice}&addInfo=${subscriptionCode}&accountName=${accountName}`;
  
  useEffect(() => {
    // Reset states for a new payment session
    setIsPaid(false);
    setIsExpired(false);
    setSubscriptionPurchased(false);
    setLoading(false);
    setCurrentOrderId(null);
    setCountdown(60); // Reset countdown (e.g., 1 minute)

    const fetchUserInfoAndCreateOrder = async (): Promise<number | null> => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (token) {
          const userInfo = await getUserInfo();
          if (userInfo && userInfo.user_id) {
            setUserId(userInfo.user_id.toString());
            const pendingOrderPayload = {
              user_id: userInfo.user_id,
              subscription_code: subscriptionCode,
              plan: planCode, 
              plan_display_name: planName, 
              months: months,
              total_cost: totalPrice,
              payment_method: 'banking'
            };
            console.log('Creating pending order with payload:', pendingOrderPayload);
            const createdOrder = await createSubscriptionPendingOrder(
              pendingOrderPayload.user_id.toString(),
              pendingOrderPayload.subscription_code,
              pendingOrderPayload.plan,
              pendingOrderPayload.plan_display_name, 
              pendingOrderPayload.months,
              pendingOrderPayload.total_cost,
              pendingOrderPayload.payment_method
            );
            console.log('Pending order created for subscription code:', subscriptionCode, 'Order ID:', createdOrder.order_id);
            if (createdOrder && createdOrder.order_id) {
              setCurrentOrderId(createdOrder.order_id); // Store the order_id
              return createdOrder.order_id; // Return order_id
            } else {
              Alert.alert("Lỗi", "Không nhận được ID đơn hàng từ máy chủ.");
              router.back();
              return null; // Return null on failure
            }
          } else {
            Alert.alert("Lỗi", "Không thể lấy thông tin người dùng để tạo đơn hàng.");
            router.back();
            return null; // Return null on failure
          }
        } else {
          Alert.alert("Lỗi", "Bạn chưa đăng nhập.");
          router.replace("/customer"); // Or your login screen
          return null; // Return null on failure
        }
      } catch (error) {
        console.error("Error fetching user info or creating pending order:", error);
        Alert.alert("Lỗi", "Không thể khởi tạo đơn hàng. Vui lòng thử lại.");
        router.back();
        return null; // Return null on failure
      }
    };

    fetchOrderPromiseRef.current = fetchUserInfoAndCreateOrder();

    // Bắt đầu đếm ngược
    if (timerRef.current) clearInterval(timerRef.current); // Clear existing timer
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
  }, [planId, planName, planCode, monthsParam, priceParam, subscriptionCode]); // Added subscriptionCode and other relevant params

  const notify = (msg: string) => {
    if (Platform.OS === "android") ToastAndroid.show(msg, ToastAndroid.SHORT);
    else Alert.alert("Thông báo", msg);
  };
  const onExpire = async () => {
    if (subscriptionPurchased) return;
    
    setIsExpired(true);
    let orderIdToUpdate: number | null = null;

    if (fetchOrderPromiseRef.current) {
      try {
        console.log("onExpire: Awaiting fetchOrderPromiseRef.current");
        orderIdToUpdate = await fetchOrderPromiseRef.current;
        console.log("onExpire: fetchOrderPromiseRef.current resolved with:", orderIdToUpdate);
      } catch (e) {
        console.error("onExpire: Error awaiting fetchOrderPromiseRef.current:", e);
      }
    }

    // If orderIdToUpdate is still null, try getting it from state as a fallback,
    // though ideally, the promise should provide it.
    if (!orderIdToUpdate) {
        orderIdToUpdate = currentOrderId; 
    }
    
    if (!orderIdToUpdate) {
      console.warn("onExpire: orderIdToUpdate is null after awaiting promise and checking state. Cannot update status to expired.");
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
    }    try {
      console.log('Attempting to update order status to expired for order ID:', orderIdToUpdate);
      // Update order status to 'expired' using order_id with correct parameter name
      const response = await fetchAPI(`${API_ENDPOINTS.UPDATE_SUBSCRIPTION_ORDER_STATUS}/${orderIdToUpdate}`, "POST", { new_status: 'expired' });
      console.log('Subscription order expired:', orderIdToUpdate, 'Response:', response);
      
      // Đảm bảo trạng thái đã được cập nhật thành công
      if (!response || response.error) {
        console.error("Failed to update order status to expired:", response?.error || "No response");
        // Thử lại một lần nữa nếu có lỗi
        try {
          const retryResponse = await fetchAPI(`${API_ENDPOINTS.UPDATE_SUBSCRIPTION_ORDER_STATUS}/${orderIdToUpdate}`, "POST", { new_status: 'expired' });
          console.log('Second attempt to expire subscription succeeded:', retryResponse);
        } catch (retryErr) {
          console.error("Second attempt to update order status failed:", retryErr);
        }
      }
    } catch (error) {
      console.error("Error updating order status to expired:", error);
      // Thử lại một lần nữa ngay cả khi lần đầu thất bại
      try {
        const retryResponse = await fetchAPI(`${API_ENDPOINTS.UPDATE_SUBSCRIPTION_ORDER_STATUS}/${orderIdToUpdate}`, "POST", { new_status: 'expired' });
        console.log('Second attempt to expire subscription succeeded after error:', retryResponse);
      } catch (retryErr) {
        console.error("Second attempt to update order status failed after error:", retryErr);
      }
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
  };  const handleMarkAsPaid = async () => {
  // Check if payment is already made, loading, or expired
  if (isPaid || loading || isExpired) {
    if (isExpired && Platform.OS === "android") {
      ToastAndroid.show("Đơn hàng đã hết hạn, không thể thanh toán", ToastAndroid.SHORT);
    } else if (isExpired) {
      console.log("Đơn hàng đã hết hạn, không thể thanh toán");
    }
    return;
  }

  if (!currentOrderId) {
    if (Platform.OS === "android") {
      ToastAndroid.show("Không tìm thấy ID đơn hàng để cập nhật.", ToastAndroid.SHORT);
    } else {
      console.log("Không tìm thấy ID đơn hàng để cập nhật.");
    }
    return;
  }

  console.log("[SubscriptionPayment] handleMarkAsPaid: Called. Order ID:", currentOrderId, "planCode:", planCode, "months:", months);
  setLoading(true);

  try {
    // Kiểm tra planCode hợp lệ
    if (!planCode || (planCode !== "standard" && planCode !== "premium")) {
      if (Platform.OS === "android") {
        ToastAndroid.show(`Gói không hợp lệ: ${planCode}`, ToastAndroid.SHORT);
      } else {
        console.log(`Gói không hợp lệ: ${planCode}`);
      }
      setLoading(false);
      return;
    }    // Gọi API cập nhật trạng thái đơn hàng
    const response = await fetchAPI(`${API_ENDPOINTS.UPDATE_SUBSCRIPTION_ORDER_STATUS}/${currentOrderId}`, "POST", { new_status: 'paid' });
    console.log("[handleMarkAsPaid] API response:", response);

    setSubscriptionPurchased(true);
    setIsPaid(true);

    // Hiển thị thông báo thành công
    if (Platform.OS === "android") {
      ToastAndroid.show("✅ Xác nhận thành công! Đang chuyển trang...", ToastAndroid.SHORT);
    } else {
      console.log("✅ Xác nhận thành công! Đang chuyển trang...");
    }

    // Chuyển sang màn subscriptions sau 2 giây
    setTimeout(() => {
      router.replace('/owner/subscriptions');
    }, 2000);

  } catch (error: any) {
    console.error("[handleMarkAsPaid] Error:", error);
    if (Platform.OS === "android") {
      ToastAndroid.show("❌ Có lỗi khi xác nhận thanh toán", ToastAndroid.SHORT);
    } else {
      console.log("❌ Có lỗi khi xác nhận thanh toán");
    }
  } finally {
    setLoading(false);
  }
};

  const handleCancelPayment = async () => {
  if (loading) return;

  if (!subscriptionCode) {
    if (Platform.OS === "android") {
      ToastAndroid.show("Không tìm thấy mã đơn hàng để hủy.", ToastAndroid.SHORT);
    } else {
      console.log("Không tìm thấy mã đơn hàng để hủy.");
    }
    return;
  }

  setLoading(true);
  try {
    console.log("[SubscriptionPayment] handleCancelPayment: Deleting pending subscription order with code:", subscriptionCode);
    
    // Sử dụng API xóa đơn hàng thay vì chỉ cập nhật trạng thái
    await deleteSubscriptionPendingOrder(subscriptionCode);
    
    // Thông báo thành công
    if (Platform.OS === "android") {
      ToastAndroid.show("✅ Đơn hàng đã được hủy. Đang chuyển trang...", ToastAndroid.SHORT);
    } else {
      console.log("✅ Đơn hàng đã được hủy. Đang chuyển trang...");
    }

    // Chuyển trang sau 1.5s
    setTimeout(() => {
      router.replace('/owner/subscriptions');
    }, 1500);
    
  } catch (error: any) {
    console.error("[SubscriptionPayment] handleCancelPayment: Error:", error);
    if (Platform.OS === "android") {
      ToastAndroid.show("❌ Có lỗi xảy ra khi hủy đơn hàng", ToastAndroid.SHORT);
    } else {
      console.log("❌ Có lỗi xảy ra khi hủy đơn hàng");
    }
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
        </View>        <TouchableOpacity 
          onPress={handleMarkAsPaid} 
          style={[
            styles.payButton,
            (isPaid || loading || isExpired) && styles.disabledButton // Disable if already paid, loading, or expired
          ]}
          disabled={isPaid || loading || isExpired} // Disable if already paid, loading, or expired
        >
          {loading && !isPaid ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : isExpired ? (
            <Text style={styles.payButtonText}>Hết thời gian thanh toán</Text>
          ) : (
            <Text style={styles.payButtonText}>Xác nhận đã thanh toán</Text>
          )}
        </TouchableOpacity>{!isPaid && (
          <TouchableOpacity 
            onPress={handleCancelPayment} 
            style={[
              styles.cancelButton,
              loading && styles.disabledButton // Chỉ vô hiệu hóa khi loading, không vô hiệu hóa khi isExpired
            ]}
            disabled={loading} // Chỉ vô hiệu hóa khi loading, KHÔNG vô hiệu hóa khi isExpired
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
