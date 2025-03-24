// NotificationScreen.tsx
import React from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";

export default function NotificationScreen() {
  const router = useRouter();

  // Hàm xử lý sự kiện quay lại màn hình Dashboard
  const handleBack = () => {
    router.push("/dashboard");
  };

  return (
    <View style={styles.container}>
      {/* Thanh màu xanh thông báo */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.notificationTitle}>Thông báo</Text>
      </View>

      {/* Nội dung thông báo */}
      <View style={styles.body}>
        <View style={styles.notificationContent}>
          <Image
            source={{ uri: "https://example.com/avatar.jpg" }} // Thay thế với đường dẫn hình ảnh của bạn
            style={styles.avatar}
          />
          <View style={styles.notificationTextContainer}>
            <Text style={styles.notificationText}>
              Bạn có một thông báo mới từ người dùng. Click để xem chi tiết!
            </Text>
          </View>
        </View>
      </View>
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
    backgroundColor: "#37ff00", // Màu xanh giống Facebook
    padding: 15,
  },
  backButton: {
    marginRight: 10,
  },
  backButtonText: {
    color: "white",
    fontSize: 20,
  },
  notificationTitle: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
  },
  body: {
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  notificationContent: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 10,
    padding: 15,
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
});
