// notifications.tsx
import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity, FlatList } from "react-native";
import { useRouter } from "expo-router";
import BottomTabs from "./BottomTabs";
import { AntDesign } from "@expo/vector-icons";
import { getNotifications } from "../../constants/apiService"; 

interface Notification {
  notification_id: number;
  message: string;
  is_read: boolean;
  created_at: string;
}

export default function NotificationScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

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

  // Hàm xử lý sự kiện quay lại màn hình Dashboard
  const handleBack = () => {
    router.push("/customer/dashboard");
  };

  // Render mỗi thông báo
  const renderNotification = ({ item }: { item: Notification }) => (
    <View style={styles.notificationContent}>
      <Image
        source={{ uri: "https://example  avatar.jpg" }} // Có thể thay đổi để lấy avatar động từ backend
        style={styles.avatar}
      />
      <View style={styles.notificationTextContainer}>
        <Text style={styles.notificationText}>{item.message}</Text>
        <Text style={styles.notificationTime}>
          {new Date(item.created_at).toLocaleString()}
        </Text>
      </View>
    </View>
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
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  notificationTextContainer: {
    flex: 1,
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
});