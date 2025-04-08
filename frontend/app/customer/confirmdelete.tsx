import { useState } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    TextInput,
    StyleSheet,
    Modal,
    Alert,
    ActivityIndicator
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { deactivateAccountWithPassword } from "@/constants/apiService"; // ✅ dùng API mới

export default function ConfirmDeleteScreen() {
    const [password, setPassword] = useState("");
    const [modalVisible, setModalVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleConfirmDelete = async () => {
        setError("");
        setLoading(true);
    
        try {
            const response = await deactivateAccountWithPassword(password);
            console.log("API response:", response);
    
            if (response?.message === "Tài khoản đã bị vô hiệu hóa!") {
                setModalVisible(false); // 👈 đóng modal trước
                Alert.alert("Thông báo", "Tài khoản đã bị vô hiệu hóa.");
                router.push("/customer");
                return;
            }
            
    
            if (!response.success) {
                setError("Sai mật khẩu hoặc không thể xoá tài khoản.");
                return;
            }
    
            await AsyncStorage.removeItem("token");
            setModalVisible(false);
            Alert.alert("Thông báo", "Tài khoản của bạn đã bị xoá.");
            router.push("/customer");
        } catch (err) {
            console.error(err);
            Alert.alert("Lỗi", "Lỗi kết nối đến máy chủ.");
        } finally {
            setLoading(false);
        }
    };
    

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="black" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Xoá tài khoản</Text>
            </View>

            {/* Warning */}
            <View style={styles.warningBox}>
                <Ionicons name="warning" size={40} color="#cb0909" />
                <Text style={styles.warningText}>Cảnh báo</Text>
            </View>

            {/* Description */}
            <View style={styles.description}>
                <Text style={styles.descriptionText}>
                    • Một khi bạn nhấn nút xoá tài khoản và nhập đúng mật khẩu, tài khoản của bạn sẽ bị xoá vĩnh viễn.
                </Text>
                <Text style={styles.descriptionText}>
                    • Bạn không thể khôi phục tài khoản, chỉ có thể tạo tài khoản mới.
                </Text>
                <Text style={styles.descriptionText}>
                    • Một số thông tin vẫn hiển thị với chủ sân, ngay cả khi bạn xoá tài khoản.
                </Text>
                <Text style={styles.descriptionText}>
                    • Chúng tôi vẫn sẽ lưu dữ liệu của bạn trong Cơ sở dữ liệu để phục vụ mục đích pháp lý nếu cần.
                </Text>
            </View>

            {/* Delete Button */}
            <TouchableOpacity style={styles.deleteButton} onPress={() => setModalVisible(true)}>
                <Text style={styles.deleteButtonText}>Xoá tài khoản</Text>
            </TouchableOpacity>

            {/* Modal */}
            <Modal visible={modalVisible} transparent animationType="fade">
                <View style={styles.overlay}>
                    <View style={styles.modalBox}>
                        <Text style={styles.modalTitle}>Nhập mật khẩu để xác nhận</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Nhập mật khẩu"
                            secureTextEntry
                            value={password}
                            onChangeText={setPassword}
                        />
                        {error ? <Text style={styles.errorText}>{error}</Text> : null}
                        <View style={styles.modalButtons}>
                            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.cancelButton}>
                                <Text style={styles.cancelButtonText}>Huỷ</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleConfirmDelete} style={styles.confirmButton} disabled={loading}>
                                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.confirmButtonText}>Xác nhận</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#fff", paddingHorizontal: 20, paddingTop: 40 },
    header: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
    backButton: { marginRight: 10 },
    headerTitle: { fontSize: 20, fontWeight: "bold" as const },
    warningBox: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
    warningText: { fontSize: 24, fontWeight: "bold" as const, marginLeft: 10, color: "#cb0909" },
    description: { marginBottom: 30 },
    descriptionText: { fontSize: 16, marginBottom: 10 },
    deleteButton: { backgroundColor: "#cb0909", padding: 15, borderRadius: 8, alignItems: "center" },
    deleteButtonText: { color: "#fff", fontSize: 18, fontWeight: "bold" as const },
    overlay: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.5)" },
    modalBox: { backgroundColor: "#fff", padding: 20, borderRadius: 8, width: "80%", alignItems: "center" },
    modalTitle: { fontSize: 18, fontWeight: "bold" as const, marginBottom: 10 },
    input: { width: "100%", padding: 10, borderWidth: 1, borderRadius: 5, marginBottom: 10 },
    errorText: { color: "red", marginBottom: 10 },
    modalButtons: { flexDirection: "row", justifyContent: "space-between", width: "100%" },
    cancelButton: { padding: 10, borderRadius: 5, backgroundColor: "#ccc", flex: 1, marginRight: 5, alignItems: "center" },
    cancelButtonText: { fontSize: 16 },
    confirmButton: { padding: 10, borderRadius: 5, backgroundColor: "#cb0909", flex: 1, marginLeft: 5, alignItems: "center" },
    confirmButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" as const }
});
