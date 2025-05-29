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
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  createPendingOrder,
  getUserInfo,
  formatCurrency,
  getOrderStatus,
  createBooking,
  deletePendingOrder,
  updateOrderStatus,
} from "@/constants/apiService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import moment from "moment";
import { AntDesign } from "@expo/vector-icons";

const ConfirmPay = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isUnmountedRef = useRef(false);
  const confirmingRef = useRef(false);
  const pendingCreatedRef = useRef(false);
  const hasNavigatedRef = useRef(false); // ✅ New: để chặn gọi hàm sau khi đã chuyển màn

  const [countdown, setCountdown] = useState(30);
  const [isPaid, setIsPaid] = useState(false);
  const [bookingCreated, setBookingCreated] = useState(false);
  const [expiredHandled, setExpiredHandled] = useState(false);

  const getParam = (val: string | string[] | undefined) =>
    Array.isArray(val) ? val[0] : val || "";
  const bookingCode = getParam(params.booking_code);
  const fieldId = getParam(params.fieldId);
  const fieldName = getParam(params.fieldName);
  const fieldType = getParam(params.fieldType);
  const selectedDate = getParam(params.date);
  const timeSlots = JSON.parse(getParam(params.timeSlots)) as string[];
  const price = getParam(params.price);
  const extraService = getParam(params.extraService);
  const extraPrice = getParam(params.extraPrice);
  const totalPrice = parseFloat(price || "0") + (extraPrice ? parseFloat(extraPrice) : 0);

  const slotData = timeSlots.map(slot => {
    const [start, end] = slot.split(" - ");
    return {
      startTime: moment(`${selectedDate} ${start}`, "DD/MM HH:mm").format("YYYY-MM-DD HH:mm:ss"),
      endTime: moment(`${selectedDate} ${end}`, "DD/MM HH:mm").format("YYYY-MM-DD HH:mm:ss"),
    };
  });

  const bankId = "970436";
  const accountNo = "1031505171";
  const accountName = "LaanLee";
  const qrCodeUrl = `https://img.vietqr.io/image/${bankId}-${accountNo}-compact.png?amount=${totalPrice}&addInfo=${bookingCode}&accountName=${accountName}`;

  useEffect(() => {
    (async () => {
      if (pendingCreatedRef.current) return;
      pendingCreatedRef.current = true;

      const token = await AsyncStorage.getItem("token");
      if (!token) return;

      const user = await getUserInfo();
      const services = extraService
        ? extraService.split(", ").map(s => ({ serviceId: parseInt(s.split("-")[1] || "0"), quantity: 1 }))
        : [];

      try {
        await createPendingOrder(
          fieldId,
          user.user_id,
          bookingCode,
          selectedDate,
          slotData,
          totalPrice,
          services,
          "vnpay"
        );
      } catch (e: any) {
        if (e.message?.includes("Duplicate entry")) {
          console.log("⚠️ Đơn hàng đã tồn tại. Bỏ qua việc tạo lại.");
        } else {
          console.error("❌ Lỗi khác khi tạo đơn:", e);
        }
      }
    })();
  }, []);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setCountdown(t => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          if (!isUnmountedRef.current && !hasNavigatedRef.current) onExpire();
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timerRef.current!);
      isUnmountedRef.current = true;
    };
  }, []);

  const notify = (msg: string) => {
    if (Platform.OS === "android") ToastAndroid.show(msg, ToastAndroid.SHORT);
    else Alert.alert("Thông báo", msg);
  };

  const onExpire = async () => {
    if (expiredHandled || bookingCreated || isUnmountedRef.current || confirmingRef.current || hasNavigatedRef.current) return;
    setExpiredHandled(true);
    try {
      const { status } = await getOrderStatus(bookingCode);
      if (status === "paid") {
        if (!bookingCreated) await confirmBooking();
      } else {
        await deletePendingOrder(bookingCode);
        Alert.alert("⏰ Hết thời gian", "Đơn hàng đã bị huỷ.");
        hasNavigatedRef.current = true;
        router.push('/customer/dashboard');
      }
    } catch {
      Alert.alert("Lỗi", "Không thể xử lý hết thời gian.");
      hasNavigatedRef.current = true;
      router.push('/customer/dashboard');
    }
  };

  const handleMarkAsPaid = async () => {
    if (isPaid) return;
    setIsPaid(true);
    try {
      await updateOrderStatus(bookingCode, 'paid');
      notify('✅ Đã chuyển trạng thái đơn hàng sang paid');
    } catch {
      notify('❌ Lỗi cập nhật trạng thái');
    }
  };

  const handleCheckStatus = async () => {
    if (bookingCreated) {
      notify('Đơn đã được tạo trước đó');
      return;
    }
    try {
      const { status } = await getOrderStatus(bookingCode);
      if (status === 'paid') {
        await confirmBooking();
      } else {
        notify('⏳ Giao dịch chưa được ghi nhận');
      }
    } catch {
      notify('Lỗi kiểm tra trạng thái thanh toán');
    }
  };

  const confirmBooking = async () => {
    if (bookingCreated || confirmingRef.current) return;
    confirmingRef.current = true;
    try {
      const user = await getUserInfo();
      const services = extraService
        ? extraService.split(', ').map(s => ({ serviceId: parseInt(s.split('-')[1] || '0'), quantity: 1 }))
        : [];
      await Promise.all(
        slotData.map(slot =>
          createBooking(
            fieldId,
            user.user_id,
            bookingCode,
            slot.startTime,
            slot.endTime,
            totalPrice / slotData.length,
            services,
            'vnpay'
          )
        )
      );
      setBookingCreated(true);
      Alert.alert('✅ Thành công', 'Đặt sân thành công.');
      hasNavigatedRef.current = true;
      router.push('/customer/dashboard');
    } catch (e) {
      console.error('Booking error', e);
      Alert.alert('Lỗi', 'Không thể tạo booking.');
    } finally {
      confirmingRef.current = false;
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => {
              if (!isPaid && !bookingCreated) {
                Alert.alert(
                  '⚠️ Chưa thanh toán',
                  'Đơn hàng của bạn chưa được thanh toán. Bạn có muốn huỷ đơn không?',
                  [
                    { text: 'Tiếp tục thanh toán', style: 'cancel' },
                    {
                      text: 'Huỷ đơn',
                      style: 'destructive',
                      onPress: async () => {
                        try {
                          clearInterval(timerRef.current!);
                          isUnmountedRef.current = true;
                          await deletePendingOrder(bookingCode);
                        } catch (e) {
                          console.error("Lỗi huỷ đơn:", e);
                        }
                        hasNavigatedRef.current = true;
                        router.push('/customer/dashboard');
                      },
                    },
                  ]
                );
              } else {
                hasNavigatedRef.current = true;
                router.back();
              }
            }}
          >
            <AntDesign name="arrowleft" size={24} color="green" />
          </TouchableOpacity>

          <Text style={styles.title}>Xác nhận thanh toán</Text>
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.sectionTitle}>Mã đơn hàng: {bookingCode}</Text>
          <Text>Tên sân: {fieldName}</Text>
          <Text>Loại sân: {fieldType}</Text>
          <Text>Ngày: {selectedDate}</Text>
          <Text>Khung giờ:</Text>
          {timeSlots.map((slot, idx) => <Text key={idx}>- {slot}</Text>)}
          <Text style={styles.price}>Giá sân: {formatCurrency(price)}</Text>
          {extraService && <>
            <Text>Dịch vụ thêm: {extraService}</Text>
            <Text style={styles.price}>Giá dịch vụ: {formatCurrency(extraPrice)}</Text>
          </>}
          <Text style={styles.totalPrice}>Tổng tiền: {formatCurrency(totalPrice)}</Text>
        </View>

        <View style={styles.qrContainer}>
          <Text style={styles.sectionTitle}>
            Thời gian còn lại: {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, "0")}
          </Text>
          <Text style={styles.qrTitle}>Quét mã QR để thanh toán</Text>
          <Image source={{ uri: qrCodeUrl }} style={styles.qrCode} />
        </View>

        <TouchableOpacity onPress={handleMarkAsPaid} style={styles.checkButton}>
          <Text style={styles.checkText}>Thanh toán</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleCheckStatus} style={styles.checkButtonSecondary}>
          <Text style={styles.checkText}>Kiểm tra trạng thái</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

export default ConfirmPay;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  scrollContainer: { paddingBottom: 20 },
  header: { flexDirection: "row", alignItems: "center", padding: 16 },
  title: { fontSize: 18, fontWeight: "bold", marginLeft: 8 },
  infoContainer: { padding: 16, borderWidth: 1, borderRadius: 8, marginBottom: 10 },
  sectionTitle: { fontSize: 16, fontWeight: "bold", marginVertical: 8 },
  countdown: { fontSize: 20, fontWeight: "bold", color: "#EF4444" },
  price: { fontWeight: "bold", color: "green" },
  totalPrice: { fontSize: 18, fontWeight: "bold", marginTop: 10 },
  qrContainer: { alignItems: "center", marginVertical: 20 },
  qrTitle: { fontSize: 16, fontWeight: "bold", marginBottom: 10 },
  qrCode: { width: 200, height: 200 },
  checkButton: { backgroundColor: "#16A34A", padding: 14, borderRadius: 8, alignItems: "center", marginVertical: 10 },
  checkButtonSecondary: { backgroundColor: "#f59e0b", padding: 14, borderRadius: 8, alignItems: "center", marginBottom: 20 },
  checkText: { color: "white", fontSize: 16, fontWeight: "bold" },
});
