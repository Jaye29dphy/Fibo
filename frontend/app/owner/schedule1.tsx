// f:\school\Ki 6\Cross-platform App Development\Fibo\frontend\app\owner\schedule1.tsx
import React, { useState, useEffect } from "react";
import { View, Text, ActivityIndicator, StyleSheet, Button, TouchableOpacity } from "react-native";
import { Calendar } from "react-native-calendars";
import { useRouter } from "expo-router";
import { AntDesign } from "@expo/vector-icons";
import BottomTabs from "./BottomTabs";
import { useOwnerSchedule } from "@/hooks/useOwnerSchedule";

// Màu sắc cho trạng thái đặt sân
const statusColors: Record<string, string> = {
  confirmed: "#4CAF50", // xanh lá
  pending: "#FFD700",   // vàng
  cancelled: "#FF6347",  // đỏ cam
  completed: "#808080",  // xám
};

export default function OwnerSchedule() {
  const router = useRouter();
  const { bookings, loading, error, refreshBookings } = useOwnerSchedule();
  const [markedDates, setMarkedDates] = useState<{
    [date: string]: {
      selected?: boolean;
      selectedColor?: string;
      marked?: boolean;
      dotColor?: string;
    }
  }>({});  // Xử lý dữ liệu đặt sân để hiển thị trên lịch
  useEffect(() => {
    console.log("Processing bookings for calendar:", bookings.length, "bookings");
    if (bookings && bookings.length > 0) {
      try {
        const newMarkedDates: {
          [date: string]: {
            selected: boolean;
            selectedColor: string;
            marked: boolean;
            dotColor: string;
            dots?: { key: string; color: string; selectedDotColor: string }[];
          }
        } = {};

        // Group bookings by date
        const bookingsByDate: Record<string, OwnerBooking[]> = {};

        bookings.forEach((booking) => {
          // Lấy ngày từ booking_date hoặc chuỗi thời gian bắt đầu
          let dateStr = "";

          // Ưu tiên sử dụng booking_date nếu có
          if (booking.booking_date) {
            dateStr = booking.booking_date;
          } else if (booking.start_time) {
            // Fallback to start_time if booking_date is not available
            if (booking.start_time.includes(" ")) {
              dateStr = booking.start_time.split(" ")[0];
            } else if (booking.start_time.includes("T")) {
              dateStr = booking.start_time.split("T")[0];
            } else {
              dateStr = booking.start_time.substring(0, 10);
            }
          }

          if (dateStr) {
            console.log(`Processing booking date: ${dateStr} with status: ${booking.status}`);

            if (!bookingsByDate[dateStr]) {
              bookingsByDate[dateStr] = [];
            }
            bookingsByDate[dateStr].push(booking);
          }
        });

        // Process each date and create marked dates
        Object.entries(bookingsByDate).forEach(([dateStr, dateBookings]) => {
          // Find the most important status for this date (priority: pending > confirmed > cancelled > completed)
          const statusPriority = { pending: 3, confirmed: 2, cancelled: 1, completed: 0 };
          let highestPriorityStatus = "completed";

          dateBookings.forEach(booking => {
            if (statusPriority[booking.status as keyof typeof statusPriority] >
              statusPriority[highestPriorityStatus as keyof typeof statusPriority]) {
              highestPriorityStatus = booking.status;
            }
          });

          // Create the marker for this date
          newMarkedDates[dateStr] = {
            selected: true,
            marked: true,
            selectedColor: statusColors[highestPriorityStatus] || "#0000FF",
            dotColor: statusColors[highestPriorityStatus] || "#0000FF",
          };
        });

        console.log("Final marked dates:", Object.keys(newMarkedDates).length);
        setMarkedDates(newMarkedDates);
      } catch (error) {
        console.error("Error processing booking dates:", error);
      }
    } else {
      // Reset marked dates if no bookings
      setMarkedDates({});
    }
  }, [bookings]);

  return (
    <View style={styles.container}>      <View style={styles.header}>
      <View style={styles.headerLeft}>
        <AntDesign name="arrowleft" size={24} color="white" onPress={() => router.back()} />
        <Text style={styles.title}>Lịch đặt sân</Text>
      </View>
      <TouchableOpacity style={styles.refreshIcon} onPress={refreshBookings}>
        <AntDesign name="reload1" size={24} color="white" />
      </TouchableOpacity>
    </View>

      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator size="large" color="#3B82F6" />
        ) : error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : Object.keys(markedDates).length === 0 && !loading ? (
          <Text style={styles.noBookingsText}>Không có lịch đặt sân nào.</Text>) : (<Calendar
            markedDates={markedDates}
            onDayPress={(day: { dateString: string; day: number; month: number; year: number; timestamp: number }) => {
              console.log("Selected date:", day.dateString);
              router.push(`/owner/schedule2?selectedDate=${day.dateString}`);
            }}
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
              }
            }}
            markingType="period"
            enableSwipeMonths={true}
            disableAllTouchEventsForDisabledDays={false}
          />
        )}

        <View style={styles.legendContainer}>
          <Text style={styles.legendTitle}>Trạng thái đặt sân:</Text>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: statusColors.confirmed }]} />
            <Text style={styles.legendText}>Đã xác nhận</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: statusColors.pending }]} />
            <Text style={styles.legendText}>Đang chờ xác nhận</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: statusColors.cancelled }]} />
            <Text style={styles.legendText}>Đã hủy</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: statusColors.completed }]} />
            <Text style={styles.legendText}>Đã hoàn thành</Text>
          </View>
        </View>

        <Button title="Tải lại lịch đặt sân" onPress={refreshBookings} />
      </View>

      <View style={styles.buttonContainer}>
        <Button
          title="Xem tất cả lịch đặt sân"
          onPress={() => router.push("/owner/schedule2")}
        />
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
    backgroundColor: "white"
  }, header: {
    backgroundColor: "#3B82F6",
    paddingVertical: 15,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 45,
    justifyContent: "space-between"
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  refreshIcon: {
    padding: 5
  },
  title: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
    marginLeft: 10
  },
  content: {
    flex: 1,
    padding: 18,
    alignItems: "center"
  },
  bottomTabs: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#ddd"
  },
  errorText: {
    color: "red",
    fontSize: 16,
    marginTop: 10
  },
  noBookingsText: {
    fontSize: 16,
    color: "gray",
    textAlign: "center",
    marginTop: 20
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
    paddingTop: 10,
    backgroundColor: "white",
  },
  legendContainer: {
    marginVertical: 20,
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    width: '100%',
  },
  legendTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
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
    color: '#333',
  },
});