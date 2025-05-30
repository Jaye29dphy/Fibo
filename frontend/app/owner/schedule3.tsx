// f:\school\Ki 6\Cross-platform App Development\Fibo\frontend\app\owner\schedule3.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  SafeAreaView,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { AntDesign, MaterialIcons, Ionicons } from "@expo/vector-icons";
import { useOwnerSchedule, OwnerBooking } from "@/hooks/useOwnerSchedule";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_ENDPOINTS } from "@/constants/apiConfig";

export default function BookingDetail() {
  const router = useRouter();
  const { bookingId } = useLocalSearchParams(); const { bookings, loading, error, refreshBookings, updateBookingStatus } = useOwnerSchedule();
  const [booking, setBooking] = useState<OwnerBooking | null>(null);
  interface BookingService {
    id: number;
    name: string;
    quantity: number;
    total_price: number;
  }

  const [bookingServices, setBookingServices] = useState<BookingService[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);
  // Tìm booking dựa vào bookingId
  useEffect(() => {
    if (bookings && bookings.length > 0 && bookingId) {
      const foundBooking = bookings.find(
        (b) => b.booking_id === parseInt(bookingId as string)
      );
      setBooking(foundBooking || null);

      // Fetch booking services
      if (foundBooking) {
        fetchBookingServices(foundBooking.booking_id.toString());
      }
    }
  }, [bookings, bookingId]);
  // Lấy thông tin dịch vụ đi kèm với booking
  const fetchBookingServices = async (id: string) => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        Alert.alert("Lỗi", "Không tìm thấy token xác thực. Vui lòng đăng nhập lại.");
        return;
      }

      const response = await fetch(`${API_ENDPOINTS.GET_FIELD_DETAIL}/${id}/services`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        console.error(`Error fetching booking services: ${response.status}`);
        return;
      }

      const data = await response.json();
      setBookingServices(data);
    } catch (error) {
      console.error("Error fetching booking services:", error);
    }
  };

  // Format thời gian từ YYYY-MM-DD HH:MM:SS -> HH:MM
  const formatTime = (timeString: string) => {
    if (!timeString) return "";
    const timePart = timeString.split(" ")[1];
    if (!timePart) return "";
    return timePart.substring(0, 5);
  };

  // Format date from YYYY-MM-DD -> DD/MM/YYYY
  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const parts = dateString.split(" ")[0].split("-");
    if (parts.length !== 3) return dateString;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  };
  // Màu sắc và tên trạng thái
  const getStatusInfo = (status: string) => {
    const statusInfo: Record<string, { color: string; text: string }> = {
      confirmed: { color: "#4CAF50", text: "Đã xác nhận" },
      pending: { color: "#FFD700", text: "Chờ xác nhận" },
      cancelled: { color: "#FF6347", text: "Đã hủy" },
      completed: { color: "#808080", text: "Đã hoàn thành" },
    };
    return statusInfo[status] || { color: "#0000FF", text: status };
  };
  // Cập nhật trạng thái
  const handleStatusUpdate = async (newStatus: string) => {
    if (!booking) return;

    try {
      setIsUpdating(true);

      await updateBookingStatus(booking.booking_code, newStatus);

      Alert.alert("Thành công", `Đã cập nhật trạng thái đặt sân thành ${getStatusInfo(newStatus).text}`);
    } catch (error) {
      console.error("Error updating booking status:", error);
      Alert.alert("Lỗi", "Đã xảy ra lỗi khi cập nhật trạng thái đặt sân");
    } finally {
      setIsUpdating(false);
    }
  };
  // Xác nhận cập nhật trạng thái
  const confirmStatusUpdate = (newStatus: string) => {
    Alert.alert(
      "Xác nhận",
      `Bạn có chắc chắn muốn ${newStatus === "confirmed"
        ? "xác nhận"
        : newStatus === "cancelled"
          ? "hủy"
          : newStatus === "completed"
            ? "đánh dấu hoàn thành"
            : "cập nhật trạng thái"
      } đơn đặt sân này?`,
      [
        { text: "Hủy", style: "cancel" },
        { text: "Đồng ý", onPress: () => handleStatusUpdate(newStatus) },
      ]
    );
  };

  if (loading || !booking) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <AntDesign name="arrowleft" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.title}>Chi tiết đặt sân</Text>
          </View>

          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={styles.loadingText}>Đang tải thông tin...</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <AntDesign name="arrowleft" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.title}>Chi tiết đặt sân</Text>
          </View>

          <View style={styles.errorContainer}>
            <MaterialIcons name="error-outline" size={48} color="#FF6347" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={refreshBookings}
            >
              <Text style={styles.refreshButtonText}>Thử lại</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const statusInfo = getStatusInfo(booking.status);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <AntDesign name="arrowleft" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.title}>Chi tiết đặt sân</Text>
        </View>

        <ScrollView style={styles.content}>
          {/* Status Badge */}
          <View style={[styles.statusBadge, { backgroundColor: statusInfo.color }]}>
            <Text style={styles.statusText}>{statusInfo.text}</Text>
          </View>

          {/* Booking Info Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Thông tin đặt sân</Text>

            <View style={styles.infoRow}>
              <MaterialIcons name="confirmation-number" size={20} color="#3B82F6" />
              <Text style={styles.infoLabel}>Mã đặt sân:</Text>
              <Text style={styles.infoValue}>{booking.booking_code}</Text>
            </View>

            <View style={styles.infoRow}>
              <MaterialIcons name="sports-soccer" size={20} color="#3B82F6" />
              <Text style={styles.infoLabel}>Tên sân:</Text>
              <Text style={styles.infoValue}>{booking.field_name}</Text>
            </View>

            <View style={styles.infoRow}>
              <MaterialIcons name="date-range" size={20} color="#3B82F6" />
              <Text style={styles.infoLabel}>Ngày:</Text>
              <Text style={styles.infoValue}>
                {formatDate(booking.start_time)}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <MaterialIcons name="schedule" size={20} color="#3B82F6" />
              <Text style={styles.infoLabel}>Thời gian:</Text>
              <Text style={styles.infoValue}>
                {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
              </Text>
            </View>            <View style={styles.infoRow}>
              <MaterialIcons name="monetization-on" size={20} color="#3B82F6" />
              <Text style={styles.infoLabel}>Tổng tiền:</Text>
              <Text style={styles.infoValue}>
                {booking?.total_cost
                  ? (typeof booking.total_cost === 'number'
                    ? booking.total_cost.toLocaleString("vi-VN")
                    : parseFloat(booking.total_cost.toString()).toLocaleString("vi-VN"))
                  : 0}đ
              </Text>
            </View>

            <View style={styles.infoRow}>
              <MaterialIcons name="payment" size={20} color="#3B82F6" />
              <Text style={styles.infoLabel}>Thanh toán:</Text>
              <Text style={styles.infoValue}>
                {booking.payment_method === "vnpay"
                  ? "VNPAY"
                  : booking.payment_method || "Chưa thanh toán"}
              </Text>
            </View>
          </View>

          {/* Customer Info Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Thông tin khách hàng</Text>

            <View style={styles.infoRow}>
              <MaterialIcons name="person" size={20} color="#3B82F6" />
              <Text style={styles.infoLabel}>Tên khách:</Text>
              <Text style={styles.infoValue}>
                {booking.customer_name || `Khách hàng #${booking.user_id}`}
              </Text>
            </View>
          </View>

          {/* Services Info Card */}
          {bookingServices && bookingServices.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Dịch vụ thêm</Text>

              {bookingServices.map((service, index) => (
                <View key={index} style={styles.serviceItem}>
                  <View style={styles.serviceInfo}>
                    <Text style={styles.serviceName}>{service.name}</Text>
                    <Text style={styles.serviceQuantity}>x{service.quantity}</Text>
                  </View>                  <Text style={styles.servicePrice}>
                    {service.total_price.toLocaleString("vi-VN")}đ
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionContainer}>
            {booking.status === "pending" && (
              <TouchableOpacity
                style={[styles.actionButton, styles.confirmButton]}
                onPress={() => confirmStatusUpdate("confirmed")}
                disabled={isUpdating}
              >
                <MaterialIcons name="check-circle" size={20} color="white" />
                <Text style={styles.actionButtonText}>Xác nhận đặt sân</Text>
              </TouchableOpacity>
            )}

            {(booking.status === "pending" || booking.status === "confirmed") && (
              <TouchableOpacity
                style={[styles.actionButton, styles.cancelButton]}
                onPress={() => confirmStatusUpdate("cancelled")}
                disabled={isUpdating}
              >
                <MaterialIcons name="cancel" size={20} color="white" />
                <Text style={styles.actionButtonText}>Hủy đặt sân</Text>
              </TouchableOpacity>
            )}

            {booking.status === "confirmed" && (
              <TouchableOpacity
                style={[styles.actionButton, styles.completeButton]}
                onPress={() => confirmStatusUpdate("completed")}
                disabled={isUpdating}
              >
                <MaterialIcons name="check-box" size={20} color="white" />
                <Text style={styles.actionButtonText}>Đánh dấu hoàn thành</Text>
              </TouchableOpacity>
            )}

            {isUpdating && (
              <View style={styles.updatingOverlay}>
                <ActivityIndicator size="large" color="#3B82F6" />
                <Text style={styles.updatingText}>Đang cập nhật...</Text>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#3B82F6",
  },
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "#3B82F6",
    paddingTop: 45,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
    marginLeft: 16,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  statusBadge: {
    alignSelf: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 20,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "600",
    color: "white",
  },
  card: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
    paddingBottom: 8,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: "#666",
    marginLeft: 10,
    width: 90,
  },
  infoValue: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
    flex: 1,
  },
  serviceItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  serviceInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  serviceName: {
    fontSize: 14,
    flex: 1,
    color: "#333",
  },
  serviceQuantity: {
    fontSize: 14,
    color: "#666",
    marginLeft: 8,
  },
  servicePrice: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  actionContainer: {
    marginBottom: 32,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    paddingVertical: 12,
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  confirmButton: {
    backgroundColor: "#4CAF50",
  },
  cancelButton: {
    backgroundColor: "#FF6347",
  },
  completeButton: {
    backgroundColor: "#3B82F6",
  },
  actionButtonText: {
    color: "white",
    fontWeight: "600",
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
    marginTop: 8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginTop: 16,
    marginBottom: 16,
  },
  refreshButton: {
    backgroundColor: "#3B82F6",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
  },
  refreshButtonText: {
    color: "white",
    fontWeight: "500",
  },
  updatingOverlay: {
    position: "absolute",
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
  },
  updatingText: {
    marginTop: 10,
    color: "#3B82F6",
    fontSize: 14,
    fontWeight: "500",
  },
});