import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { AntDesign } from "@expo/vector-icons";
import BottomTabs from "./BottomTabs";
import { useCalendar, Booking } from "@/hooks/useCalendar";

const statusColors: Record<string, string> = {
  confirmed: "#4CAF50",
  pending: "#FFD700",
  cancelled: "#FF6347",
  completed: "#808080",
};

export default function CusCalendar() {
  const router = useRouter();
  const { selectedDate } = useLocalSearchParams();
  const { bookings, loading, error, refreshBookings } = useCalendar();
  const [groupedBookings, setGroupedBookings] = useState<Record<string, Booking[]>>({});

  useEffect(() => {
    if (bookings.length > 0) {
      const grouped: Record<string, Booking[]> = {};
      
      const selectedDateStr = Array.isArray(selectedDate) ? selectedDate[0] : selectedDate;

      bookings
        .filter((booking: Booking) => {
          const bookingDate = booking.start_time.split(" ")[0];
          return !selectedDateStr || bookingDate === selectedDateStr;
        })
        .forEach((booking: Booking) => {
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

          const startFormatted = formatDateTime(booking.start_time);
          const endFormatted = formatDateTime(booking.end_time);
          const timeSlot = `${startFormatted} - ${endFormatted}`;
          if (!grouped[timeSlot]) {
            grouped[timeSlot] = [];
          }
          grouped[timeSlot].push(booking);
        });

      const sortedGrouped = Object.entries(grouped).sort((a, b) => {
        const dateA = new Date(a[1][0].start_time);
        const dateB = new Date(b[1][0].start_time);
        return dateB.getTime() - dateA.getTime();
      });

      const sortedGroupedObject: Record<string, Booking[]> = {};
      sortedGrouped.forEach(([timeSlot, bookings]) => {
        sortedGroupedObject[timeSlot] = bookings;
      });

      setGroupedBookings(sortedGroupedObject);
    }
  }, [bookings, selectedDate]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <AntDesign name="arrowleft" size={24} color="white" onPress={() => router.back()} />
        <Text style={styles.headerTitle}>Lịch đặt sân của bạn</Text>
      </View>

      <ScrollView style={styles.content}>
        {loading ? (
          <ActivityIndicator size="large" color="#4CAF50" />
        ) : error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : Object.keys(groupedBookings).length === 0 ? (
          <Text style={styles.noBookingsText}>Không có lịch đặt sân nào.</Text>
        ) : (
          Object.entries(groupedBookings).map(([timeSlot, items]) => (
            <View key={timeSlot} style={styles.section}>
              <Text style={styles.timeHeader}>{timeSlot}</Text>
              {items.map((booking: Booking) => (
                <TouchableOpacity
                  key={booking.booking_code}
                  onPress={() => {
                    console.log("Booking being passed to Calendar3:", booking); // Thêm log để kiểm tra
                    router.push({
                      pathname: "/customer/calendar3",
                      params: { booking: JSON.stringify(booking) },
                    });
                  }}
                  style={[styles.card, { backgroundColor: statusColors[booking.status] || "#FFFFFF" }]}
                >
                  <View style={styles.info}>
                    <Text style={styles.fieldName}>Sân: {booking.fieldName || booking.field_id}</Text>
                    <Text style={styles.status}>
                      Trạng thái: {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ))
        )}
        <TouchableOpacity style={styles.reloadButton} onPress={refreshBookings}>
          <Text style={styles.reloadButtonText}>Tải lại lịch hẹn</Text>
        </TouchableOpacity>
      </ScrollView>

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
  content: { flex: 1, padding: 15 },
  errorText: { color: "red", fontSize: 16, textAlign: "center", marginTop: 20 },
  noBookingsText: { fontSize: 16, color: "gray", textAlign: "center", marginTop: 20 },
  section: { marginBottom: 20 },
  timeHeader: { fontSize: 16, fontWeight: "bold", color: "#333", backgroundColor: "#e0e0e0", padding: 8, borderRadius: 5, marginBottom: 10 },
  card: { padding: 15, borderRadius: 10, marginBottom: 10, elevation: 5, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 5 },
  info: { marginLeft: 0 },
  fieldName: { fontSize: 16, fontWeight: "bold", color: "#FFFFFF" },
  status: { fontSize: 14, fontWeight: "500", marginTop: 5, color: "#FFFFFF" },
  reloadButton: { backgroundColor: "#4CAF50", padding: 12, borderRadius: 8, alignItems: "center", marginVertical: 20 },
  reloadButtonText: { color: "white", fontSize: 16, fontWeight: "bold" },
  bottomTabs: { position: "relative", bottom: 0, left: 0, right: 0, backgroundColor: "white", borderTopWidth: 1, borderTopColor: "#ccc" },
});