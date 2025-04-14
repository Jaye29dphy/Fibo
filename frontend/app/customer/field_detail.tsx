import React, { useState, useEffect } from "react";
import { View, Text, Image, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import BottomTabs from "./BottomTabs";
import { formatCurrency, getStringParam } from "@/constants/apiService";
import { API_ENDPOINTS, FIELD_IMAGE_BASE_URL } from "@/constants/apiConfig";

const FieldDetail: React.FC = () => {
  const router = useRouter();
  const { field_id, name, price, location, image, description } = useLocalSearchParams();
  const [fieldImages, setFieldImages] = useState<any[]>([]);

  useEffect(() => {
    const fetchFieldImages = async () => {
      try {
        const response = await fetch(`${API_ENDPOINTS.GET_FIELDS}/${field_id}/images`);
        const data = await response.json();
        setFieldImages(data);
      } catch (error) {
        console.error("Error fetching field images:", error);
      }
    };

    if (field_id) fetchFieldImages();
  }, [field_id]);

  const priceString = getStringParam(price);
  const displayPrice = priceString ? formatCurrency(priceString) : "Giá không khả dụng";
  const imageString = getStringParam(image);

  const mainImageUrl = imageString
    ? `${FIELD_IMAGE_BASE_URL}/${imageString}?t=${Date.now()}` // Thêm cache-busting
    : "https://via.placeholder.com/150";
  console.log(`Main image URL for field ${field_id}:`, mainImageUrl);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.title}>Chi tiết sân bóng</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: mainImageUrl }}
            style={styles.image}
            onError={(error) =>
              console.log(`Main image load error for field ${field_id}:`, error.nativeEvent.error)
            }
            onLoad={() => console.log(`Main image loaded for field ${field_id}:`, mainImageUrl)}
          />
        </View>

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

        <Text style={styles.fieldName}>{name || "Không có tên"}</Text>
        <Text style={styles.fieldPrice}>{displayPrice}</Text>

        <View style={styles.location}>
          <Ionicons name="location-outline" size={16} color="black" />
          <Text style={styles.locationText}>{location || "Không có địa chỉ"}</Text>
        </View>

        <Text style={styles.descriptionTitle}>Mô tả</Text>
        <Text style={styles.description}>{description || "Không có mô tả"}</Text>

        <Text style={styles.preview}>Một số hình ảnh của sân</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
          {fieldImages.map((fieldImage, index) => {
            const subImageUrl = fieldImage.image_name
              ? `${FIELD_IMAGE_BASE_URL}/${fieldImage.image_name}?t=${Date.now()}` // Thêm cache-busting
              : "https://via.placeholder.com/150";
            console.log(`Sub image URL ${index + 1} for field ${field_id}:`, subImageUrl);

            return (
              <TouchableOpacity
                key={index}
                onPress={() =>
                  router.push({
                    pathname: "/customer/pickfield",
                    params: { image: fieldImage.image_name },
                  })
                }
              >
                <View style={styles.styleprev}>
                  <View style={styles.subImageContainer}>
                  <Image
                    source={{ uri: subImageUrl }}
                    style={styles.image}
                    onError={(error) => {
                      console.log(`Main image load error for field ${field_id}:`, error.nativeEvent);
                      console.log(`Failed URL:`, mainImageUrl);
                    }}
                    onLoad={() => console.log(`Main image loaded for field ${field_id}:`, mainImageUrl)}
                  />
                  </View>
                  <Text>{`Ảnh ${index + 1}`}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </ScrollView>

      <View style={styles.bookingContainer}>
        <TouchableOpacity
          style={styles.bookingButton}
          onPress={() =>
            router.push({
              pathname: "/customer/payment",
              params: {
                field_id,
                name,
                price,
                location,
                image: imageString,
              },
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
  imageContainer: {
    width: "100%",
    height: 180,
    borderRadius: 8,
    backgroundColor: "#E5E7EB",
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
  subImageContainer: {
    width: 150,
    height: 100,
    borderRadius: 8,
    backgroundColor: "#E5E7EB",
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