import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Dimensions,
} from "react-native";
import { PieChart } from "react-native-chart-kit";
import { API_ENDPOINTS } from "@/constants/apiConfig";

interface Booking {
  id: number;
  booking_code: string | null;
  start_time: string;
  end_time: string;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  total_cost: number;
  field_name: string;
  customer_name: string;
}

const ManageBookings = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [searchKeyword, setSearchKeyword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showStats, setShowStats] = useState<boolean>(false);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_ENDPOINTS.GET_CALENDAR}/bookings`);
      if (!response.ok) {
        throw new Error("Lỗi khi lấy danh sách đặt sân.");
      }
      const data: Booking[] = await response.json();
      console.log("Fetched bookings:", data);
      setBookings(data);
      filterBookings(data, selectedStatus, searchKeyword);
    } catch (err: any) {
      setError(err.message || "Đã xảy ra lỗi khi lấy danh sách đặt sân.");
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const filterBookings = (data: Booking[], status: string, keyword: string) => {
    let filtered = data;

    if (status !== "all") {
      filtered = filtered.filter((booking) => booking.status === status);
    }

    if (keyword.trim() !== "") {
      const lowerKeyword = keyword.toLowerCase();
      filtered = filtered.filter(
        (booking) =>
          booking.booking_code?.toLowerCase().includes(lowerKeyword) ||
          booking.customer_name.toLowerCase().includes(lowerKeyword) ||
          booking.field_name.toLowerCase().includes(lowerKeyword)
      );
    }

    setFilteredBookings(filtered);
    console.log("Filtered bookings:", filtered);
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    filterBookings(bookings, selectedStatus, searchKeyword);
  }, [selectedStatus, searchKeyword]);

  const renderBookingItem = ({ item }: { item: Booking }) => (
    <View style={styles.bookingItem}>
      <Text style={styles.code}>
        Mã đặt sân: {item.booking_code || "Không có mã"}
      </Text>
      <Text style={styles.info}>ID: {item.id}</Text>
      <Text style={styles.info}>Sân: {item.field_name}</Text>
      <Text style={styles.info}>Khách hàng: {item.customer_name}</Text>
      <Text style={styles.info}>
        Thời gian: {new Date(item.start_time).toLocaleString()} -{" "}
        {new Date(item.end_time).toLocaleString()}
      </Text>
      <Text style={styles.info}>Trạng thái: {item.status}</Text>
      <Text style={styles.info}>Tổng chi phí: {item.total_cost.toLocaleString()} VND</Text>
    </View>
  );

  const statuses = [
    { label: "Tất cả", value: "all" },
    { label: "Đang chờ", value: "pending" },
    { label: "Đã xác nhận", value: "confirmed" },
    { label: "Đã hủy", value: "cancelled" },
    { label: "Hoàn thành", value: "completed" },
  ];

  const getStatistics = () => {
    const totalBookings = bookings.length;
    const totalPending = bookings.filter((booking) => booking.status === "pending").length;
    const totalConfirmed = bookings.filter((booking) => booking.status === "confirmed").length;
    const totalCancelled = bookings.filter((booking) => booking.status === "cancelled").length;
    const totalCompleted = bookings.filter((booking) => booking.status === "completed").length;

    const fieldCounts = bookings.reduce((acc, booking) => {
      acc[booking.field_name] = (acc[booking.field_name] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const topFields = Object.entries(fieldCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name, count]) => ({ name, count }));

    const customerCounts = bookings.reduce((acc, booking) => {
      acc[booking.customer_name] = (acc[booking.customer_name] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const topCustomers = Object.entries(customerCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name, count]) => ({ name, count }));

    return {
      totalBookings,
      totalPending,
      totalConfirmed,
      totalCancelled,
      totalCompleted,
      topFields,
      topCustomers,
    };
  };

  if (loading) {
    return <ActivityIndicator size="large" color="#4CAF50" style={styles.loading} />;
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  const stats = getStatistics();

  const chartData = [
    {
      name: "Đang chờ",
      population: stats.totalPending,
      color: "#FFC107",
      legendFontColor: "#333",
      legendFontSize: 14,
    },
    {
      name: "Đã xác nhận",
      population: stats.totalConfirmed,
      color: "#4CAF50",
      legendFontColor: "#333",
      legendFontSize: 14,
    },
    {
      name: "Đã hủy",
      population: stats.totalCancelled,
      color: "#F44336",
      legendFontColor: "#333",
      legendFontSize: 14,
    },
    {
      name: "Hoàn thành",
      population: stats.totalCompleted,
      color: "#2196F3",
      legendFontColor: "#333",
      legendFontSize: 14,
    },
  ].filter((item) => item.population > 0); // Remove segments with zero population

  const screenWidth = Dimensions.get("window").width;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Danh sách đặt sân</Text>
        <TouchableOpacity
          style={styles.statsButton}
          onPress={() => setShowStats(true)}
        >
          <Text style={styles.statsButtonText}>Thống kê</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        placeholder="Tìm theo mã đặt sân, tên khách hàng, hoặc tên sân..."
        style={styles.searchInput}
        value={searchKeyword}
        onChangeText={setSearchKeyword}
      />

      <View style={styles.statusFilterContainer}>
        {statuses.map((status) => (
          <TouchableOpacity
            key={status.value}
            style={[
              styles.statusButton,
              selectedStatus === status.value && styles.statusButtonSelected,
            ]}
            onPress={() => setSelectedStatus(status.value)}
          >
            <Text
              style={[
                styles.statusButtonText,
                selectedStatus === status.value && styles.statusButtonTextSelected,
              ]}
            >
              {status.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredBookings}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderBookingItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Không tìm thấy đặt sân nào.</Text>
        }
      />

      <Modal
        visible={showStats}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowStats(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Thống kê đặt sân</Text>
            <View style={styles.statsContainer}>
              <Text style={styles.modalText}>Tổng số đơn đặt sân: {stats.totalBookings}</Text>
              {chartData.length > 0 ? (
                <PieChart
                  data={chartData}
                  width={screenWidth * 0.7} // Responsive width
                  height={220}
                  chartConfig={{
                    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  }}
                  accessor="population"
                  backgroundColor="transparent"
                  paddingLeft="15"
                  absolute
                  style={styles.chart}
                />
              ) : (
                <Text style={styles.noDataText}>Không có dữ liệu để hiển thị biểu đồ.</Text>
              )}
              <Text style={styles.modalSubTitle}>Top 3 sân được đặt nhiều nhất:</Text>
              {stats.topFields.length > 0 ? (
                stats.topFields.map((field, index) => (
                  <Text key={index} style={styles.modalText}>
                    {index + 1}. {field.name}: {field.count} lần
                  </Text>
                ))
              ) : (
                <Text style={styles.modalText}>Chưa có dữ liệu</Text>
              )}
              <Text style={styles.modalSubTitle}>Top 3 người dùng đặt sân nhiều nhất:</Text>
              {stats.topCustomers.length > 0 ? (
                stats.topCustomers.map((customer, index) => (
                  <Text key={index} style={styles.modalText}>
                    {index + 1}. {customer.name}: {customer.count} lần
                  </Text>
                ))
              ) : (
                <Text style={styles.modalText}>Chưa có dữ liệu</Text>
              )}
            </View>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowStats(false)}
            >
              <Text style={styles.closeButtonText}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
  },
  statsButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  statsButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  statusFilterContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
    marginBottom: 16,
  },
  statusButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: "#E0E0E0",
    marginBottom: 8,
  },
  statusButtonSelected: {
    backgroundColor: "#4CAF50",
  },
  statusButtonText: {
    color: "#000",
    fontWeight: "500",
  },
  statusButtonTextSelected: {
    color: "#fff",
    fontWeight: "700",
  },
  bookingItem: {
    padding: 12,
    marginBottom: 10,
    borderRadius: 10,
    backgroundColor: "#F1F1F1",
  },
  code: {
    fontSize: 18,
    fontWeight: "600",
  },
  info: {
    fontSize: 14,
    color: "#888",
  },
  loading: {
    flex: 1,
    justifyContent: "center",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    color: "red",
    fontSize: 16,
  },
  list: {
    paddingBottom: 16,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 20,
    color: "#999",
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    width: "95%",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
  },
  modalSubTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 12,
    marginBottom: 8,
    color: "#333",
  },
  statsContainer: {
    marginBottom: 20,
    alignItems: "center",
    width: "100%",
  },
  modalText: {
    fontSize: 16,
    marginBottom: 8,
    color: "#333",
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  noDataText: {
    fontSize: 16,
    color: "#999",
    textAlign: "center",
    marginVertical: 20,
  },
  closeButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  closeButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});

export default ManageBookings;