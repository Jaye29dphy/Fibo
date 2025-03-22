import React, { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Calendar, DateData } from "react-native-calendars";
import { useRouter } from "expo-router";
import { AntDesign } from "@expo/vector-icons";
import BottomTabs from "./BottomTabs";

export default function MyCalendar() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState("");

  return (
    <View style={styles.container}>
      {/* Thanh tiêu đề */}
      <View style={styles.header}>
        <AntDesign
          name="arrowleft"
          size={24}
          color="white"
          onPress={() => router.back()} // Điều hướng quay lại
        />
        <Text style={styles.title}>Lịch của tôi</Text>
      </View>

      {/* Nội dung chính */}
      <View style={styles.content}>
        <Calendar
          onDayPress={(day: DateData) => setSelectedDate(day.dateString)}
          markedDates={{
            [selectedDate]: { selected: true, selectedColor: "#4CAF50" },
          }}
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
        />
      </View>

      {/* Thanh điều hướng dưới cùng */}
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
