import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, TouchableWithoutFeedback, ActivityIndicator, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AntDesign } from "@expo/vector-icons";

type User = {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  created_at: string;
};

export default function ProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalContent, setModalContent] = useState('');
  const [version, setVersion] = useState("Đang tải...");

  useEffect(() => {
    const checkAuth = async () => {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        router.replace('/');
        return;
      }

      try {
        const response = await fetch('http://192.168.1.2:5000/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (!response.ok) throw new Error('Unauthorized');

        setUser({
          id: data.id,
          full_name: data.full_name,
          email: data.email,
          phone: data.phone,
          role: data.role,
          status: data.status,
          created_at: data.created_at,
        });
      } catch (error) {
        await AsyncStorage.removeItem('token');
        router.replace('/');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  useEffect(() => {
    const fetchVersion = async () => {
      try {
        const response = await fetch(
          "https://api.github.com/repos/Jaye29dphy/Fibo/releases/latest"
        );
        const data = await response.json();
        setVersion(data.tag_name || "Không có thông tin");
      } catch (error) {
        setVersion("Lỗi tải phiên bản");
      }
    };

    fetchVersion();
  }, []);

  const handleLogout = async () => {
    await AsyncStorage.removeItem('token');
    router.replace('/');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "green";
      case "inactive": return "gray";
      case "banned": return "red";
      default: return "black";
    }
  };

  const openModal = (content: string) => {
    setModalContent(content);
    setModalVisible(true);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#42ba96" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <AntDesign
          name="arrowleft"
          size={24}
          color="white"
          onPress={() => router.back()}
        />
        <Text style={styles.title}>Hồ Sơ</Text>
      </View>

      <Image source={{ uri: 'https://randomuser.me/api/portraits/men/69.jpg' }} style={styles.avatar} />

      {/* Thông tin cá nhân */}
      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>THÔNG TIN CÁ NHÂN</Text>
        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <AntDesign name="user" size={20} color="#333" />
          <Text style={styles.label}>Tên đầy đủ:</Text>
          <Text style={styles.value}>{user?.full_name || 'N/A'}</Text>
        </View>

        <View style={styles.infoRow}>
          <AntDesign name="mail" size={20} color="#333" />
          <Text style={styles.label}>Email:</Text>
          <Text style={styles.value}>{user?.email || 'N/A'}</Text>
        </View>

        <View style={styles.infoRow}>
          <AntDesign name="phone" size={20} color="#333" />
          <Text style={styles.label}>Số điện thoại:</Text>
          <Text style={styles.value}>{user?.phone || 'N/A'}</Text>
        </View>

        <View style={styles.infoRow}>
          <AntDesign name="idcard" size={20} color="#333" />
          <Text style={styles.label}>Vai trò:</Text>
          <Text style={styles.value}>{user?.role || 'N/A'}</Text>
        </View>

        <View style={styles.infoRow}>
          <AntDesign name="infocirlceo" size={20} color="#333" />
          <Text style={styles.label}>Trạng thái:</Text>
          <Text style={styles.value}>{user?.status || 'N/A'}</Text>
          <View style={styles.statusDotContainer}>
            <View style={[styles.statusDot, { backgroundColor: getStatusColor(user?.status || '') }]} />
          </View>
        </View>

        <View style={styles.infoRow}>
          <AntDesign name="calendar" size={20} color="#333" />
          <Text style={styles.label}>Thời gian tạo tài khoản:</Text>
          <Text style={styles.value}>{user?.created_at ? new Date(user.created_at).toLocaleString("vi-VN") : 'N/A'}</Text>
        </View>
      </View>

      {/* Chính sách bảo mật & Điều khoản sử dụng */}
      <View style={styles.infoBox}>
        <TouchableOpacity onPress={() => openModal("Hoang Hoang")}>
          <Text style={styles.infoTitle}>📜 Chính sách bảo mật</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoBox}>
        <TouchableOpacity onPress={() => openModal("Quynh Anh Trinh")}>
          <Text style={styles.infoTitle}>📑 Điều khoản sử dụng</Text>
        </TouchableOpacity>
      </View>

      {/* Phiên bản ứng dụng */}
      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>🔖 Phiên bản</Text>
        <Text style={styles.infoValue}>{version}</Text>
      </View>

      {/* Nút Xóa tài khoản */}
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => router.push('/confirmdelete')}
        activeOpacity={0.7}  // Thêm hiệu ứng nhấn
      >
        <Text style={styles.deleteButtonText}>Xóa tài khoản</Text>
      </TouchableOpacity>

      {/* Nút đăng xuất (xuống cuối màn hình) */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <Text style={styles.buttonText}>Đăng xuất</Text>
        </TouchableOpacity>
      </View>


      {/* Modal Overlay */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalBox}>
            <Text style={styles.modalText}>{modalContent}</Text>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f4f4",
    paddingHorizontal: 20,
  },
  header: {
    backgroundColor: "#42ba96",
    paddingVertical: 15,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
  },
  title: {
    fontSize: 20,
    color: "white",
    fontWeight: "bold",
    marginLeft: 10,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignSelf: "center",
    marginVertical: 15,
  },
  infoBox: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
  },
  divider: {
    height: 1,
    backgroundColor: "#ddd",
    marginVertical: 10,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  label: {
    marginLeft: 8,
    fontSize: 14,
    color: "#555",
  },
  value: {
    marginLeft: "auto",
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
  },
  statusDotContainer: {
    marginLeft: 5,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  footer: {
    marginTop: "auto", // Đẩy xuống cuối màn hình
    width: "100%",
  },
  button: {
    backgroundColor: "#ff4d4d",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  logoutButton: {
    backgroundColor: "#cb0909",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  deleteButton: {
    borderWidth: 1,
    borderColor: "#cb0909",
    backgroundColor: "white",
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: "center",
    marginBottom: 10,
  },
  deleteButtonText: {
    color: "#cb0909",
    fontSize: 16,
    fontWeight: "bold",
  },
  // 💡 Thêm các style cho modal (Overlay)
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    width: "80%",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 5,
    elevation: 5,
  },
  modalText: {
    fontSize: 16,
    color: "#333",
    textAlign: "center",
    marginBottom: 15,
  },
});
