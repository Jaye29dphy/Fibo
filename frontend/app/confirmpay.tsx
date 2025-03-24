import React, { useState } from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const ConfirmPay = () => {
    const router = useRouter();
    const params = useLocalSearchParams();

    // Ép kiểu để tránh lỗi TypeScript
    const getStringParam = (value: string | string[] | undefined): string => {
        return Array.isArray(value) ? value[0] : value || "";
    };

    const orderId = getStringParam(params.orderId);
    const fieldType = getStringParam(params.fieldType);
    const selectedDate = getStringParam(params.selectedDate);
    const selectedTimeSlot = getStringParam(params.selectedTimeSlot);
    const price = getStringParam(params.price);
    const extraService = getStringParam(params.extraService);
    const extraPrice = getStringParam(params.extraPrice);

    const totalPrice = parseInt(price || "0") + (extraPrice ? parseInt(extraPrice) : 0);
    const [selectedPayment, setSelectedPayment] = useState<string>("VNPay");

    const handlePayment = () => {
        alert(`Thanh toán thành công qua ${selectedPayment}!`);
        router.push("/");
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color="black" />
                </TouchableOpacity>
                <Text style={styles.title}>Xác nhận thanh toán</Text>
            </View>

            {/* Thông tin dịch vụ */}
            <View style={styles.infoContainer}>
                <Text style={styles.sectionTitle}>Thông tin dịch vụ</Text>
                <Text>Mã đơn hàng: {orderId}</Text>
                <Text>Loại sân: {fieldType}</Text>
                <Text>Ngày: {selectedDate}</Text>
                <Text>Khung giờ: {selectedTimeSlot}</Text>
                <Text style={styles.price}>Giá sân: {price} VND</Text>

                {extraService && (
                    <>
                        <Text>Dịch vụ thêm: {extraService}</Text>
                        <Text style={styles.price}>Giá dịch vụ: {extraPrice} VND</Text>
                    </>
                )}

                <Text style={styles.totalPrice}>Tổng tiền: {totalPrice} VND</Text>
            </View>

            {/* Chọn phương thức thanh toán */}
            <Text style={styles.sectionTitle}>Chọn phương thức thanh toán</Text>
            <View style={styles.paymentMethods}>
                {["VNPay", "Momo", "Credit Card"].map((method) => (
                    <TouchableOpacity
                        key={method}
                        style={[
                            styles.paymentButton,
                            selectedPayment === method && styles.selectedPayment,
                        ]}
                        onPress={() => setSelectedPayment(method)}
                    >
                        <Text style={selectedPayment === method ? styles.selectedPaymentText : styles.paymentText}>
                            {method}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Mã QR giả lập */}
            <View style={styles.qrContainer}>
                <Image source={{ uri: "https://via.placeholder.com/150" }} style={styles.qrCode} />
            </View>

            {/* Nút thanh toán */}
            <TouchableOpacity style={styles.checkButton} onPress={handlePayment}>
                <Text style={styles.checkText}>Xác nhận thanh toán</Text>
            </TouchableOpacity>
        </View>
    );
};

export default ConfirmPay;

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16, backgroundColor: "#fff" },
    header: { flexDirection: "row", alignItems: "center", padding: 16 },
    title: { fontSize: 18, fontWeight: "bold", marginLeft: 8 },
    infoContainer: { padding: 16, borderWidth: 1, borderRadius: 8, marginBottom: 10 },
    sectionTitle: { fontSize: 16, fontWeight: "bold", marginVertical: 8 },
    price: { fontWeight: "bold", color: "green" },
    totalPrice: { fontSize: 18, fontWeight: "bold", marginTop: 10 },
    paymentMethods: { flexDirection: "row", justifyContent: "space-between", marginVertical: 10 },
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
    qrCode: { width: 150, height: 150 },
    checkButton: { backgroundColor: "#16A34A", padding: 14, borderRadius: 8, alignItems: "center" },
    checkText: { color: "white", fontSize: 16, fontWeight: "bold" },
});
