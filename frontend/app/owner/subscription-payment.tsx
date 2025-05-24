import React, { useState, useEffect, useRef } from "react";
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

  const getParam = (val: string | string[] | undefined) =>
    Array.isArray(val) ? val[0] : val || "";
    
  const plan = getParam(params.plan);
  const planName = getParam(params.planName);
  const months = parseInt(getParam(params.months) || "1", 10);
  const price = parseInt(getParam(params.price) || "0", 10);
  const totalPrice = price * months;
  const subscriptionCode = `SUB${Date.now()}`;
  
  // Thông tin ngân hàng và mã QR
  const bankId = "970436";  // Agribank
  const accountNo = "1031505171";
  const accountName = "LaanLee";
  const qrCodeUrl = `https://img.vietqr.io/image/${bankId}-${accountNo}-compact.png?amount=${totalPrice}&addInfo=${subscriptionCode}&accountName=${accountName}`;

  useEffect(() => {
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
                plan,
                planName,
                months,
                price
              }
            });
          }
        }
      ]
    );
  };

  const handleMarkAsPaid = async () => {
    if (isPaid || loading) return;
    
    setIsPaid(true);
    setLoading(true);
    
    try {
      // Gọi API để mua subscription
      await purchaseSubscription(plan.toLowerCase(), months);
      
      setSubscriptionPurchased(true);
      setLoading(false);
      
      // Hiển thị thông báo thành công
      Alert.alert(
        "Thanh toán thành công", 
        "Gói đăng ký của bạn đã được kích hoạt thành công!",
        [
          {
            text: "OK",
            onPress: () => router.push('/owner/subscriptions')
          }
        ]
      );
    } catch (error) {
      console.error("Lỗi khi thanh toán:", error);
      setIsPaid(false);
      setLoading(false);
      notify("Có lỗi xảy ra khi xử lý thanh toán. Vui lòng thử lại.");
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
        </View>

        <TouchableOpacity 
          onPress={handleMarkAsPaid} 
          style={[
            styles.payButton,
            (isPaid || loading) && styles.disabledButton
          ]}
          disabled={isPaid || loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.payButtonText}>
              {isPaid ? "Đang xử lý..." : "Xác nhận đã thanh toán"}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()} style={styles.cancelButton}>
          <Text style={styles.cancelButtonText}>Hủy thanh toán</Text>
        </TouchableOpacity>
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
  disabledButton: {
    backgroundColor: "#94d3a2",
    opacity: 0.8
  },
  payButtonText: { 
    color: "white", 
    fontSize: 16, 
    fontWeight: "bold" 
  },
  cancelButton: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e0e0e0"
  },
  cancelButtonText: {
    color: "#555",
    fontSize: 16
  }
});

export default SubscriptionPayment;
