import React, { useState, useEffect } from "react";
import { View, Text, TextInput, Image, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import BottomTabs from "./BottomTabs";
import { getFields } from "../hooks/useGetFields"; 


const PickField: React.FC = () => {
  const router = useRouter();
  const [fields, setFields] = useState<any[]>([]); // Khởi tạo state cho dữ liệu sân bóng

  useEffect(() => {
    const fetchFields = async () => {
      try {
        const fieldsData = await getFields();
        setFields(fieldsData); // Cập nhật dữ liệu vào state
      } catch (error) {
        console.error("Error fetching fields:", error);
      }
    };
    fetchFields();
  }, []); // Chạy khi component được render

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>FiBO</Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchBar}>
        <FontAwesome name="search" size={20} color="#9CA3AF" />
        <TextInput placeholder="Nhập tên sân..." style={styles.searchInput} />
      </View>

      {/* Nội dung chính */}
      <ScrollView style={styles.content}>
        {/* Sân gần bạn */}
        <Text style={styles.sectionTitle}>Tất cả các sân</Text>
        {/* Sử dụng ScrollView bình thường để hiển thị các sân theo chiều dọc */}
        <View style={styles.fieldsList}>
          {fields.map((field) => (
            <TouchableOpacity
              key={field.field_id} // Sử dụng field_id làm key
              onPress={() =>
                router.push({
                  pathname: "/field_detail",
                  params: field,
                })
              }
            >
              <View style={styles.fieldCard}>
                {/* Hiển thị hình ảnh sân */}
                <Image source={{ uri: field.image || 'default_image_url' }} style={styles.fieldImage} />
                <Text style={styles.fieldName}>{field.name}</Text>
                <Text style={styles.fieldLocation}>{`Loại sân: ${field.sport_type}`}</Text>
                <Text style={styles.fieldPrice}>{`Giá: ${field.price_per_hour} VND/giờ`}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <View style={styles.bottomTabs}>
        <BottomTabs />
      </View>
    </View>
  );
};

export default PickField;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  logoContainer: {
    backgroundColor: "#16A34A",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 50,
  },
  logoText: {
    color: "white",
    fontWeight: "bold",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
  },
  searchInput: {
    marginLeft: 8,
    flex: 1,
  },
  content: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  fieldsList: {
    // Không cần ScrollView ngang, chỉ cần View cho danh sách các sân
    paddingBottom: 16,
  },
  fieldCard: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 8,
    marginBottom: 16, // Đảm bảo có khoảng cách giữa các sân
  },
  fieldImage: {
    width: "100%", // Đảm bảo hình ảnh chiếm đầy chiều rộng
    height: 150,
    borderRadius: 8,
  },
  fieldName: {
    fontWeight: "bold",
    marginTop: 8,
  },
  fieldLocation: {
    color: "#6B7280",
  },
  fieldPrice: {
    color: "#16A34A",
    fontWeight: "bold",
    marginTop: 4,
  },
  bottomTabs: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#ddd",
  },
});