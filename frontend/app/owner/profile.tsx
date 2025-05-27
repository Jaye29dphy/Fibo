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
import { AntDesign, FontAwesome5, MaterialIcons, MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { getUserInfo, uploadAvatar, fetchLatestRelease, updateUserInfo, getOwnerSubscription, purchaseSubscription } from "@/constants/apiService";
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
  business_name?: string;
  address?: string;
};

interface GitHubRelease {
  tag_name: string;
  published_at: string;
  name?: string;
  body?: string;
}

interface Subscription {
  subscription_id: number;
  owner_id: number;
  plan_id: number;
  plan_name: string;
  price: number;
  max_fields: number;
  start_date: string;
  end_date: string;
  status: "active" | "expired";
  description?: string;
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
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);

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

    const fetchSubscription = async () => {
      setSubscriptionLoading(true);
      try {
        const data = await getOwnerSubscription();
        setSubscription(data);
      } catch (error) {
        console.error("Error fetching subscription:", error);
      } finally {
        setSubscriptionLoading(false);
      }
    };

    checkAuth();
    getRelease();
    fetchSubscription();
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

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.push("/owner/dashboard"); // fallback nếu người dùng đi thẳng vào
    }
  };
  
  const handleEditUser = async () => {
      if (!editedUser) return;
    
      try {
        await updateUserInfo(editedUser.user_id, {
          full_name: editedUser.full_name,
          email: editedUser.email,
          phone: editedUser.phone,
          business_name: editedUser.business_name || "",
          address: editedUser.address || ""
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
      <TouchableOpacity onPress={handleBack}>
  <AntDesign name="arrowleft" size={24} color="white" />
</TouchableOpacity>

        <Text style={styles.title}>Hồ Sơ</Text>
      </View>

      {/* Ảnh đại diện */}
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
            onError={() => console.log("Error loading avatar image")}
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
        </View>        <View style={styles.infoRow}>
          <AntDesign name="phone" size={20} color="#333" />
          <Text style={styles.label}>Số điện thoại:</Text>
          <Text style={styles.value}>{user?.phone || "N/A"}</Text>
        </View>
        <View style={styles.infoRow}>
          <AntDesign name="shoppingcart" size={20} color="#333" />
          <Text style={styles.label}>Tên doanh nghiệp:</Text>
          <Text style={styles.value}>{user?.business_name || "Chưa cập nhật"}</Text>
        </View>
        <View style={styles.infoRow}>
          <AntDesign name="enviromento" size={20} color="#333" />
          <Text style={styles.label}>Địa chỉ:</Text>
          <Text style={styles.value}>{user?.address || "Chưa cập nhật"}</Text>
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

      {/* Thông tin hội viên */}
      <View style={styles.infoBox}>
        <View style={styles.infoHeader}>
          <Text style={styles.infoTitle}>THÔNG TIN HỘI VIÊN</Text>
        </View>
        <View style={styles.divider} />
        {subscriptionLoading ? (
          <ActivityIndicator size="small" color="#42ba96" />
        ) : subscription ? (
          <>
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="account-check" size={20} color="#333" />
              <Text style={styles.label}>Bậc hội viên:</Text>
              <Text style={[
                styles.value,
                subscription.plan_name === "VIP Pro" ? styles.proPlan : 
                subscription.plan_name === "Classic" ? styles.classicPlan : 
                styles.nonePlan
              ]}>
                {subscription.plan_name}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={20} color="#333" />
              <Text style={styles.label}>Ngày bắt đầu:</Text>
              <Text style={styles.value}>
                {subscription.start_date ? new Date(subscription.start_date).toLocaleDateString("vi-VN") : "N/A"}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="calendar" size={20} color="#333" />
              <Text style={styles.label}>Ngày kết thúc:</Text>
              <Text style={styles.value}>
                {subscription.end_date ? new Date(subscription.end_date).toLocaleDateString("vi-VN") : "N/A"}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="checkmark-circle" size={20} color={subscription.status === "active" ? "#42ba96" : "#ff4d4d"} />
              <Text style={styles.label}>Trạng thái:</Text>
              <Text style={[
                styles.value, 
                subscription.status === "active" ? styles.activeStatus : styles.expiredStatus
              ]}>
                {subscription.status === "active" ? "Còn hạn" : "Hết hạn"}
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.manageSubButton}
              onPress={() => router.push('/owner/subscriptions')}
            >
              <Text style={styles.manageSubText}>Quản lý gói đăng ký</Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.noSubscriptionContainer}>
            <Text style={styles.noSubscriptionText}>Bạn chưa có gói hội viên nào</Text>
            <TouchableOpacity
              style={styles.purchaseButton}
              onPress={() => router.push('/owner/subscriptions')}
            >
              <Text style={styles.purchaseButtonText}>Mua gói hội viên</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Thông tin phiên bản */}
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
        onPress={() => router.push("/customer/confirmdelete")}
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

      {/* Modal chỉnh sửa thông tin */}
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
            />            <Text style={styles.modalLabel}>Số điện thoại:</Text>
            <TextInput
              style={styles.input}
              value={editedUser?.phone}
              onChangeText={(text) =>
                setEditedUser((prev) =>
                  prev ? { ...prev, phone: text } : null
                )
              }
            />

            <Text style={styles.modalLabel}>Tên doanh nghiệp:</Text>
            <TextInput
              style={styles.input}
              value={editedUser?.business_name}
              placeholder="Nhập tên doanh nghiệp"
              onChangeText={(text) =>
                setEditedUser((prev) =>
                  prev ? { ...prev, business_name: text } : null
                )
              }
            />
            
            <Text style={styles.modalLabel}>Địa chỉ:</Text>
            <TextInput
              style={styles.input}
              value={editedUser?.address}
              placeholder="Nhập địa chỉ"
              onChangeText={(text) =>
                setEditedUser((prev) =>
                  prev ? { ...prev, address: text } : null
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
  noSubscriptionContainer: {
    alignItems: "center",
    marginTop: 10,
  },
  noSubscriptionText: {
    fontSize: 14,
    color: "#555",
    marginBottom: 10,
  },
  purchaseButton: {
    backgroundColor: "#42ba96",
    paddingVertical: 10,
    borderRadius: 5,
    width: "80%",
    alignItems: "center",
  },
  purchaseButtonText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "bold",
  },
  proPlan: {
    color: "#42ba96",
  },
  classicPlan: {
    color: "#333",
  },
  nonePlan: {
    color: "#ff4d4d",
  },
  activeStatus: {
    color: "#42ba96",
  },
  expiredStatus: {
    color: "#ff4d4d",
  },
  membershipModalContent: {
    alignItems: "center",
  },
  modalSubtitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  plansContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  planOption: {
    width: "45%",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 10,
    alignItems: "center",
  },
  selectedPlan: {
    borderColor: "#42ba96",
    backgroundColor: "#e6f7f2",
  },
  planName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  selectedPlanText: {
    color: "#42ba96",
  },
  planPrice: {
    fontSize: 14,
    color: "#555",
    marginBottom: 5,
  },
  planDescription: {
    fontSize: 12,
    color: "#777",
    textAlign: "center",
  },
  durationContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  durationOption: {
    width: "22%",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 10,
    alignItems: "center",
  },
  selectedDuration: {
    borderColor: "#42ba96",
    backgroundColor: "#e6f7f2",
  },
  durationText: {
    fontSize: 14,
    color: "#333",
  },
  totalContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    width: "100%",
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#42ba96",
  },
  purchaseModalButton: {
    backgroundColor: "#42ba96",
    paddingVertical: 10,
    borderRadius: 5,
    width: "80%",
    alignItems: "center",
    marginBottom: 10,
  },  purchaseModalButtonText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "bold",
  },
  manageSubButton: {
    backgroundColor: "#42ba96",
    paddingVertical: 10,
    borderRadius: 5,
    marginTop: 15,
    alignItems: "center",
  },
  manageSubText: {
    fontSize: 14,
    color: "#fff",
    fontWeight: "bold",
  },
});