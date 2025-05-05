import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity, FlatList, Modal } from "react-native";
import { useRouter } from "expo-router";
import BottomTabs from "./BottomTabs";
import { AntDesign } from "@expo/vector-icons";
import { getNotifications, markNotificationAsRead } from "../../constants/apiService";

interface Notification {
  notification_id: number;
  message: string;
  is_read: boolean;
  created_at: string;
  user_name: string;
}

export default function NotificationScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Lấy danh sách thông báo khi component mount
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const data = await getNotifications();
        setNotifications(data);
      } catch (error) {
        console.error("Lỗi khi lấy thông báo:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  // Hàm xử lý khi click vào thông báo
  const handleNotificationPress = async (notification: Notification) => {
    setSelectedNotification(notification);
    setModalVisible(true);

    // Đánh dấu thông báo là đã đọc nếu chưa đọc
    if (!notification.is_read) {
      try {
        await markNotificationAsRead(notification.notification_id);
        setNotifications((prev) =>
          prev.map((n) =>
            n.notification_id === notification.notification_id ? { ...n, is_read: true } : n
          )
        );
      } catch (error) {
        console.error("Lỗi khi đánh dấu thông báo là đã đọc:", error);
      }
    }
  };

  // Hàm xử lý sự kiện quay lại màn hình Dashboard
  const handleBack = () => {
    router.push("/customer/dashboard");
  };

  // Render mỗi thông báo
  const renderNotification = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[styles.notificationContent, item.is_read ? styles.read : styles.unread]}
      onPress={() => handleNotificationPress(item)}
    >
      <Image
        source={{ uri: "https://gamelandvn.com/wp-content/uploads/anh/2017/03/170325-crazyguy-csgo-01.jpg" }}
        style={styles.avatar}
      />
      <View style={styles.notificationTextContainer}>
        <Text style={styles.notificationText}>{item.message}</Text>
        <Text style={styles.notificationDetailText}>Nhấn vào để xem chi tiết</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Thanh màu xanh thông báo */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <AntDesign name="arrowleft" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.notificationTitle}>Thông báo</Text>
      </View>

      {/* Nội dung thông báo */}
      <View style={styles.body}>
        {loading ? (
          <Text>Đang tải...</Text>
        ) : notifications.length === 0 ? (
          <Text>Không có thông báo nào!</Text>
        ) : (
          <FlatList
            data={notifications}
            renderItem={renderNotification}
            keyExtractor={(item) => item.notification_id.toString()}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      {/* Modal hiển thị chi tiết thông báo */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedNotification && (
              <>
                <Text style={styles.modalTitle}>Chi tiết thông báo</Text>
                <Text style={styles.modalLabel}>Nội dung: {selectedNotification.message}</Text>
                <Text style={styles.modalLabel}>
                  Thời gian gửi: {new Date(selectedNotification.created_at).toLocaleString()}
                </Text>
                <Text style={styles.modalLabel}>
                  Trạng thái: {selectedNotification.is_read ? "Đã đọc" : "Chưa đọc"}
                </Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.closeButtonText}>Đóng</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Hiển thị Bottom Tab */}
      <BottomTabs />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#37ff00",
    padding: 15,
  },
  backButton: {
    marginRight: 10,
  },
  logo: {
    width: 30,
    height: 30,
    marginRight: 10,
  },
  notificationTitle: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
  },
  body: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  notificationContent: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  read: {
    backgroundColor: "#e0e0e0",
  },
  unread: {
    backgroundColor: "white",
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  notificationTextContainer: {
    flex: 1,
  },
  notificationDetailText: {
    fontSize: 12,
    color: "#37ff00",
    marginTop: 5,
    fontStyle: "italic",
  },
  notificationText: {
    fontSize: 16,
    color: "#333",
  },
  notificationTime: {
    fontSize: 12,
    color: "#666",
    marginTop: 5,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: "80%",
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  modalLabel: {
    fontSize: 16,
    color: "#333",
    marginBottom: 10,
    textAlign: "left",
    width: "100%",
  },
  closeButton: {
    backgroundColor: "#37ff00",
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  closeButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});