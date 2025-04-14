import React, { useState } from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet, Alert, ScrollView } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { createBooking, getUserInfo, formatCurrency } from "@/constants/apiService"; // Import formatCurrency
import AsyncStorage from "@react-native-async-storage/async-storage";
import moment from "moment";

const ConfirmPay = () => {
  const router = useRouter();
  const params = useLocalSearchParams();

  const getStringParam = (value: string | string[] | undefined): string => {
    return Array.isArray(value) ? value[0] : value || "";
  };

  const orderId = getStringParam(params.orderId);
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

  const bankId = "970436";
  const accountNo = "1031505171";
  const accountName = "LaanLee";

  const qrCodeUrl = `https://img.vietqr.io/image/${bankId}-${accountNo}-compact.png?amount=${totalPrice}&addInfo=${orderId}&accountName=${accountName}`;

  const timeSlotData = selectedTimeSlots.map((slot) => {
    const [startTimeStr, endTimeStr] = slot.split(" - ");
    return {
      startTime: moment(`${selectedDate} ${startTimeStr}`, "DD/MM HH:mm").format("YYYY-MM-DD HH:mm:ss"),
      endTime: moment(`${selectedDate} ${endTimeStr}`, "DD/MM HH:mm").format("YYYY-MM-DD HH:mm:ss"),
    };
  });

  const handlePayment = async () => {
    setIsLoading(true);
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        Alert.alert("Lỗi", "Bạn cần đăng nhập để thực hiện thanh toán.");
        return;
      }

      const userInfo = await getUserInfo();
      const customerId = userInfo.customer_id;

      const services = extraService
        ? extraService.split(", ").map((serviceName) => ({
            serviceId: parseInt(serviceName.split("-")[1] || "0"),
            quantity: 1,
          }))
        : [];

      const responses = await Promise.all(
        timeSlotData.map((slot) =>
          createBooking(
            fieldId,
            customerId,
            slot.startTime,
            slot.endTime,
            totalPrice / timeSlotData.length,
            services,
            selectedPayment.toLowerCase().replace(" ", "_")
          )
        )
      );

      Alert.alert("Thành công", `Thanh toán thành công qua ${selectedPayment}! Mã đơn hàng: ${responses[0].booking_id}`);
      router.push("/");
    } catch (error) {
      console.error("Payment error:", error);
      Alert.alert("Lỗi", "Thanh toán thất bại. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} disabled={isLoading}>
            <Ionicons name="arrow-back" size={24} color="black" />
          </TouchableOpacity>
          <Text style={styles.title}>Xác nhận thanh toán</Text>
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.sectionTitle}>Thông tin dịch vụ</Text>
          <Text>Mã đơn hàng: {orderId}</Text>
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

        <Text style={styles.sectionTitle}>Chọn phương thức thanh toán</Text>
        <View style={styles.paymentMethods}>
          {["VNPay", "Momo"].map((method) => (
            <TouchableOpacity
              key={method}
              style={[
                styles.paymentButton,
                selectedPayment === method && styles.selectedPayment,
              ]}
              onPress={() => setSelectedPayment(method)}
              disabled={isLoading}
            >
              <Text style={selectedPayment === method ? styles.selectedPaymentText : styles.paymentText}>
                {method}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {selectedPayment === "VNPay" && (
          <View style={styles.qrContainer}>
            <Text style={styles.qrTitle}>Quét mã QR để thanh toán</Text>
            <Image source={{ uri: qrCodeUrl }} style={styles.qrCode} />
          </View>
        )}
      </ScrollView>

      <TouchableOpacity
        style={[styles.checkButton, isLoading && styles.disabledButton]}
        onPress={handlePayment}
        disabled={isLoading}
      >
        <Text style={styles.checkText}>{isLoading ? "Đang xử lý..." : "Xác nhận thanh toán"}</Text>
      </TouchableOpacity>
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
  paymentMethods: { flexDirection: "row", justifyContent: "space-evenly", marginVertical: 10 },
  paymentButton: {
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    width: "30%",
    alignItems: "center",
    borderColor: "#16A34A",
  },
  paymentText: { fontSize: 14, fontWeight: "bold", color: "black" },
  selectedPayment: { backgroundColor: "#16A34A", borderColor: "#16A34A" },
  selectedPaymentText: { fontSize: 14, fontWeight: "bold", color: "white" },
  qrContainer: { alignItems: "center", marginVertical: 20 },
  qrTitle: { fontSize: 16, fontWeight: "bold", marginBottom: 10 },
  qrCode: { width: 200, height: 200 },
  checkButton: { backgroundColor: "#16A34A", padding: 14, borderRadius: 8, alignItems: "center" },
  disabledButton: { backgroundColor: "#A0A0A0" },
  checkText: { color: "white", fontSize: 16, fontWeight: "bold" },
});