import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from "react-native";
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

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_ENDPOINTS.GET_CALENDAR}/bookings`);
      if (!response.ok) {
        throw new Error("Lỗi khi lấy danh sách đặt sân.");
      }
      const data: Booking[] = await response.json();
      console.log("Fetched bookings:", data); // Debug log
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
    console.log("Filtered bookings:", filtered); // Debug log
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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Danh sách đặt sân</Text>

      {/* Thanh tìm kiếm */}
      <TextInput
        placeholder="Tìm theo mã đặt sân, tên khách hàng, hoặc tên sân..."
        style={styles.searchInput}
        value={searchKeyword}
        onChangeText={setSearchKeyword}
      />

      {/* Bộ lọc trạng thái */}
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

      {/* Danh sách đặt sân */}
      <FlatList
        data={filteredBookings}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderBookingItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Không tìm thấy đặt sân nào.</Text>
        }
      />
    </View>
  );
};

export default ManageBookings;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
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
});