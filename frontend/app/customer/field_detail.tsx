import React, { useState, useEffect } from "react";
import { View, Text, Image, TouchableOpacity, ScrollView, StyleSheet, Modal, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import BottomTabs from "./BottomTabs";
import { formatCurrency, getStringParam } from "@/constants/apiService";
import { API_ENDPOINTS, FIELD_IMAGE_BASE_URL } from "@/constants/apiConfig";

const { width, height } = Dimensions.get("window"); // Lấy kích thước màn hình

const FieldDetail: React.FC = () => {
  const router = useRouter();
  const { field_id, name, price, location, image, description } = useLocalSearchParams();
  const [fieldImages, setFieldImages] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false); // Trạng thái hiển thị modal
  const [selectedImage, setSelectedImage] = useState<string | null>(null); // Ảnh được chọn để phóng to

  useEffect(() => {
    const fetchFieldImages = async () => {
      try {
        const response = await fetch(`${API_ENDPOINTS.GET_FIELDS}/${field_id}/images`);
        const data = await response.json();
        console.log("Field images data:", data);
        if (Array.isArray(data)) {
          setFieldImages(data);
        } else {
          console.error("Field images data is not an array:", data);
          setFieldImages([]);
        }
      } catch (error) {
        console.error("Error fetching field images:", error);
        setFieldImages([]);
      }
    };

    if (field_id) fetchFieldImages();
  }, [field_id]);

  const priceString = getStringParam(price);
  const displayPrice = priceString ? formatCurrency(priceString) : "Giá không khả dụng";
  const imageString = getStringParam(image);

  const mainImageUrl = imageString
    ? `${FIELD_IMAGE_BASE_URL}/${imageString}?t=${Date.now()}`
    : "https://via.placeholder.com/150";
  console.log(`Main image URL for field ${field_id}:`, mainImageUrl);

  // Mở modal và hiển thị ảnh phóng to
  const openImageModal = (imageName: string) => {
    const imageUrl = imageName
      ? `${FIELD_IMAGE_BASE_URL}/${imageName}?t=${Date.now()}`
      : "https://via.placeholder.com/150";
    setSelectedImage(imageUrl);
    setModalVisible(true);
  };

  // Đóng modal
  const closeImageModal = () => {
    setModalVisible(false);
    setSelectedImage(null);
  };

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
            onError={(error) => {
              console.log(`Main image load error for field ${field_id}:`, error.nativeEvent);
              console.log(`Failed URL:`, mainImageUrl);
            }}
            onLoad={() => console.log(`Main image loaded for field ${field_id}:`, mainImageUrl)}
            onLoadEnd={() => console.log(`Main image load ended for field ${field_id}`)}
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
          {fieldImages
            .filter((fieldImage) => fieldImage.image_type === "sub")
            .map((fieldImage, index) => {
              const subImageUrl = fieldImage.image_name
                ? `${FIELD_IMAGE_BASE_URL}/${fieldImage.image_name}?t=${Date.now()}`
                : "https://via.placeholder.com/150";
              console.log(`Sub image URL ${index + 1} for field ${field_id}:`, subImageUrl);

              return (
                <TouchableOpacity
                  key={index}
                  onPress={() => openImageModal(fieldImage.image_name)} // Mở modal khi nhấn vào ảnh
                >
                  <View style={styles.styleprev}>
                    <View style={styles.subImageContainer}>
                      <Image
                        source={{ uri: subImageUrl }}
                        style={styles.previmg}
                        onError={(error) => {
                          console.log(`Sub image load error ${index + 1} for field ${field_id}:`, error.nativeEvent);
                          console.log(`Failed URL:`, subImageUrl);
                        }}
                        onLoad={() => console.log(`Sub image loaded ${index + 1} for field ${field_id}:`, subImageUrl)}
                        onLoadEnd={() => console.log(`Sub image load ended ${index + 1} for field ${field_id}`)}
                      />
                    </View>
                    <Text>{`Ảnh ${index + 1}`}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
        </ScrollView>
      </ScrollView>

      {/* Modal để hiển thị ảnh phóng to */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeImageModal} // Đóng modal khi nhấn nút back trên Android
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={closeImageModal} // Đóng modal khi nhấn ra ngoài ảnh
        >
          <View style={styles.modalContainer}>
            {selectedImage && (
              <Image
                source={{ uri: selectedImage }}
                style={styles.modalImage}
                resizeMode="contain"
                onError={(error) => console.log("Modal image load error:", error.nativeEvent)}
                onLoad={() => console.log("Modal image loaded:", selectedImage)}
              />
            )}
            <TouchableOpacity style={styles.closeButton} onPress={closeImageModal}>
              <Ionicons name="close-circle" size={40} color="white" />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

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
  // Styles cho modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)", // Nền tối với độ mờ
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "90%",
    height: "70%",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  modalImage: {
    width: "100%",
    height: "100%",
  },
  closeButton: {
    position: "absolute",
    top: 10,
    right: 10,
  },
});