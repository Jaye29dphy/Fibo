// f:\school\Ki 6\Cross-platform App Development\Fibo\frontend\app\owner\schedule2.tsx
import React, { useState, useEffect } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Alert, RefreshControl, SafeAreaView,
  TextInput, ScrollView
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { AntDesign, MaterialIcons, Feather } from "@expo/vector-icons";
import { useOwnerSchedule, OwnerBooking } from "@/hooks/useOwnerSchedule";
import BottomTabs from "./BottomTabs";

export default function OwnerScheduleList() {
  const router = useRouter();
  const { selectedDate } = useLocalSearchParams();
  const { bookings, loading, error, refreshBookings } = useOwnerSchedule();
  const [filteredBookings, setFilteredBookings] = useState<OwnerBooking[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Status filters
  const statusFilters = [
    { key: "all", label: "Tất cả" },
    { key: "pending", label: "Chờ xác nhận" },
    { key: "confirmed", label: "Đã xác nhận" },
    { key: "completed", label: "Đã hoàn thành" },
    { key: "cancelled", label: "Đã hủy" }
  ];

  // Format thời gian từ YYYY-MM-DD HH:MM:SS -> HH:MM
  const formatTime = (timeString: string) => {
    if (!timeString) return "";
    const timePart = timeString.split(" ")[1];
    if (!timePart) return "";
    return timePart.substring(0, 5);
  };

  // Format date from YYYY-MM-DD -> DD/MM/YYYY
  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const dateParts = dateString.split("-");
    if (dateParts.length !== 3) return dateString;
    return `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
  };  // Apply all filters (date, search, status)
  useEffect(() => {
    console.log("Applying filters to bookings:", {
      selectedDate,
      statusFilter,
      bookingsCount: bookings.length
    });

    if (bookings) {
      let filtered = [...bookings];

      // Apply date filter if selected
      if (selectedDate) {
        console.log("Filtering by date:", selectedDate);
        filtered = filtered.filter(booking => {
          // Try booking_date first (from SQL DATE() function)
          if (booking.booking_date) {
            const match = booking.booking_date === selectedDate;
            return match;
          }

          // Try multiple date format options
          let bookingDate = "";

          if (booking.start_time) {
            if (booking.start_time.includes(" ")) {
              bookingDate = booking.start_time.split(" ")[0];
            } else if (booking.start_time.includes("T")) {
              bookingDate = booking.start_time.split("T")[0];
            } else if (booking.start_time.includes("-") && booking.start_time.length >= 10) {
              bookingDate = booking.start_time.substring(0, 10);
            }
          }

          const match = bookingDate === selectedDate;
          return match;
        });
        console.log(`After date filter: ${filtered.length} bookings match date ${selectedDate}`);
      }

      // Apply status filter if not "all"
      if (statusFilter !== "all") {
        console.log("Filtering by status:", statusFilter);
        filtered = filtered.filter(
          (booking) => booking.status === statusFilter
        );
        console.log(`After status filter: ${filtered.length} bookings match status ${statusFilter}`);
      }

      // Apply search filter
      if (searchQuery.trim() !== "") {
        const query = searchQuery.toLowerCase();
        console.log("Filtering by search query:", query);
        filtered = filtered.filter(
          (booking) =>
            (booking.field_name && booking.field_name.toLowerCase().includes(query)) ||
            (booking.booking_code && booking.booking_code.toLowerCase().includes(query)) ||
            (booking.customer_name && booking.customer_name.toLowerCase().includes(query)) ||
            (booking.field_description && booking.field_description.toLowerCase().includes(query))
        );
        console.log(`After search filter: ${filtered.length} bookings match query "${query}"`);
      }

      console.log(`Final filtered bookings: ${filtered.length}`);
      setFilteredBookings(filtered);
    } else {
      setFilteredBookings([]);
    }
  }, [bookings, selectedDate, searchQuery, statusFilter]);
  // Màu sắc cho trạng thái đặt sân
  const getStatusColor = (status: string) => {
    const statusColors: Record<string, string> = {
      confirmed: "#4CAF50",
      pending: "#FFD700",
      cancelled: "#FF6347",
      completed: "#808080",
    };
    return statusColors[status] || "#0000FF";
  };

  // Hiển thị tên trạng thái bằng tiếng Việt
  const getStatusText = (status: string) => {
    const statusText: Record<string, string> = {
      confirmed: "Đã xác nhận",
      pending: "Chờ xác nhận",
      cancelled: "Đã hủy",
      completed: "Đã hoàn thành",
    };
    return statusText[status] || status;
  };

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
              ? `Lịch đặt sân ngày ${formatDate(selectedDate as string)}`
              : "Tất cả lịch đặt sân"}
          </Text>
        </View>        <View style={styles.content}>
          {/* Top fixed section with search and filters */}
          <View style={styles.fixedTopSection}>
            {/* Search Bar */}
            <View style={styles.searchContainer}>
              <View style={styles.searchBar}>
                <Feather name="search" size={18} color="gray" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Tìm theo tên sân, mã đặt sân..."
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

            {/* Status Filters */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.filterContainer}
              contentContainerStyle={styles.filtersContent}
            >
              {statusFilters.map((filter) => (
                <TouchableOpacity
                  key={filter.key}
                  style={[
                    styles.filterButton,
                    statusFilter === filter.key && styles.filterButtonActive,
                  ]}
                  onPress={() => setStatusFilter(filter.key)}
                >
                  <Text
                    style={[
                      styles.filterText,
                      statusFilter === filter.key && styles.filterTextActive,
                    ]}
                  >
                    {filter.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#3B82F6" />
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <MaterialIcons name="error-outline" size={48} color="#FF6347" />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.refreshButton} onPress={refreshBookings}>
                <Text style={styles.refreshButtonText}>Thử lại</Text>
              </TouchableOpacity>
            </View>) : filteredBookings.length === 0 ? (
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
            <View style={styles.listContainer}>
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
                      <View
                        style={[
                          styles.statusBadge,
                          { backgroundColor: getStatusColor(item.status) },
                        ]}
                      >
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
                          {formatDate(item.start_time.split(" ")[0])} {formatTime(item.start_time)} - {formatTime(item.end_time)}
                        </Text>
                      </View>

                      <View style={styles.detailRow}>
                        <MaterialIcons name="person" size={18} color="#666" />
                        <Text style={styles.detailText}>{item.customer_name || "Khách hàng"}</Text>
                      </View>

                      {item.total_cost ? (
                        <View style={styles.detailRow}>
                          <MaterialIcons name="attach-money" size={18} color="#666" />                        <Text style={styles.detailText}>
                            {Number(item.total_cost).toLocaleString("vi-VN")}đ
                          </Text>
                        </View>
                      ) : null}
                    </View>

                    <View style={styles.bookingFooter}>
                      <MaterialIcons name="chevron-right" size={24} color="#3B82F6" />
                    </View>
                  </TouchableOpacity>
                )} refreshControl={
                  <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                contentContainerStyle={styles.listContent}
              />
            </View>
          )}
        </View>

        <BottomTabs />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#3B82F6",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  title: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 16,
    flex: 1,
  }, content: {
    flex: 1,
    padding: 16,
    position: 'relative',
  },
  fixedTopSection: {
    zIndex: 10,
    backgroundColor: "#f5f5f5",
    marginBottom: 8,
  },
  searchContainer: {
    marginBottom: 12,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: 8,
    fontSize: 16,
  },
  filterContainer: {
    marginBottom: 16,
  },
  filtersContent: {
    paddingRight: 12,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "white",
  },
  filterButtonActive: {
    backgroundColor: "#3B82F6",
    borderColor: "#3B82F6",
  },
  filterText: {
    fontSize: 14,
    color: "#666",
  },
  filterTextActive: {
    color: "white",
    fontWeight: "500",
  }, listContainer: {
    flex: 1,
    marginTop: 8,
  },
  listContent: {
    paddingBottom: 16,
  },
  bookingCard: {
    backgroundColor: "white",
    borderRadius: 8,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 2,
  },
  bookingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
  },
  bookingCode: {
    fontWeight: "600",
    fontSize: 16,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    color: "white",
    fontWeight: "600",
    fontSize: 12,
  },
  divider: {
    height: 1,
    backgroundColor: "#eee",
  },
  bookingDetails: {
    padding: 12,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  detailText: {
    marginLeft: 8,
    color: "#333",
    fontSize: 14,
  },
  bookingFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
    padding: 12,
  }, errorContainer: {
    position: 'absolute',
    top: 120, // Position below the filters
    left: 0,
    right: 0,
    height: 300,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: "#555",
    textAlign: "center",
  },
  refreshButton: {
    backgroundColor: "#3B82F6",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    marginTop: 16,
  },
  refreshButtonText: {
    color: "white",
    fontWeight: "600",
  }, emptyContainer: {
    position: 'absolute',
    top: 120, // Position below the filters
    left: 0,
    right: 0,
    height: 300,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  }, emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  loadingContainer: {
    position: 'absolute',
    top: 120,
    left: 0,
    right: 0,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
});