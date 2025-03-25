import React from "react";
import { View, Text, Image, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import BottomTabs from "./BottomTabs";

const FieldDetail: React.FC = () => {
  const router = useRouter();
  const { name, price, location, image, description } = useLocalSearchParams();

  const fields = [
    {
      id: 1,
      image: "https://via.placeholder.com/150",
      prev: "Ảnh 1",
    },
    {
      id: 2,
      image: "https://via.placeholder.com/150",
      prev: "Ảnh 2",
    },
    {
      id: 3,
      image: "https://via.placeholder.com/150",
      prev: "Ảnh 3",
    },
  ];

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

        <Text style={styles.preview}>Một số hình ảnh của sân</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
          {fields.map((field) => (
            <TouchableOpacity
              key={field.id}
              onPress={() =>
                router.push({
                  pathname: "/field_detail",
                  params: field,
                 })
              }
            >
              <View style={styles.styleprev}>
                <Image source={{ uri: field.image }} style={styles.previmg} />
                <Text>{field.prev}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </ScrollView>

      {/* Nút đặt sân */}
      <View style={styles.bookingContainer}>
        <TouchableOpacity 
          style={styles.bookingButton} 
          onPress={() => 
            router.push({
              pathname: "/payment", // Đường dẫn tới màn hình chọn giờ & thanh toán
              params: {
                name, 
                price, 
                location, 
                image,
              }
            })
          }
        >
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
  preview: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 8,
  },
  horizontalScroll: {
    marginBottom: 16,
  },
  styleprev: {
    backgroundColor: "white",
    padding: 8,
    borderRadius: 8,
    marginRight: 8,
  },
  previmg: {
    width: 150,
    height: 100,
    borderRadius: 8,
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