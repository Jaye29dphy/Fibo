import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet, Alert, ScrollView } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { createPendingOrder, getUserInfo, formatCurrency, getOrderStatus, createBooking, deletePendingOrder, updateOrderStatus } from "@/constants/apiService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import moment from "moment";
import { AntDesign } from "@expo/vector-icons";

const ConfirmPay = () => {
  const router = useRouter();
  const params = useLocalSearchParams();

  const getStringParam = (value: string | string[] | undefined): string => {
    return Array.isArray(value) ? value[0] : value || "";
  };

  const booking_code = getStringParam(params.booking_code);
  const fieldId = getStringParam(params.fieldId);
  const fieldName = getStringParam(params.fieldName);
  const fieldType = getStringParam(params.fieldType);
  const selectedDate = getStringParam(params.date);
  const selectedTimeSlots = JSON.parse(getStringParam(params.timeSlots)) as string[];
  const price = getStringParam(params.price);
  const extraService = getStringParam(params.extraService);
  const extraPrice = getStringParam(params.extraPrice);

  const totalPrice = parseFloat(price || "0") + (extraPrice ? parseFloat(extraPrice) : 0);
  const [selectedPayment, setSelectedPayment] = useState<string>("VNPay");
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(60); 

  const bankId = "970436";
  const accountNo = "1031505171";
  const accountName = "LaanLee";

  const qrCodeUrl = `https://img.vietqr.io/image/${bankId}-${accountNo}-compact.png?amount=${totalPrice}&addInfo=${booking_code}&accountName=${accountName}`;

  const timeSlotData = selectedTimeSlots.map((slot) => {
    const [startTimeStr, endTimeStr] = slot.split(" - ");
    return {
      startTime: moment(`${selectedDate} ${startTimeStr}`, "DD/MM HH:mm").format("YYYY-MM-DD HH:mm:ss"),
      endTime: moment(`${selectedDate} ${endTimeStr}`, "DD/MM HH:mm").format("YYYY-MM-DD HH:mm:ss"),
    };
  });

  useEffect(() => {
    const init = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (!token) return;

        const userInfo = await getUserInfo();
        const user_Id = userInfo.user_id;

        const services = extraService
          ? extraService.split(", ").map((serviceName) => ({
            serviceId: parseInt(serviceName.split("-")[1] || "0"),
            quantity: 1,
          }))
          : [];

        await createPendingOrder(
          fieldId,
          user_Id,
          booking_code,
          selectedDate,
          timeSlotData,
          totalPrice,
          services,
          selectedPayment.toLowerCase().replaceAll(" ", "_")
        );
      } catch (err) {
        console.error("Không thể tạo đơn pending ban đầu", err);
      }
    };

    init();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleExpire();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleExpire = async () => {
    const status = await checkPaymentStatus(false);
    if (status !== "paid") {
      try {
        await deletePendingOrder(booking_code);
        Alert.alert("⏰ Hết thời gian", "Đơn hàng đã bị huỷ do quá 5 phút mà chưa thanh toán.");
        router.push("/customer/dashboard");
      } catch (err) {
        console.error("Lỗi khi xoá đơn hết hạn:", err);
      }
    }
  };

  const handleMarkAsPaid = async () => {
    try {
      await updateOrderStatus(booking_code, "paid");
      Alert.alert("✅ Đã thanh toán", "Trạng thái đơn đã chuyển sang 'paid'. Bấm kiểm tra để xác nhận.");
    } catch (err) {
      console.error("❌ Lỗi cập nhật trạng thái:", err);
      Alert.alert("Lỗi", "Không thể đánh dấu là đã thanh toán.");
    }
  };
  
  

  const checkPaymentStatus = async (isManual = true) => {
    try {
      const res = await getOrderStatus(booking_code);
      if (res.status === "paid") {
        const userInfo = await getUserInfo();
        const user_Id = userInfo.user_id;

        const services = extraService
          ? extraService.split(", ").map((serviceName) => ({
            serviceId: parseInt(serviceName.split("-")[1] || "0"),
            quantity: 1,
          }))
          : [];

        await Promise.all(
          timeSlotData.map((slot) =>
            createBooking(
              fieldId,
              user_Id,
              booking_code,
              slot.startTime,
              slot.endTime,
              totalPrice / timeSlotData.length,
              services,
              selectedPayment.toLowerCase().replaceAll(" ", "_")
            )
          )
        );

        Alert.alert("✅ Thành công", "Hệ thống đã xác nhận thanh toán và đặt sân thành công.");
        router.push("/customer/dashboard");
      } else if (isManual) {
        Alert.alert("⏳ Chưa thanh toán", "Giao dịch chưa được ghi nhận. Vui lòng kiểm tra lại sau.");
      }
      return res.status;
    } catch (error) {
      console.error("Lỗi khi kiểm tra trạng thái:", error);
      if (isManual) {
        Alert.alert("Lỗi", "Không thể kiểm tra trạng thái thanh toán.");
      }
      return "error";
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.push("/customer/dashboard")}> {/* fallback back */}
            <AntDesign name="arrowleft" size={24} color="green" />
          </TouchableOpacity>
          <Text style={styles.title}>Xác nhận thanh toán</Text>
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.sectionTitle}>Thông tin dịch vụ</Text>
          <Text>Mã đơn hàng: {booking_code}</Text>
          <Text>Tên sân: {fieldName}</Text>
          <Text>Loại sân: {fieldType}</Text>
          <Text>Ngày: {selectedDate}</Text>
          <Text>Khung giờ:</Text>
          {selectedTimeSlots.map((slot, index) => (
            <Text key={index}>- {slot}</Text>
          ))}
          <Text style={styles.price}>Giá sân: {formatCurrency(price)}</Text>
          {extraService && (
            <>
              <Text>Dịch vụ thêm: {extraService}</Text>
              <Text style={styles.price}>Giá dịch vụ: {formatCurrency(extraPrice)}</Text>
            </>
          )}
          <Text style={styles.totalPrice}>Tổng tiền: {formatCurrency(totalPrice)}</Text>
        </View>

        <Text style={styles.sectionTitle}>Thời gian còn lại: {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, "0")}</Text>

        {selectedPayment === "VNPay" && (
          <View style={styles.qrContainer}>
            <Text style={styles.qrTitle}>Quét mã QR để thanh toán</Text>
            <Image source={{ uri: qrCodeUrl }} style={styles.qrCode} />

            <TouchableOpacity
              onPress={() => checkPaymentStatus(true)}
              style={{ marginTop: 20, padding: 12, backgroundColor: "#f59e0b", borderRadius: 8 }}
            >
              <Text style={{ color: "white", fontWeight: "bold", textAlign: "center" }}>
                Kiểm tra trạng thái thanh toán
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleMarkAsPaid}
              style={{ marginTop: 10, padding: 12, backgroundColor: "#16A34A", borderRadius: 8 }}
            >
              <Text style={{ color: "white", fontWeight: "bold", textAlign: "center" }}>
                Thanh toán
              </Text>
            </TouchableOpacity>

          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default ConfirmPay;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  scrollContainer: {
    paddingBottom: 20,
  },
  header: { flexDirection: "row", alignItems: "center", padding: 16 },
  title: { fontSize: 18, fontWeight: "bold", marginLeft: 8 },
  infoContainer: { padding: 16, borderWidth: 1, borderRadius: 8, marginBottom: 10 },
  sectionTitle: { fontSize: 16, fontWeight: "bold", marginVertical: 8 },
  price: { fontWeight: "bold", color: "green" },
  totalPrice: { fontSize: 18, fontWeight: "bold", marginTop: 10 },
  qrContainer: { alignItems: "center", marginVertical: 20 },
  qrTitle: { fontSize: 16, fontWeight: "bold", marginBottom: 10 },
  qrCode: { width: 200, height: 200 },
  checkButton: { backgroundColor: "#16A34A", padding: 14, borderRadius: 8, alignItems: "center" },
  disabledButton: { backgroundColor: "#A0A0A0" },
  checkText: { color: "white", fontSize: 16, fontWeight: "bold" },
});
