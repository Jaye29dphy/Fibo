import React from "react";
import { View, Text, TextInput, Image, TouchableOpacity, ScrollView } from "react-native";
import { FontAwesome, Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
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
    <View style={{ flex: 1, backgroundColor: "#F3F4F6", padding: 16 }}>
      {/* Header */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <View style={{ backgroundColor: "#16A34A", paddingHorizontal: 12, paddingVertical: 4, borderRadius: 50 }}>
            <Text style={{ color: "white", fontWeight: "bold" }}>FiBO</Text>
          </View>
        </View>
        <Feather name="settings" size={24} color="#374151" />
      </View>

      {/* Search Bar */}
      <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "white", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 16 }}>
        <FontAwesome name="search" size={20} color="#9CA3AF" />
        <TextInput placeholder="Nhập tên sân..." style={{ marginLeft: 8, flex: 1 }} />
      </View>

      <ScrollView>
        {/* Sân gần bạn */}
        <Text style={{ fontSize: 16, fontWeight: "bold", marginBottom: 8 }}>Sân bóng đá gần chỗ bạn</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
          {fields.map((field) => (
            <TouchableOpacity
              key={field.id}
              onPress={() =>
                router.push({
                  pathname: "/field_detail",
                  params: {
                    name: field.name,
                    image: field.image,
                    location: field.location,
                    price: field.price,
                    description: field.description,
                  },
                })
              }
            >
              <View style={{ backgroundColor: "white", padding: 8, borderRadius: 8, marginRight: 8 }}>
                <Image source={{ uri: field.image }} style={{ width: 150, height: 100, borderRadius: 8 }} />
                <Text style={{ fontWeight: "bold" }}>{field.name}</Text>
                <Text style={{ color: "#6B7280" }}>{field.location}</Text>
                <Text style={{ color: "#16A34A", fontWeight: "bold" }}>{field.price}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Sân nổi tiếng */}
        <Text style={{ fontSize: 16, fontWeight: "bold", marginBottom: 8 }}>Sân nổi tiếng</Text>
        {famousFields.map((field) => (
          <TouchableOpacity
            key={field.id}
            onPress={() =>
              router.push({
                pathname: "/field_detail",
                params: {
                  name: field.name,
                  image: field.image,
                  location: field.location,
                  price: field.price,
                  description: field.description,
                },
              })
            }
          >
            <View style={{ backgroundColor: "white", padding: 8, borderRadius: 8, marginBottom: 16 }}>
              <Image source={{ uri: field.image }} style={{ width: "100%", height: 120, borderRadius: 8 }} />
              <Text style={{ fontWeight: "bold" }}>{field.name}</Text>
              <Text style={{ color: "#6B7280" }}>{field.location}</Text>
              <Text style={{ color: "#16A34A", fontWeight: "bold" }}>{field.price}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Thanh điều hướng */}
      <BottomTabs />
    </View>
  );
};

export default PickField;
