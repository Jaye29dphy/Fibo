import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { AntDesign } from "@expo/vector-icons";
import BottomTabs from "./BottomTabs";
import { Booking } from "../hooks/useCalendar";

const statusColors: Record<string, string> = {
    confirmed: "#4CAF50",
    pending: "#FFD700",
    cancelled: "#FF6347",
    completed: "#808080",
};

export default function Calendar3() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const booking: Booking | null = params.booking ? JSON.parse(params.booking as string) : null;

    if (!booking) {
        return (
            <View style={styles.container}>
                <Text style={styles.errorText}>Không tìm thấy thông tin đặt sân.</Text>
            </View>
        );
    }

    const formatDateTime = (dateTime: string): string => {
        const date = new Date(dateTime);
        if (isNaN(date.getTime())) return "Không xác định";
        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const year = date.getFullYear();
        const hours = String(date.getHours()).padStart(2, "0");
        const minutes = String(date.getMinutes()).padStart(2, "0");
        return `${day}/${month}/${year} ${hours}:${minutes}`;
    };

    const startTime = formatDateTime(booking.start_time);
    const endTime = formatDateTime(booking.end_time);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <AntDesign name="arrowleft" size={24} color="white" onPress={() => router.back()} />
                <Text style={styles.headerTitle}>Chi tiết đặt sân</Text>
            </View>

            <View style={styles.content}>
                <View style={[styles.detailCard, { backgroundColor: statusColors[booking.status] || "#FFFFFF" }]}>
                    <Text style={styles.title}>Thông tin đặt sân</Text>
                    <View style={styles.detailRow}>
                        <Text style={styles.label}>Sân:</Text>
                        <Text style={styles.value}>{booking.field_id}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.label}>Thời gian bắt đầu:</Text>
                        <Text style={styles.value}>{startTime}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.label}>Thời gian kết thúc:</Text>
                        <Text style={styles.value}>{endTime}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.label}>Trạng thái:</Text>
                        <Text style={styles.value}>
                            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                        </Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.label}>Mã đặt sân:</Text>
                        <Text style={styles.value}>{booking.id}</Text>
                    </View>
                </View>

                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Text style={styles.backButtonText}>Quay lại</Text>
                </TouchableOpacity>
            </View>
            <View style={styles.bottomTabs}>
                <BottomTabs />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#f5f5f5" },
    header: { backgroundColor: "#4CAF50", paddingVertical: 15, paddingHorizontal: 10, flexDirection: "row", alignItems: "center" },
    headerTitle: { color: "white", fontSize: 20, fontWeight: "bold", marginLeft: 10 },
    content: { flex: 1, padding: 15, alignItems: "center" },
    detailCard: { width: "100%", padding: 20, borderRadius: 10, elevation: 5, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 5 },
    title: { fontSize: 18, fontWeight: "bold", color: "#FFFFFF", marginBottom: 15, textAlign: "center" },
    detailRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
    label: { fontSize: 16, fontWeight: "bold", color: "#FFFFFF" },
    value: { fontSize: 16, color: "#FFFFFF", flexShrink: 1, textAlign: "right" },
    errorText: { color: "red", fontSize: 16, textAlign: "center", marginTop: 20 },
    backButton: { backgroundColor: "#4CAF50", padding: 12, borderRadius: 8, alignItems: "center", marginTop: 20 },
    backButtonText: { color: "white", fontSize: 16, fontWeight: "bold" },
    bottomTabs: { position: "relative", bottom: 0, left: 0, right: 0, backgroundColor: "white", borderTopWidth: 1, borderTopColor: "#ccc" },
});
