import React, { useState, useEffect } from "react";
import { useRouter } from "expo-router";
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
} from "react-native";
import AdminMenu from "./AdminMenu";
import Taskbar from "./Taskbar";
import { getUserInfo } from "../../constants/apiService";

interface UserInfo {
  name: string;
  email: string;
  avatar?: string;
}

export default function Dashboard() {
  const [selectedTab, setSelectedTab] = useState("users");
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const router = useRouter();

  const fetchUserInfo = async () => {
    try {
      const data = await getUserInfo();
  
      // Gán avatar mặc định nếu không có
      const processedData = {
        ...data,
        avatar:
          data.avatar && data.avatar.trim() !== ""
            ? data.avatar
            : "https://www.w3schools.com/howto/img_avatar.png",
      };
  
      setUserInfo(processedData);
    } catch (error) {
      console.error("Error fetching user info:", error);
    }
  };
  
  const handleAvatarPress = async () => {
    if (!userInfo) {
      await fetchUserInfo(); // chỉ gọi khi chưa có user
    }
    setShowDropdown((prev) => !prev); // toggle dropdown
  };

  const handleLogout = () => {
    router.replace("/customer")
  };

  const renderContent = () => {
    switch (selectedTab) {
      case "users":
        return <Text>Quản lý người dùng</Text>;
      case "partners":
        return <Text>Quản lý đối tác</Text>;
      case "bookings":
        return <Text>Quản lý đặt sân</Text>;
      case "revenue":
        return <Text>Quản lý doanh thu</Text>;
      case "feedback":
        return <Text>Quản lý phản hồi</Text>;
      case "notifications":
        return <Text>Quản lý thông báo</Text>;
      case "events":
        return <Text>Quản lý sự kiện</Text>;
      default:
        return <Text>Chọn một tab để hiển thị nội dung</Text>;
    }
  };

  return (
    <View style={styles.container}>
      <Taskbar userInfo={userInfo} onAvatarPress={handleAvatarPress} />

      {/* Dropdown nằm ngoài taskbar */}
      {showDropdown && (
        <View style={styles.dropdown}>
          <Text style={styles.dropdownText}>{userInfo?.name}</Text>
          <Text style={styles.dropdownText}>{userInfo?.email}</Text>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Text style={styles.logoutText}>Đăng xuất</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.mainContent}>
        <AdminMenu onSelect={setSelectedTab} />
        <ScrollView style={styles.content}>{renderContent()}</ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mainContent: {
    flexDirection: "row",
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  dropdown: {
    position: "absolute",
    top: 60,
    right: 20,
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 10,
    zIndex: 999,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  dropdownText: {
    fontSize: 14,
    marginBottom: 5,
  },
  logoutButton: {
    marginTop: 5,
    backgroundColor: "#e74c3c",
    padding: 8,
    borderRadius: 5,
  },
  logoutText: {
    color: "#fff",
    textAlign: "center",
  },
});
