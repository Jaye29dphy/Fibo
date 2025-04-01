import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Alert,
  ScrollView,
  TextInput,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { AntDesign, FontAwesome5, MaterialIcons } from "@expo/vector-icons";
import { getUserInfo, uploadAvatar, fetchLatestRelease } from "../constants/apiService";

// Interface cho dữ liệu user
type User = {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  created_at: string;
  avatar: string;
};

// Interface cho dữ liệu release từ GitHub
interface GitHubRelease {
  tag_name: string;
  published_at: string;
  name?: string;
  body?: string;
}

export default function ProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editedUser, setEditedUser] = useState<User | null>(null);
  // State để lưu thông tin release
  const [release, setRelease] = useState<GitHubRelease | null>(null);
  const [releaseLoading, setReleaseLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (!token) {
          router.replace("/");
          return;
        }
        const data = await getUserInfo();
        setUser(data);
        setEditedUser(data);
      } catch (error) {
        console.error("Error fetching user info:", error);
        await AsyncStorage.removeItem("token");
        router.replace("/");
      } finally {
        setLoading(false);
      }
    };

    const getRelease = async () => {
      setReleaseLoading(true);
      const latestRelease = await fetchLatestRelease();
      setRelease(latestRelease);
      setReleaseLoading(false);
    };

    checkAuth();
    getRelease();
  }, []);

  const pickImage = useCallback(async (useCamera: boolean) => {
    setModalVisible(false);
    let result;

    if (useCamera) {
      result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });
    } else {
      result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });
    }

    if (!result.canceled) {
      uploadAvatarToServer(result.assets[0].uri);
    }
  }, []);

  const uploadAvatarToServer = useCallback(async (imageUri: string) => {
    if (!user) return;

    const formData = new FormData();
    formData.append("avatar", {
      uri: imageUri,
      name: `${user.id}_avatar.jpg`,
      type: "image/jpeg",
    } as any);

    formData.append("userId", user.id.toString());

    try {
      const response = await uploadAvatar(formData);
      if (response.avatar) {
        setUser((prevUser) =>
          prevUser ? { ...prevUser, avatar: response.avatar } : null
        );
        Alert.alert("Thành công", "Ảnh đại diện đã được cập nhật!");
      }
    } catch (error) {
      console.error("Lỗi khi upload ảnh:", error);
      Alert.alert("Lỗi", "Không thể cập nhật ảnh đại diện. Vui lòng thử lại.");
    }
  }, [user]);

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem("token");
      router.replace("/");
      Alert.alert("Thành công", "Bạn đã đăng xuất thành công!");
    } catch (error) {
      console.error("Lỗi khi đăng xuất:", error);
      Alert.alert("Lỗi", "Không thể đăng xuất. Vui lòng thử lại.");
    }
  };

  const handleEditUser = () => {
    // Giả lập API để cập nhật thông tin người dùng
    setUser(editedUser);
    setEditModalVisible(false);
    Alert.alert("Thành công", "Thông tin cá nhân đã được cập nhật!");
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#42ba96" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <AntDesign
          name="arrowleft"
          size={24}
          color="white"
          onPress={() => router.back()}
        />
        <Text style={styles.title}>Hồ Sơ</Text>
      </View>

      {/* Ảnh đại diện */}
      <View style={styles.avatarSection}>
        <TouchableOpacity
          style={styles.avatarContainer}
          onPress={() => setModalVisible(true)}
        >
          <Image
            source={{
              uri:
                user?.avatar ||
                "https://via.placeholder.com/100.png?text=User",
            }}
            style={styles.avatar}
          />
          <View style={styles.editIcon}>
            <FontAwesome5 name="edit" size={16} color="#fff" />
          </View>
        </TouchableOpacity>
        <Text style={styles.userName}>{user?.full_name || "N/A"}</Text>
      </View>

      {/* Thông tin cá nhân */}
      <View style={styles.infoBox}>
        <View style={styles.infoHeader}>
          <Text style={styles.infoTitle}>THÔNG TIN CÁ NHÂN</Text>
          <TouchableOpacity onPress={() => setEditModalVisible(true)}>
            <MaterialIcons name="edit" size={20} color="#42ba96" />
          </TouchableOpacity>
        </View>
        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <AntDesign name="user" size={20} color="#333" />
          <Text style={styles.label}>Tên đầy đủ:</Text>
          <Text style={styles.value}>{user?.full_name || "N/A"}</Text>
        </View>

        <View style={styles.infoRow}>
          <AntDesign name="mail" size={20} color="#333" />
          <Text style={styles.label}>Email:</Text>
          <Text style={styles.value}>{user?.email || "N/A"}</Text>
        </View>

        <View style={styles.infoRow}>
          <AntDesign name="phone" size={20} color="#333" />
          <Text style={styles.label}>Số điện thoại:</Text>
          <Text style={styles.value}>{user?.phone || "N/A"}</Text>
        </View>

        <View style={styles.infoRow}>
          <AntDesign name="idcard" size={20} color="#333" />
          <Text style={styles.label}>Vai trò:</Text>
          <Text style={styles.value}>{user?.role || "N/A"}</Text>
        </View>

        <View style={styles.infoRow}>
          <AntDesign name="calendar" size={20} color="#333" />
          <Text style={styles.label}>Ngày tạo:</Text>
          <Text style={styles.value}>
            {user?.created_at
              ? new Date(user.created_at).toLocaleString("vi-VN", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })
              : "N/A"}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <AntDesign name="checkcircle" size={20} color="#333" />
          <Text style={styles.label}>Trạng thái:</Text>
          <Text style={styles.value}>{user?.status || "N/A"}</Text>
        </View>
      </View>

      {/* Phần thông tin phiên bản (thêm vào đây) */}
      <View style={styles.infoBox}>
        <View style={styles.infoHeader}>
          <Text style={styles.infoTitle}>THÔNG TIN PHIÊN BẢN</Text>
        </View>
        <View style={styles.divider} />

        {releaseLoading ? (
          <Text style={styles.value}>Đang tải...</Text>
        ) : release ? (
          <>
            <View style={styles.infoRow}>
              <AntDesign name="tag" size={20} color="#333" />
              <Text style={styles.label}>Phiên bản:</Text>
              <Text style={styles.value}>{release.tag_name}</Text>
            </View>
          </>
        ) : (
          <Text style={styles.value}>Không có thông tin phiên bản.</Text>
        )}
      </View>

      {/* Nút Xóa tài khoản */}
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => router.push("/confirmdelete")}
        activeOpacity={0.7}
      >
        <Text style={styles.deleteButtonText}>Xóa tài khoản</Text>
      </TouchableOpacity>

      {/* Nút đăng xuất */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Đăng Xuất</Text>
      </TouchableOpacity>

      {/* Modal chọn ảnh */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={[styles.modalTitle, { alignSelf: "center" }]}>
              Cập nhật ảnh đại diện
            </Text>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => pickImage(true)}
            >
              <FontAwesome5 name="camera" size={20} color="#42ba96" />
              <Text style={styles.modalButtonText}>Chụp ảnh</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => pickImage(false)}
            >
              <FontAwesome5 name="images" size={20} color="#42ba96" />
              <Text style={styles.modalButtonText}>Chọn từ thư viện</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalClose}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.modalCloseText}>Hủy</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal chỉnh sửa thông tin */}
      <Modal visible={editModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={[styles.modalTitle, { alignSelf: "center" }]}>Chỉnh sửa thông tin</Text>

            <Text style={styles.modalLabel}>Tên đầy đủ:</Text>
            <TextInput
              style={styles.input}
              value={editedUser?.full_name}
              onChangeText={(text) =>
                setEditedUser((prev) =>
                  prev ? { ...prev, full_name: text } : null
                )
              }
            />

            <Text style={styles.modalLabel}>Email:</Text>
            <TextInput
              style={styles.input}
              value={editedUser?.email}
              onChangeText={(text) =>
                setEditedUser((prev) =>
                  prev ? { ...prev, email: text } : null
                )
              }
            />

            <Text style={styles.modalLabel}>Số điện thoại:</Text>
            <TextInput
              style={styles.input}
              value={editedUser?.phone}
              onChangeText={(text) =>
                setEditedUser((prev) =>
                  prev ? { ...prev, phone: text } : null
                )
              }
            />

            <TouchableOpacity
              style={[styles.saveButton, { alignSelf: "center" }]}
              onPress={handleEditUser}
            >
              <Text style={styles.saveButtonText}>Lưu</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalClose, { alignSelf: "center" }]}
              onPress={() => setEditModalVisible(false)}
            >
              <Text style={styles.modalCloseText}>Hủy</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f4f4f4", paddingHorizontal: 20 },
  header: {
    backgroundColor: "#42ba96",
    paddingVertical: 15,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  title: { fontSize: 20, color: "white", fontWeight: "bold", marginLeft: 10 },
  avatarSection: { alignItems: "center", marginVertical: 20 },
  avatarContainer: {
    position: "relative",
    padding: 10,
    borderRadius: 60,
    backgroundColor: "#fff",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: "#42ba96",
  },
  editIcon: {
    position: "absolute",
    bottom: 10,
    right: 10,
    backgroundColor: "#42ba96",
    borderRadius: 15,
    padding: 5,
  },
  userName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginTop: 10,
  },
  infoBox: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  infoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  infoTitle: { fontSize: 16, fontWeight: "bold", color: "#333" },
  divider: { height: 1, backgroundColor: "#ddd", marginVertical: 10 },
  infoRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  label: { marginLeft: 8, fontSize: 14, color: "#555" },
  value: { marginLeft: "auto", fontSize: 14, fontWeight: "bold", color: "#333" },
  logoutButton: {
    backgroundColor: "#ff4d4d",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 20,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
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
  logoutText: { fontSize: 16, color: "#fff", fontWeight: "bold" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalLabel: {
    fontSize: 14,
    color: "#555",
    marginBottom: 5,
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    width: "80%",
    alignItems: "flex-start",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 15, color: "#333" },
  modalButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    width: "100%",
    justifyContent: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  modalButtonText: { marginLeft: 10, fontSize: 16, color: "#42ba96" },
  modalClose: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    width: "100%",
    justifyContent: "center",
    marginTop: 10,
  },
  modalCloseText: { fontSize: 16, color: "#ff4d4d", fontWeight: "bold" },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
    fontSize: 14,
    alignSelf: "stretch",
  },
  saveButton: {
    backgroundColor: "#42ba96",
    paddingVertical: 10,
    borderRadius: 5,
    width: "100%",
    alignItems: "center",
    marginBottom: 10,
  },
  saveButtonText: { fontSize: 16, color: "#fff", fontWeight: "bold" },
});