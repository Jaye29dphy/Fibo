import React from "react";
import { View, Text, Image, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import BottomTabs from "./BottomTabs";

const FieldDetail: React.FC = () => {
  const router = useRouter();
  const { name, price, location, image, description } = useLocalSearchParams();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.title}>Chi tiết sân bóng</Text>
      </View>

      {/* Nội dung chính */}
      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Ảnh sân */}
        <Image source={{ uri: image as string }} style={styles.image} />

        {/* Tiện ích */}
        <View style={styles.facilities}>
          <View style={styles.facility}>
            <Ionicons name="wifi-outline" size={16} color="black" />
            <Text style={styles.facilityText}>Free Wifi</Text>
          </View>
          <View style={styles.facility}>
            <Ionicons name="restaurant-outline" size={16} color="black" />
            <Text style={styles.facilityText}>Free Breakfast</Text>
          </View>
        </View>

        {/* Thông tin sân */}
        <Text style={styles.fieldName}>{name}</Text>
        <Text style={styles.fieldPrice}>{price}</Text>

        {/* Địa chỉ */}
        <View style={styles.location}>
          <Ionicons name="location-outline" size={16} color="black" />
          <Text style={styles.locationText}>{location}</Text>
        </View>

        {/* Mô tả */}
        <Text style={styles.descriptionTitle}>Mô tả</Text>
        <Text style={styles.description}>{description}</Text>
      </ScrollView>

      {/* Nút đặt sân */}
      <View style={styles.bookingContainer}>
        <TouchableOpacity style={styles.bookingButton}>
          <Text style={styles.bookingText}>Đặt ngay</Text>
        </TouchableOpacity>
      </View>

      <BottomTabs />
    </View>
  );
};

export default FieldDetail;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  image: {
    width: "100%",
    height: 180,
    borderRadius: 8,
  },
  facilities: {
    flexDirection: "row",
    marginTop: 8,
  },
  facility: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 12,
  },
  facilityText: {
    marginLeft: 4,
  },
  fieldName: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 8,
  },
  fieldPrice: {
    color: "#16A34A",
    fontWeight: "bold",
    fontSize: 18,
  },
  location: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  locationText: {
    marginLeft: 4,
  },
  descriptionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 8,
  },
  description: {
    color: "#6B7280",
  },
  bookingContainer: {
    position: "absolute",
    bottom: 100, 
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  bookingButton: {
    backgroundColor: "#16A34A",
    padding: 14,
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
  },
  bookingText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});
