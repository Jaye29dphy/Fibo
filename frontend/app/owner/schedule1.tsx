import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  Button,
  TouchableOpacity
} from "react-native";
import { Calendar } from "react-native-calendars";
import { useRouter } from "expo-router";
import { AntDesign } from "@expo/vector-icons";
import BottomTabs from "./BottomTabs";
import { useOwnerSchedule } from "@/hooks/useOwnerSchedule";

// Màu sắc trạng thái
const statusColors: Record<string, string> = {
  confirmed: "#4CAF50",
  pending: "#FFD700",
  cancelled: "#FF6347",
  completed: "#808080",
};

// Hàm chuẩn hóa ISO UTC -> YYYY-MM-DD
const toUTCDate = (iso: string): string => {
  const d = new Date(iso);
  return d.toISOString().split("T")[0];
};

export default function OwnerSchedule() {
  const router = useRouter();
  const { bookings, loading, error, refreshBookings } = useOwnerSchedule();
  const [markedDates, setMarkedDates] = useState<{ [date: string]: any }>({});

  useEffect(() => {
    if (!bookings || bookings.length === 0) {
      setMarkedDates({});
      return;
    }

    const newMarkedDates: { [date: string]: any } = {};

    bookings.forEach((booking) => {
      // Lấy chuỗi ngày từ booking_date hoặc start_time
      const rawDate = booking.booking_date ?? booking.start_time;
      if (!rawDate || typeof rawDate !== "string") {
        console.warn("❌ Không lấy được ngày từ booking:", booking);
        return;
      }

      // Normalize về YYYY-MM-DD
      const dateStr = toUTCDate(rawDate);
      console.log("📌 Ngày được dùng làm key:", dateStr);

      const status = booking.status;
      if (!newMarkedDates[dateStr]) {
        newMarkedDates[dateStr] = { dots: [] };
      }

      // Đảm bảo không duplicate dot
      const exists = newMarkedDates[dateStr].dots.some((d: any) => d.key === status);
      if (!exists) {
        const color = statusColors[status];
        if (color) {
          newMarkedDates[dateStr].dots.push({
            key: status,
            color,
            selectedDotColor: color,
          });
          console.log(`✅ Gán dot ${status} cho ${dateStr}`);
        }
      }
    });

    // Gán marked nếu có dot, xóa nếu không
    Object.keys(newMarkedDates).forEach((dateStr) => {
      if (newMarkedDates[dateStr].dots.length > 0) {
        newMarkedDates[dateStr].marked = true;
      } else {
        delete newMarkedDates[dateStr];
      }
    });

    console.log("✅ markedDates keys:", Object.keys(newMarkedDates));
    setMarkedDates(newMarkedDates);
  }, [bookings]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <AntDesign
            name="arrowleft"
            size={24}
            color="white"
            onPress={() => router.replace("/owner/dashboard")}
          />
          <Text style={styles.title}>Lịch đặt sân</Text>
        </View>
        <TouchableOpacity
          style={styles.refreshIcon}
          onPress={refreshBookings}
        >
          <AntDesign name="reload1" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator size="large" color="#3B82F6" />
        ) : (
          <Calendar
            markedDates={markedDates}
            markingType="multi-dot"
            onDayPress={(day: { dateString: string }) =>
              router.push(`/owner/schedule2?selectedDate=${day.dateString}`)
            }
            theme={{
              calendarBackground: "white",
              textSectionTitleColor: "black",
              selectedDayBackgroundColor: "#3B82F6",
              todayTextColor: "#00adf5",
              dayTextColor: "black",
              arrowColor: "black",
              monthTextColor: "black",
              indicatorColor: "blue",
              textMonthFontWeight: "bold",
              textDayFontSize: 16,
              textMonthFontSize: 20,
              textDayHeaderFontSize: 14,
              dotStyle: {
                width: 8,
                height: 8,
                borderRadius: 4,
                marginTop: 1,
              },
            }}
            enableSwipeMonths={true}
          />
        )}

        <View style={styles.legendContainer}>
          <Text style={styles.legendTitle}>Trạng thái đặt sân:</Text>
          {Object.entries(statusColors).map(([key, color]) => (
            <View style={styles.legendItem} key={key}>
              <View style={[styles.legendColor, { backgroundColor: color }]} />
              <Text style={styles.legendText}>{key}</Text>
            </View>
          ))}
        </View>

        <Button title="Tải lại lịch đặt sân" onPress={refreshBookings} />
        <Button title="Xem tất cả lịch đặt sân" onPress={() => router.push("/owner/schedule2")} />
      </View>

      <View style={styles.bottomTabs}>
        <BottomTabs />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "white" },
  header: {
    backgroundColor: "#3B82F6",
    paddingVertical: 15,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 45,
    justifyContent: "space-between",
  },
  headerLeft: { flexDirection: "row", alignItems: "center" },
  refreshIcon: { padding: 5 },
  title: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
    marginLeft: 10,
  },
  content: {
    flex: 1,
    padding: 18,
    alignItems: "center",
  },
  legendContainer: {
    marginVertical: 20,
    padding: 10,
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    width: "100%",
  },
  legendTitle: { fontSize: 16, fontWeight: "600", marginBottom: 10 },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 4,
    marginRight: 8,
  },
  legendText: {
    fontSize: 14,
    color: "#333",
    textTransform: "capitalize",
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