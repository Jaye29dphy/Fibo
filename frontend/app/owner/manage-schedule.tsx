import React from "react";
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import OwnerBottomTabs from "./BottomTabs";
import useOwnerFields from "../../hooks/useOwnerFields";

export default function ManageSchedule() {
  const router = useRouter();
  const { fields, loading, error, refreshFields } = useOwnerFields();

  // Format giá tiền
  const formatPrice = (price: number): string => {
    return `${price.toLocaleString('vi-VN')}đ/h`;
  };

  // Chuyển đổi loại sân sang tiếng Việt
  const getFieldTypeText = (sportType: string): string => {
    const typeMapping: Record<string, string> = {
      'football': 'Sân bóng đá',
      'basketball': 'Sân bóng rổ',
      'badminton': 'Sân cầu lông',
      'tennis': 'Sân tennis',
      'pickleball': 'Sân pickleball'
    };

    return typeMapping[sportType] || sportType;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>FIBO</Text>
        <Ionicons name="calendar-outline" size={24} color="#000" />
      </View>

      {/* Subtitle */}
      <Text style={styles.subtitle}>Chọn sân bạn muốn quản lý lịch đặt</Text>

      {/* Field List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3F51B5" />
          <Text style={styles.loadingText}>Đang tải danh sách sân...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={50} color="#ff6b6b" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={refreshFields}>
            <Text style={styles.retryButtonText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      ) : fields.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="information-circle-outline" size={50} color="#3F51B5" />
          <Text style={styles.emptyText}>Bạn chưa có sân nào.</Text>
          <TouchableOpacity
            style={styles.registerButton}
            onPress={() => router.push("/owner/register-field")}
          >
            <Text style={styles.registerButtonText}>Đăng ký sân mới</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={refreshFields} />
          }
        >
          {fields.map((field) => (
            <TouchableOpacity
              key={field.field_id}
              style={styles.fieldCard}
              onPress={() => router.push({
                pathname: "/owner/schedule-details",
                params: { fieldId: field.field_id }
              })}
            >
              <Image source={{ uri: field.image_url }} style={styles.fieldImage} />
              <View style={styles.fieldInfo}>
                <Text style={styles.fieldName}>{field.name}</Text>
                <Text style={styles.fieldType}>{getFieldTypeText(field.sport_type)}</Text>
                <View style={styles.ratingContainer}>
                  <Ionicons name="star" size={16} color="#FFD700" />
                  <Text style={styles.ratingText}>{field.rating}</Text>
                  <View style={styles.statusBadge}>
                    <Text style={[
                      styles.statusText,
                      field.status === 'available' ? styles.availableStatus : styles.unavailableStatus
                    ]}>
                      {field.status === 'available' ? 'Trống' : 'Đã đặt'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.price}>{formatPrice(field.price_per_hour)}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Bottom Tabs */}
      <OwnerBottomTabs />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingTop: 40,
    paddingBottom: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#3F51B5",
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#3F51B5",
    paddingHorizontal: 15,
    marginBottom: 10,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#3F51B5',
    borderRadius: 5,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  registerButton: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#3F51B5',
    borderRadius: 5,
  },
  registerButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  fieldCard: {
    flexDirection: "row",
    marginHorizontal: 15,
    marginVertical: 5,
    borderRadius: 10,
    backgroundColor: "#fff",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  fieldImage: {
    width: 100,
    height: 100,
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
  },
  fieldInfo: {
    flex: 1,
    padding: 10,
  },
  fieldName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000",
  },
  fieldType: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
  },
  ratingText: {
    marginLeft: 5,
    fontSize: 14,
    color: "#000",
    marginRight: 10,
  },
  price: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#3F51B5",
    marginTop: 5,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "bold",
  },
  availableStatus: {
    color: "#4CAF50",
  },
  unavailableStatus: {
    color: "#F44336",
  },
});