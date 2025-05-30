import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  TextInput,
  ScrollView
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { AntDesign, MaterialIcons, Feather } from "@expo/vector-icons";
import { useOwnerSchedule, OwnerBooking } from "@/hooks/useOwnerSchedule";
import BottomTabs from "./BottomTabs";

// Hàm chuẩn hóa ISO UTC -> YYYY-MM-DD
const toUTCDate = (iso: string): string => {
  const d = new Date(iso);
  return d.toISOString().split("T")[0];
};

export default function OwnerScheduleList() {
  const router = useRouter();
  const { selectedDate } = useLocalSearchParams();
  const { bookings, loading, error, refreshBookings } = useOwnerSchedule();
  const [filteredBookings, setFilteredBookings] = useState<OwnerBooking[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const statusFilters = [
    { key: "all", label: "Tất cả" },
    { key: "pending", label: "Chờ xác nhận" },
    { key: "confirmed", label: "Đã xác nhận" },
    { key: "completed", label: "Đã hoàn thành" },
    { key: "cancelled", label: "Đã hủy" }
  ];

  const formatTime = (timeString: string) => {
    const timePart = timeString.split(" ")[1] || "";
    return timePart.substring(0, 5);
  };

  const formatDateDisplay = (dateString: string) => {
    const parts = dateString.split("-");
    return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : dateString;
  };

  useEffect(() => {
    let filtered = bookings ? [...bookings] : [];

    if (selectedDate) {
      filtered = filtered.filter((booking) => {
        const raw = booking.booking_date ?? booking.start_time;
        if (!raw || typeof raw !== "string") return false;
        const dateStr = toUTCDate(raw);
        console.log("🔍 Filtering booking date:", dateStr, "vs selectedDate", selectedDate);
        return dateStr === (selectedDate as string);
      });
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((b) => b.status === statusFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((b) =>
        (b.field_name || "").toLowerCase().includes(q) ||
        (b.booking_code || "").toLowerCase().includes(q) ||
        (b.customer_name || "").toLowerCase().includes(q) ||
        (b.field_description || "").toLowerCase().includes(q)
      );
    }

    setFilteredBookings(filtered);
  }, [bookings, selectedDate, searchQuery, statusFilter]);

  const getStatusText = (s: string) => ({
    confirmed: "Đã xác nhận",
    pending: "Chờ xác nhận",
    cancelled: "Đã hủy",
    completed: "Đã hoàn thành"
  }[s] || s);

  const getStatusColor = (s: string) => ({
    confirmed: "#4CAF50",
    pending: "#FFD700",
    cancelled: "#FF6347",
    completed: "#808080"
  }[s] || "#0000FF");

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshBookings();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <AntDesign name="arrowleft" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.title}>
            {selectedDate
              ? `Lịch đặt sân ngày ${formatDateDisplay(selectedDate as string)}`
              : "Tất cả lịch đặt sân"}
          </Text>
        </View>

        <View style={styles.content}>
          <View style={styles.fixedTopSection}>
            <View style={styles.searchContainer}>
              <View style={styles.searchBar}>
                <Feather name="search" size={18} color="gray" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Tìm tên sân, mã đặt sân..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholderTextColor="gray"
                />
                {searchQuery ? (
                  <TouchableOpacity onPress={() => setSearchQuery("")}>
                    <Feather name="x" size={18} color="gray" />
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.filterContainer}
              contentContainerStyle={styles.filtersContent}
            >
              {statusFilters.map((f) => (
                <TouchableOpacity
                  key={f.key}
                  style={[
                    styles.filterButton,
                    statusFilter === f.key && styles.filterButtonActive,
                  ]}
                  onPress={() => setStatusFilter(f.key)}
                >
                  <Text
                    style={[
                      styles.filterText,
                      statusFilter === f.key && styles.filterTextActive,
                    ]}
                  >
                    {f.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {loading ? (
            <ActivityIndicator style={styles.loading} size="large" color="#3B82F6" />
          ) : error ? (
            <View style={styles.errorContainer}>
              <MaterialIcons name="error-outline" size={48} color="#FF6347" />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.refreshButton} onPress={refreshBookings}>
                <Text style={styles.refreshButtonText}>Thử lại</Text>
              </TouchableOpacity>
            </View>
          ) : filteredBookings.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="event-busy" size={64} color="#CCCCCC" />
              <Text style={styles.emptyText}>
                {searchQuery
                  ? "Không tìm thấy kết quả phù hợp"
                  : selectedDate
                    ? "Không có lịch đặt sân nào trong ngày này"
                    : "Không có lịch đặt sân nào"}
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredBookings}
              keyExtractor={(item) => item.booking_id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.bookingCard}
                  onPress={() => router.push(`/owner/schedule3?bookingId=${item.booking_id}`)}
                >
                  <View style={styles.bookingHeader}>
                    <Text style={styles.bookingCode}>{item.booking_code}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                      <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
                    </View>
                  </View>
                  <View style={styles.divider} />
                  <View style={styles.bookingDetails}>
                    <View style={styles.detailRow}>
                      <MaterialIcons name="sports-soccer" size={18} color="#666" />
                      <Text style={styles.detailText}>{item.field_name}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <MaterialIcons name="access-time" size={18} color="#666" />
                      <Text style={styles.detailText}>
                        {formatDateDisplay(toUTCDate(item.start_time))} {formatTime(item.start_time)} - {formatTime(item.end_time)}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <MaterialIcons name="person" size={18} color="#666" />
                      <Text style={styles.detailText}>{item.customer_name || "Khách hàng"}</Text>
                    </View>
                    {item.total_cost && (
                      <View style={styles.detailRow}>
                        <MaterialIcons name="attach-money" size={18} color="#666" />
                        <Text style={styles.detailText}>
                          {Number(item.total_cost).toLocaleString("vi-VN")}đ
                        </Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.bookingFooter}>
                    <MaterialIcons name="chevron-right" size={24} color="#3B82F6" />
                  </View>
                </TouchableOpacity>
              )}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
              contentContainerStyle={styles.listContent}
            />
          )}
        </View>

        <BottomTabs />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f5f5f5" },
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#3B82F6",
    padding: 16,
  },
  title: { flex: 1, color: "white", fontSize: 18, fontWeight: "600", marginLeft: 16 },
  content: { flex: 1, padding: 16 },
  fixedTopSection: { backgroundColor: "#f5f5f5", marginBottom: 8, zIndex: 10 },
  searchContainer: { marginBottom: 12 },
  searchBar: { flexDirection: "row", alignItems: "center", backgroundColor: "white", borderRadius: 8, padding: 8, elevation: 2 },
  searchInput: { flex: 1, paddingHorizontal: 8, fontSize: 16 },
  filterContainer: { marginBottom: 16 },
  filtersContent: { paddingRight: 12 },
  filterButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 8, borderWidth: 1, borderColor: "#ddd", backgroundColor: "white" },
  filterButtonActive: { backgroundColor: "#3B82F6", borderColor: "#3B82F6" },
  filterText: { fontSize: 14, color: "#666" },
  filterTextActive: { color: "white", fontWeight: "500" },
  loading: { marginTop: 120 },
  errorContainer: { alignItems: "center", padding: 16 },
  errorText: { marginTop: 12, fontSize: 16, color: "#555", textAlign: "center" },
  refreshButton: { backgroundColor: "#3B82F6", padding: 8, borderRadius: 4, marginTop: 16 },
  refreshButtonText: { color: "white", fontWeight: "600" },
  emptyContainer: { alignItems: "center", padding: 16 },
  emptyText: { marginTop: 16, fontSize: 16, color: "#666", textAlign: "center" },
  bookingCard: { backgroundColor: "white", borderRadius: 8, marginBottom: 16, elevation: 2 },
  bookingHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 12 },
  bookingCode: { fontWeight: "600", fontSize: 16 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  statusText: { color: "white", fontWeight: "600", fontSize: 12 },
  divider: { height: 1, backgroundColor: "#eee" },
  bookingDetails: { padding: 12 },
  detailRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  detailText: { marginLeft: 8, color: "#333", fontSize: 14 },
  bookingFooter: { flexDirection: "row", justifyContent: "flex-end", padding: 12 },
  listContent: { paddingBottom: 16 },
});