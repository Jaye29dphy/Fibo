// MyCalendar.tsx
import React, { useState, useEffect } from "react";
import { View, Text, ActivityIndicator, StyleSheet, Button } from "react-native";
import { Calendar } from "react-native-calendars";
import { useRouter } from "expo-router";
import { AntDesign } from "@expo/vector-icons";
import BottomTabs from "./BottomTabs";
import { useCalendar } from "../hooks/useCalendar";

const statusColors: Record<string, string> = {
  confirmed: "#4CAF50", // Green
  pending: "#FFD700", // Yellow
  cancelled: "#FF6347", // Red
  completed: "#808080", // Gray
};

export default function MyCalendar() {
  const router = useRouter();
  const { bookings, loading, error, refreshBookings } = useCalendar();
  const [markedDates, setMarkedDates] = useState<{ [date: string]: any }>({});

  useEffect(() => {
    console.log("Bookings received:", bookings);
    if (bookings.length > 0) {
      const newMarkedDates: { [date: string]: any } = {};
      bookings.forEach((booking) => {
        console.log("Processing booking:", booking);
        // Extract the date (e.g., "2025-03-30" from "2025-03-30 07:00:00Z")
        const date = booking.start_time.split(" ")[0];
        console.log("Extracted date:", date);
        newMarkedDates[date] = {
          selected: true,
          selectedColor: statusColors[booking.status] || "#0000FF",
        };
      });
      console.log("New marked dates:", newMarkedDates);
      setMarkedDates(newMarkedDates);
    } else {
      console.log("No bookings to mark.");
    }
  }, [bookings]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <AntDesign name="arrowleft" size={24} color="white" onPress={() => router.back()} />
        <Text style={styles.title}>Lịch của tôi</Text>
      </View>

      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator size="large" color="#4CAF50" />
        ) : error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : (
          <Calendar
            markedDates={markedDates}
            theme={{
              calendarBackground: "white",
              textSectionTitleColor: "black",
              selectedDayBackgroundColor: "#4CAF50",
              todayTextColor: "#00adf5",
              dayTextColor: "black",
              arrowColor: "black",
              monthTextColor: "black",
              indicatorColor: "blue",
              textMonthFontWeight: "bold",
              textDayFontSize: 16,
              textMonthFontSize: 20,
              textDayHeaderFontSize: 14,
            }}
            disableAllTouchEventsForDisabledDays={true}
          />
        )}
        <Button title="Tải lại lịch hẹn" onPress={refreshBookings} />
        <Button title="Xem tất cả lịch đặt sân" onPress={() => router.push("/calendar2")} />
      </View>

      <View style={styles.bottomTabs}>
        <BottomTabs />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "white" },
  header: { backgroundColor: "#4CAF50", paddingVertical: 15, paddingHorizontal: 10, flexDirection: "row", alignItems: "center" },
  title: { color: "white", fontSize: 20, fontWeight: "bold", marginLeft: 10 },
  content: { flex: 1, padding: 16, alignItems: "center" },
  bottomTabs: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "white", borderTopWidth: 1, borderTopColor: "#ddd" },
  errorText: { color: "red", fontSize: 16, marginTop: 10 },
});