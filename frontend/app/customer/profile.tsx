import React, { useEffect, useState, useCallback } from "react";
import * as FileSystem from "expo-file-system"; 
import { Platform } from "react-native";
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
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { AntDesign, FontAwesome5, MaterialIcons } from "@expo/vector-icons";
import { getUserInfo, uploadAvatar, fetchLatestRelease , updateUserInfo } from "@/constants/apiService";
import { AVATAR_BASE_URL } from "@/constants/apiConfig";

type User = {
  user_id: number;
  full_name: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  created_at: string;
  avatar: string;
};

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
  const [uploading, setUploading] = useState(false);
  const [editedUser, setEditedUser] = useState<User | null>(null);
  const [release, setRelease] = useState<GitHubRelease | null>(null);
  const [releaseLoading, setReleaseLoading] = useState(true);
  const [tempAvatar, setTempAvatar] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (!token) {
          router.replace("/customer");
          return;
        }
        const data = await getUserInfo();
        setUser(data);
        setEditedUser(data);
      } catch (error) {
        console.error("Error fetching user info:", error);
        await AsyncStorage.removeItem("token");
        router.replace("/customer");
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

  const uploadAvatarToServer = useCallback(async (imageUri: string) => {
    console.log("Bắt đầu uploadAvatarToServer, imageUri:", imageUri);
    console.log("User object:", user);
    if (!user || !user.user_id) {
      console.log("User or user.user_id is undefined, aborting");
      Alert.alert("Lỗi", "Không thể upload ảnh vì thông tin user không hợp lệ.");
      return;
    }
  
    setUploading(true);
    setTempAvatar(imageUri);
    console.log("Đã set tempAvatar:", imageUri);
  
    try {
      // Create the FormData object
      const formData = new FormData();
      
      // Add the image to FormData with appropriate metadata
      const filename = imageUri.split('/').pop() || `avatar_${Date.now()}.jpg`;
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';
      
      // Prepare the file object in a format Expo & React Native can handle
      // @ts-ignore - Type definition mismatch with React Native's FormData
      formData.append('avatar', {
        uri: imageUri,
        name: filename,
        type
      });
      
      // Add user_id as a separate field
      formData.append("user_id", user.user_id.toString());
      
      console.log("FormData đã tạo với các trường:", Object.fromEntries(formData));
  
      const response = await uploadAvatar(formData);
      console.log("API response:", response);
      
      if (response.avatar) {
        setUser((prevUser) =>
          prevUser ? { ...prevUser, avatar: response.avatar } : null
        );
        setTempAvatar(null);
        console.log("Upload thành công, avatar từ server:", response.avatar);
      }
    } catch (error) {
      console.error("Upload error:", error);
      setTempAvatar(null);
      Alert.alert("Lỗi", "Không thể cập nhật ảnh đại diện. Vui lòng thử lại.");
    } finally {
      setUploading(false);
      console.log("Hoàn tất uploadAvatarToServer");
    }
  }, [user]);

  const pickImage = useCallback(async (useCamera: boolean) => {
    console.log("Bắt đầu pickImage, useCamera:", useCamera);
    try {
      const permissionResult = useCamera
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
  
      if (!permissionResult.granted) {
        Alert.alert("Lỗi", "Ứng dụng cần quyền truy cập để tiếp tục!");
        return;
      }
  
      const result = useCamera
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 1,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 1,
          });
  
      console.log("ImagePicker result:", result);
  
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;
        console.log("Selected image URI:", imageUri);
        console.log("User trước khi upload:", user);
        await uploadAvatarToServer(imageUri);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Lỗi", "Không thể chọn ảnh. Vui lòng thử lại.");
    }
  }, [user, uploadAvatarToServer]);

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem("token");
      router.replace("/customer");
      Alert.alert("Thành công", "Bạn đã đăng xuất thành công!");
    } catch (error) {
      console.error("Lỗi khi đăng xuất:", error);
      Alert.alert("Lỗi", "Không thể đăng xuất. Vui lòng thử lại.");
    }
  };

  const handleEditUser = async () => {
    if (!editedUser) return;
  
    try {
      await updateUserInfo(editedUser.user_id, {
        full_name: editedUser.full_name,
        email: editedUser.email,
        phone: editedUser.phone,
      });
  
      const freshUser = await getUserInfo(); // gọi lại API để lấy dữ liệu mới nhất
      setUser(freshUser); // cập nhật lại giao diện
      Alert.alert("Thành công", "Thông tin đã được cập nhật!");
      setEditModalVisible(false);
    } catch (error) {
      console.error("Lỗi khi cập nhật:", error);
      Alert.alert("Lỗi", "Không thể cập nhật thông tin.");
    }
  };
  

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <AntDesign name="arrowleft" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.title}>Hồ Sơ</Text>
      </View>
      <View style={styles.avatarSection}>
        <TouchableOpacity
          style={styles.avatarContainer}
          onPress={() => setModalVisible(true)}
          disabled={uploading}
        >
          <Image
            source={{
              uri:
                tempAvatar ||
                (user?.avatar && (user.avatar.startsWith('http') ? user.avatar : `${AVATAR_BASE_URL}/${user.avatar}?t=${Date.now()}`)) ||
                "https://via.placeholder.com/100.png?text=User",
            }}
            style={styles.avatar}
            onError={(e) => console.log("Avatar load error:", e.nativeEvent.error)}
          />
          {uploading ? (
            <ActivityIndicator
              size="small"
              color="#42ba96"
              style={styles.editIcon}
            />
          ) : (
            <View style={styles.editIcon}>
              <FontAwesome5 name="edit" size={16} color="#fff" />
            </View>
          )}
        </TouchableOpacity>
        <Text style={styles.userName}>{user?.full_name || "N/A"}</Text>
      </View>
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

      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => router.push("/customer/confirmdelete")}
        activeOpacity={0.7}
      >
        <Text style={styles.deleteButtonText}>Xóa tài khoản</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Đăng Xuất</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Cập nhật ảnh đại diện</Text>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => pickImage(true)}
              disabled={uploading}
            >
              <FontAwesome5 name="camera" size={20} color="#42ba96" />
              <Text style={styles.modalButtonText}>Chụp ảnh</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => pickImage(false)}
              disabled={uploading}
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


      <Modal visible={editModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={[styles.modalTitle, { alignSelf: "center" }]}>
              Chỉnh sửa thông tin
            </Text>

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

const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f4f4",
  },
  header: {
    backgroundColor: "#42ba96",
    paddingVertical: 15,
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between", // Căn chỉnh nút quay lại và tiêu đề
    width: "100%", // Đảm bảo header chiếm toàn màn hình
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  title: {
    fontSize: 20,
    color: "white",
    fontWeight: "bold",
    flex: 1, // Cho phép tiêu đề chiếm không gian còn lại
    textAlign: "center", // Căn giữa tiêu đề
  },
  avatarSection: {
    alignItems: "center",
    marginVertical: 20,
  },
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
    marginHorizontal: 20, // Đảm bảo căn đều với container
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
  infoTitle: {
    fontSize: 16,
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
  logoutButton: {
    backgroundColor: "#ff4d4d",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 20,
    marginHorizontal: 20, // Đảm bảo căn đều với container
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
    marginHorizontal: 20, // Đảm bảo căn đều với container
  },
  deleteButtonText: {
    color: "#cb0909",
    fontSize: 16,
    fontWeight: "bold",
  },
  logoutText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "bold",
  },
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
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#333",
  },
  modalButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    width: "100%",
    justifyContent: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  modalButtonText: {
    marginLeft: 10,
    fontSize: 16,
    color: "#42ba96",
  },
  modalClose: {
    marginTop: 10,
  },
  modalCloseText: {
    fontSize: 16,
    color: "#ff4d4d",
    fontWeight: "bold",
  },
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
  saveButtonText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "bold",
  },
});