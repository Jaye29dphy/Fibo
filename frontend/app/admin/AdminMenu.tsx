import React from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";

interface AdminMenuProps {
  onSelect: (tab: string) => void;
}

export default function AdminMenu({ onSelect }: AdminMenuProps) {
  return (
    <View style={styles.menu}>
      <Text style={styles.menuTitle}>Menu</Text>
      <TouchableOpacity onPress={() => onSelect("users")} style={styles.button}>
        <Text style={styles.buttonText}>Quản lý người dùng</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => onSelect("partners")} style={styles.button}>
        <Text style={styles.buttonText}>Quản lý sân</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => onSelect("bookings")} style={styles.button}>
        <Text style={styles.buttonText}>Quản lý đơn đặt sân</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => onSelect("revenue")} style={styles.button}>
        <Text style={styles.buttonText}>Quản lý doanh thu</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => onSelect("feedback")} style={styles.button}>
        <Text style={styles.buttonText}>Quản lý phản hồi</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => onSelect("notifications")} style={styles.button}>
        <Text style={styles.buttonText}>Quản lý thông báo</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => onSelect("events")} style={styles.button}>
        <Text style={styles.buttonText}>Quản lý sự kiện</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  menu: {
    width: 300, // Tăng chiều rộng thanh menu
    backgroundColor: "#fff",
    padding: 25, // Tăng padding để tạo không gian rộng hơn
    borderRightWidth: 1,
    borderRightColor: "#ccc",
    justifyContent: "space-between", // Căn chỉnh các item
  },
  menuTitle: {
    fontSize: 22, // Tăng kích thước font title
    fontWeight: "bold",
    marginBottom: 30, // Giãn cách giữa title và các item
    textAlign: "center",
    color: "#333",
  },
  button: {
    backgroundColor: "#4CAF50", // Nền màu xanh lá cây
    paddingVertical: 18, // Tăng chiều cao của nút
    paddingHorizontal: 25, // Tăng chiều rộng của nút
    borderRadius: 5,
    marginBottom: 12, // Tăng khoảng cách giữa các nút
    alignItems: "center", // Căn giữa văn bản
  },
  buttonText: {
    fontSize: 16,
    color: "#fff", // Chữ màu trắng
    fontWeight: "600",
  },
});
