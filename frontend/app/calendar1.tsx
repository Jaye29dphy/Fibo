import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Button } from "react-native";
import { Calendar } from "react-native-calendars";
import { useRouter } from "expo-router";
import { AntDesign } from "@expo/vector-icons";
import BottomTabs from "./BottomTabs";

const bookings = [
  { time: "2025-03-30", status: "confirmed" },
  { time: "2025-03-27", status: "confirmed" },
  { time: "2025-03-25", status: "cancelled" },
  { time: "2025-03-15", status: "confirmed" },
  { time: "2025-02-25", status: "confirmed" },
  { time: "2025-02-20", status: "confirmed" },
  { time: "2025-02-20", status: "cancelled" },
];

export default function MyCalendar() {
  const router = useRouter();
  const [markedDates, setMarkedDates] = useState<{ [date: string]: any }>({});

  useEffect(() => {
    const newMarkedDates: { [date: string]: any } = {};
    bookings.forEach((booking) => {
      newMarkedDates[booking.time] = {
        selected: true,
        selectedColor: booking.status === "confirmed" ? "#4CAF50" : "#FF6347",
      };
    });
    setMarkedDates(newMarkedDates);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <AntDesign name="arrowleft" size={24} color="white" onPress={() => router.back()} />
        <Text style={styles.title}>Lịch của tôi</Text>
      </View>

      <View style={styles.content}>
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
          disableAllTouchEventsForDisabledDays={true} // Không cho phép nhấn vào ngày
        />
        <Button title="Xem tất cả lịch đặt sân" onPress={() => router.push("/calendar2")} />
      </View>

      <View style={styles.bottomTabs}>
        <BottomTabs />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  header: {
    backgroundColor: "#4CAF50",
    paddingVertical: 15,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  title: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
    marginLeft: 10,
  },
  content: {
    flex: 1,
    padding: 16,
    alignItems: "center",
  },
  bottomTabs: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#ddd",
  },
});
