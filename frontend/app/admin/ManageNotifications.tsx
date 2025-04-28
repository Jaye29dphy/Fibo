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
import { getNotification } from "@/constants/apiService"; // Import từ apiService

interface Notification {
  notification_id: number;
  user_id: number;
  user_name: string;
  message: string;
  is_read: "read" | "unread";
  created_at: string;
}

const ManageNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [searchKeyword, setSearchKeyword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const data = await getNotification(); // Sử dụng hàm từ apiService
      console.log("Dữ liệu nhận được:", data);

      if (!Array.isArray(data)) {
        throw new Error("Dữ liệu trả về không phải là mảng");
      }

      setNotifications(data);
      filterNotifications(data, selectedStatus, searchKeyword);
    } catch (err: any) {
      console.error("Chi tiết lỗi:", err.message, err.stack);
      setError(err.message || "Đã xảy ra lỗi khi lấy danh sách thông báo.");
    } finally {
      setLoading(false);
    }
  };

  const filterNotifications = (data: Notification[], status: string, keyword: string) => {
    let filtered = data;

    if (status !== "all") {
      filtered = filtered.filter((notification) => notification.is_read === status);
    }

    if (keyword.trim() !== "") {
      const lowerKeyword = keyword.toLowerCase();
      filtered = filtered.filter(
        (notification) =>
          notification.message.toLowerCase().includes(lowerKeyword) ||
          notification.user_name.toLowerCase().includes(lowerKeyword)
      );
    }

    setFilteredNotifications(filtered);
    console.log("Dữ liệu sau lọc:", filtered);
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    filterNotifications(notifications, selectedStatus, searchKeyword);
  }, [selectedStatus, searchKeyword, notifications]);

  const renderNotificationItem = ({ item }: { item: Notification }) => (
    <View style={styles.notificationItem}>
      <Text style={styles.titleText}>Thông báo #{item.notification_id}</Text>
      <Text style={styles.info}>Người nhận: {item.user_name}</Text>
      <Text style={styles.info}>Nội dung: {item.message}</Text>
      <Text style={styles.info}>
        Trạng thái: {item.is_read === "read" ? "Đã đọc" : "Chưa đọc"}
      </Text>
      <Text style={styles.info}>
        Thời gian: {new Date(item.created_at).toLocaleString()}
      </Text>
    </View>
  );

  const statuses = [
    { label: "Tất cả", value: "all" },
    { label: "Đã đọc", value: "read" },
    { label: "Chưa đọc", value: "unread" },
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
      <Text style={styles.title}>Danh sách thông báo</Text>

      {/* Thanh tìm kiếm */}
      <TextInput
        placeholder="Tìm theo nội dung hoặc người nhận..."
        style={styles.searchInput}
        value={searchKeyword}
        onChangeText={setSearchKeyword}
      />

      {/* Bộ lọc trạng thái */}
      <View style={styles.filterContainer}>
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

      {/* Danh sách thông báo */}
      <FlatList
        data={filteredNotifications}
        keyExtractor={(item) => item.notification_id.toString()}
        renderItem={renderNotificationItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Không tìm thấy thông báo nào.</Text>
        }
      />
    </View>
  );
};

export default ManageNotifications;

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
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
    marginBottom: 16,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: "#E0E0E0",
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
  notificationItem: {
    padding: 12,
    marginBottom: 10,
    borderRadius: 10,
    backgroundColor: "#F1F1F1",
  },
  titleText: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  info: {
    fontSize: 14,
    color: "#888",
    marginBottom: 4,
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