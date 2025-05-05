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
  Alert,
  Dimensions,
} from "react-native";
import { PieChart } from "react-native-chart-kit";
import { getNotification, sendNotificationToAllUsers } from "@/constants/apiService";

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
  const [showStats, setShowStats] = useState<boolean>(false);
  const [showSendNotification, setShowSendNotification] = useState<boolean>(false);
  const [notificationMessage, setNotificationMessage] = useState<string>("");

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const data = await getNotification();
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

  const handleSendNotification = async () => {
    if (!notificationMessage.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập nội dung thông báo.");
      return;
    }

    try {
      setLoading(true);
      await sendNotificationToAllUsers(notificationMessage);
      Alert.alert("Thành công", "Thông báo đã được gửi đến tất cả người dùng.");
      setNotificationMessage("");
      setShowSendNotification(false);
      await fetchNotifications();
    } catch (err: any) {
      console.error("Lỗi khi gửi thông báo:", err.message, err.stack);
      Alert.alert("Lỗi", "Không thể gửi thông báo: " + err.message);
    } finally {
      setLoading(false);
    }
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

  const getStatistics = () => {
    const totalNotifications = notifications.length;
    const totalRead = notifications.filter((notification) => notification.is_read === "read").length;
    const totalUnread = notifications.filter((notification) => notification.is_read === "unread").length;

    return {
      totalNotifications,
      totalRead,
      totalUnread,
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
      name: "Đã đọc",
      population: stats.totalRead,
      color: "#4CAF50",
      legendFontColor: "#333",
      legendFontSize: 14,
    },
    {
      name: "Chưa đọc",
      population: stats.totalUnread,
      color: "#F44336",
      legendFontColor: "#333",
      legendFontSize: 14,
    },
  ].filter((item) => item.population > 0); // Remove segments with zero population

  const screenWidth = Dimensions.get("window").width;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Danh sách thông báo</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={[styles.statsButton, { marginRight: 8 }]}
            onPress={() => setShowStats(true)}
          >
            <Text style={styles.statsButtonText}>Thống kê</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.statsButton}
            onPress={() => setShowSendNotification(true)}
          >
            <Text style={styles.statsButtonText}>Gửi thông báo</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TextInput
        placeholder="Tìm theo nội dung hoặc người nhận..."
        style={styles.searchInput}
        value={searchKeyword}
        onChangeText={setSearchKeyword}
      />

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

      <FlatList
        data={filteredNotifications}
        keyExtractor={(item) => item.notification_id.toString()}
        renderItem={renderNotificationItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Không tìm thấy thông báo nào.</Text>
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
            <Text style={styles.modalTitle}>Thống kê thông báo</Text>
            <View style={styles.statsContainer}>
              <Text style={styles.modalText}>Tổng số thông báo: {stats.totalNotifications}</Text>
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

      <Modal
        visible={showSendNotification}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSendNotification(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Gửi thông báo đến tất cả người dùng</Text>
            <TextInput
              placeholder="Nhập nội dung thông báo..."
              style={[styles.searchInput, { marginBottom: 16 }]}
              value={notificationMessage}
              onChangeText={setNotificationMessage}
              multiline
            />
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={[styles.closeButton, { backgroundColor: "#E0E0E0", marginRight: 8 }]}
                onPress={() => setShowSendNotification(false)}
              >
                <Text style={[styles.closeButtonText, { color: "#000" }]}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleSendNotification}
              >
                <Text style={styles.closeButtonText}>Gửi</Text>
              </TouchableOpacity>
            </View>
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
  headerButtons: {
    flexDirection: "row",
    alignItems: "center",
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
    width: "100%",
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
  modalButtonContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    width: "100%",
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

export default ManageNotifications;