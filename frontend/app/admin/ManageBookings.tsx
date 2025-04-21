import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Dimensions,
} from "react-native";
import { getCalendarData, formatCurrency } from "@/constants/apiService";

interface Booking {
  id: number; // booking_id
  customerId: number; // customer_id
  fieldId: number; // field_id
  fieldName: string; // Từ Fields.name
  customerName: string; // Từ Users.full_name
  startTime: string; // start_time
  endTime: string; // end_time
  status: "confirmed" | "cancelled" | "pending";
  totalCost: number; // total_cost
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
      const data = await getCalendarData();
      setBookings(data);
      filterBookings(data, selectedStatus, searchKeyword);
    } catch (err: any) {
      setError(err.message || "Đã xảy ra lỗi khi lấy danh sách đơn đặt sân.");
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
          booking.fieldName.toLowerCase().includes(lowerKeyword) ||
          booking.customerName.toLowerCase().includes(lowerKeyword)
      );
    }

    setFilteredBookings(filtered);
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    filterBookings(bookings, selectedStatus, searchKeyword);
  }, [selectedStatus, searchKeyword, bookings]);

  const renderBookingItem = ({ item }: { item: Booking }) => (
    <View style={styles.bookingItem}>
      <Text style={styles.id} numberOfLines={1} ellipsizeMode="tail">
        Đơn #{item.id}
      </Text>
      <Text style={styles.info} numberOfLines={1} ellipsizeMode="tail">
        Sân: {item.fieldName}
      </Text>
      <Text style={styles.info} numberOfLines={1} ellipsizeMode="tail">
        Khách: {item.customerName}
      </Text>
      <Text style={styles.info}>
        Bắt đầu: {new Date(item.startTime).toLocaleString()}
      </Text>
      <Text style={styles.info}>
        Kết thúc: {new Date(item.endTime).toLocaleString()}
      </Text>
      <Text style={styles.info}>
        Trạng thái: {item.status === "confirmed" ? "Đã xác nhận" : item.status === "cancelled" ? "Đã hủy" : "Đang chờ"}
      </Text>
      <Text style={styles.info}>Tổng: {formatCurrency(item.totalCost)}</Text>
    </View>
  );

  const statuses = [
    { label: "Tất cả", value: "all" },
    { label: "Đã xác nhận", value: "confirmed" },
    { label: "Đã hủy", value: "cancelled" },
    { label: "Đang chờ", value: "pending" },
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
      <Text style={styles.title}>Quản lý đơn đặt sân</Text>

      {/* Thanh tìm kiếm */}
      <TextInput
        placeholder="Tìm theo tên sân hoặc khách hàng..."
        style={styles.searchInput}
        value={searchKeyword}
        onChangeText={setSearchKeyword}
      />

      {/* Bộ lọc trạng thái */}
      <View style={styles.filterContainer}>
        <Text style={styles.filterLabel}>Trạng thái:</Text>
        <View style={styles.statusFilterContainer}>
          {statuses.map((status) => (
            <TouchableOpacity
              key={status.value}
              style={[
                styles.filterButton,
                selectedStatus === status.value && styles.filterButtonSelected,
              ]}
              onPress={() => setSelectedStatus(status.value)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  selectedStatus === status.value && styles.filterButtonTextSelected,
                ]}
              >
                {status.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Danh sách đơn đặt sân dạng lưới */}
      <FlatList
        data={filteredBookings}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderBookingItem}
        numColumns={2}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Không tìm thấy đơn đặt sân nào.</Text>
        }
      />
    </View>
  );
};

export default ManageBookings;

const { width } = Dimensions.get("window");
const itemWidth = (width - 48) / 3;

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
  filterContainer: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  statusFilterContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: "#E0E0E0",
    marginRight: 8,
    marginBottom: 8,
  },
  filterButtonSelected: {
    backgroundColor: "#4CAF50",
  },
  filterButtonText: {
    color: "#000",
    fontWeight: "500",
  },
  filterButtonTextSelected: {
    color: "#fff",
    fontWeight: "700",
  },
  bookingItem: {
    width: itemWidth,
    margin: 45, // Khoảng cách giữa các item
    backgroundColor: "#F1F1F1",
    borderRadius: 8,
    padding: 8,
  },
  id: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },
  info: {
    fontSize: 12,
    color: "#555",
    marginBottom: 2,
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