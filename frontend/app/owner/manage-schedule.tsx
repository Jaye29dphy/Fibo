import React from "react";
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import OwnerBottomTabs from "./BottomTabs"; 

export default function ManageSchedule() {
  const router = useRouter();

  const fields = [
    { id: 1, name: "Sân bóng đá Hà Đông 1", type: "Đấu 6 độ Hà Đông", rating: 4.5, price: "400.000VNĐ/h", image: "https://via.placeholder.com/150" },
    { id: 2, name: "Sân bóng đá Hà Đông 2", type: "Đấu 6 độ Hà Đông", rating: 4.0, price: "400.000VNĐ/h", image: "https://via.placeholder.com/150" },
    { id: 3, name: "Sân bóng rổ Văn Quán", type: "Đấu 6 độ Hà Đông", rating: 5.0, price: "400.000VNĐ/h", image: "https://via.placeholder.com/150" },
  ];

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
      <ScrollView style={styles.scrollView}>
        {fields.map((field) => (
          <TouchableOpacity
            key={field.id}
            style={styles.fieldCard}
            onPress={() => router.push("/owner/schedule-details")}
          >
            <Image source={{ uri: field.image }} style={styles.fieldImage} />
            <View style={styles.fieldInfo}>
              <Text style={styles.fieldName}>{field.name}</Text>
              <Text style={styles.fieldType}>{field.type}</Text>
              <View style={styles.ratingContainer}>
                <Ionicons name="star" size={16} color="#FFD700" />
                <Text style={styles.ratingText}>{field.rating}</Text>
              </View>
              <Text style={styles.price}>{field.price}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

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
  },
  price: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#3F51B5",
    marginTop: 5,
  },
});