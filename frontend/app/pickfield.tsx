import React from "react";
import { View, Text, TextInput, Image, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { FontAwesome, Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import BottomTabs from "./BottomTabs";

const PickField: React.FC = () => {
  const router = useRouter();

  const fields = [
    {
      id: 1,
      name: "Sân bóng đá Hà Đông 1",
      image: "https://via.placeholder.com/150",
      location: "Đâu đó ở Hà Đông",
      price: "400.000VND/h",
      description: "Sân Hà Đông 1 là 1 sân ở Hà Đông, nơi đây các cầu thủ được đá trên mặt cỏ nhân tạo...",
    },
    {
      id: 2,
      name: "Sân bóng đá Hà Đông 2",
      image: "https://via.placeholder.com/150",
      location: "Hà Đông, Hà Nội",
      price: "450.000VND/h",
      description: "Sân Hà Đông 2 có không gian rộng rãi, mặt cỏ chất lượng cao, thích hợp cho các trận đấu lớn...",
    },
  ];

  const famousFields = [
    {
      id: 3,
      name: "Sân Spotify Camp Nou",
      image: "https://via.placeholder.com/150",
      location: "Barcelona",
      price: "$100000/day",
      description: "Sân nhà của FC Barcelona, một trong những sân vận động nổi tiếng nhất thế giới.",
    },
  ];

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
        <Text style={styles.sectionTitle}>Sân bóng đá gần chỗ bạn</Text>
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
              <View style={styles.fieldCard}>
                <Image source={{ uri: field.image }} style={styles.fieldImage} />
                <Text style={styles.fieldName}>{field.name}</Text>
                <Text style={styles.fieldLocation}>{field.location}</Text>
                <Text style={styles.fieldPrice}>{field.price}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Sân nổi tiếng */}
        <Text style={styles.sectionTitle}>Sân nổi tiếng</Text>
        {famousFields.map((field) => (
          <TouchableOpacity
            key={field.id}
            onPress={() =>
              router.push({
                pathname: "/field_detail",
                params: field,
              })
            }
          >
            <View style={styles.famousFieldCard}>
              <Image source={{ uri: field.image }} style={styles.famousFieldImage} />
              <Text style={styles.fieldName}>{field.name}</Text>
              <Text style={styles.fieldLocation}>{field.location}</Text>
              <Text style={styles.fieldPrice}>{field.price}</Text>
            </View>
          </TouchableOpacity>
        ))}
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
  horizontalScroll: {
    marginBottom: 16,
  },
  fieldCard: {
    backgroundColor: "white",
    padding: 8,
    borderRadius: 8,
    marginRight: 8,
  },
  fieldImage: {
    width: 150,
    height: 100,
    borderRadius: 8,
  },
  fieldName: {
    fontWeight: "bold",
  },
  fieldLocation: {
    color: "#6B7280",
  },
  fieldPrice: {
    color: "#16A34A",
    fontWeight: "bold",
  },
  famousFieldCard: {
    backgroundColor: "white",
    padding: 8,
    borderRadius: 8,
    marginBottom: 16,
  },
  famousFieldImage: {
    width: "100%",
    height: 120,
    borderRadius: 8,
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
