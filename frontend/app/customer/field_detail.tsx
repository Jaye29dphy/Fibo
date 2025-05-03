import React, { useState, useEffect } from "react";
import { View, Text, Image, TouchableOpacity, ScrollView, StyleSheet, Modal, Dimensions, TextInput, Alert, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import BottomTabs from "./BottomTabs";
import { formatCurrency, getStringParam } from "@/constants/apiService";
import { API_ENDPOINTS, FIELD_IMAGE_BASE_URL, API_URL, AVATAR_BASE_URL } from "@/constants/apiConfig";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width, height } = Dimensions.get("window");

const FieldDetail: React.FC = () => {
  const router = useRouter();
  const { field_id, name, price, location, image, description } = useLocalSearchParams();
  const [fieldImages, setFieldImages] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState<string>("");
  const [showAddReview, setShowAddReview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldAvgRating, setFieldAvgRating] = useState<number>(0);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [canReview, setCanReview] = useState(false); // Thêm state để kiểm tra xem người dùng đã đặt sân chưa

  useEffect(() => {
    const fetchFieldImages = async () => {
      try {
        const response = await fetch(`${API_ENDPOINTS.GET_FIELDS}/${field_id}/images`);
        const data = await response.json();
        if (Array.isArray(data)) {
          setFieldImages(data);
        } else {
          setFieldImages([]);
        }
      } catch (error) {
        console.error("Error fetching field images:", error);
        setFieldImages([]);
      }
    };

    const fetchReviews = async () => {
      try {
        // Sửa đường dẫn API để khớp với cấu trúc backend mới
        const response = await fetch(`${API_URL}/api/reviews/fields/${field_id}`);
        console.log("Fetching reviews from:", `${API_URL}/api/reviews/fields/${field_id}`);
        const data = await response.json();
        console.log("Reviews API response:", data);
        
        if (Array.isArray(data)) {
          setReviews(data);
          console.log("Reviews set to:", data);
          
          // Calculate average rating
          if (data.length > 0) {
            const sum = data.reduce((total, item) => total + item.rating, 0);
            setFieldAvgRating(sum / data.length);
          }
        } else {
          console.log("Reviews data is not an array:", data);
          setReviews([]);
        }
      } catch (error) {
        console.error("Error fetching reviews:", error);
        setReviews([]);
      }
    };

    // Kiểm tra xem người dùng đã đặt sân này chưa
    const checkIfUserCanReview = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) {
          setCanReview(false);
          return;
        }
        
        // Gọi API để kiểm tra xem người dùng đã đặt sân này chưa
        const response = await fetch(`${API_URL}/api/calendar/user-bookings/${field_id}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        });
        
        if (!response.ok) {
          console.error("Error response from API:", response.status);
          setCanReview(false);
          return;
        }
        
        const data = await response.json();
        console.log("User booking check response:", data);
        
        // Kiểm tra nếu người dùng có đặt sân thành công
        if (data && Array.isArray(data) && data.length > 0) {
          // Sửa logic: Cho phép đánh giá nếu có bất kỳ đặt sân nào đã được xác nhận hoặc hoàn thành
          const hasValidBooking = data.some(booking => 
            booking.status === 'completed' || booking.status === 'confirmed'
          );
          
          console.log("Can review:", hasValidBooking);
          setCanReview(hasValidBooking);
          
          // Nếu vẫn không thể đánh giá, hãy kiểm tra chi tiết từng đặt sân
          if (!hasValidBooking) {
            console.log("Booking details that didn't qualify:", 
              data.map(b => ({
                status: b.status
              }))
            );
          }
        } else {
          console.log("No bookings found for this field");
          setCanReview(false);
        }
      } catch (error) {
        console.error("Error checking if user can review:", error);
        setCanReview(false);
      }
    };

    if (field_id) {
      fetchFieldImages();
      fetchReviews();
      checkIfUserCanReview();
    }
  }, [field_id]);

  const priceString = getStringParam(price);
  const displayPrice = priceString ? formatCurrency(priceString) : "Giá không khả dụng";
  const imageString = getStringParam(image);

  const mainImage = fieldImages.find((img) => img.image_type === "main");
  const mainImageUrl = mainImage?.image_name
    ? `${FIELD_IMAGE_BASE_URL}/${mainImage.image_name}?t=${Date.now()}`
    : imageString
    ? `${FIELD_IMAGE_BASE_URL}/${imageString}?t=${Date.now()}`
    : "https://via.placeholder.com/150";

  const openImageModal = (imageName: string) => {
    const imageUrl = imageName
      ? `${FIELD_IMAGE_BASE_URL}/${imageName}?t=${Date.now()}`
      : "https://via.placeholder.com/150";
    setSelectedImage(imageUrl);
    setModalVisible(true);
  };

  const closeImageModal = () => {
    setModalVisible(false);
    setSelectedImage(null);
  };

  const handleSubmitReview = async () => {
    if (rating === 0) {
      Alert.alert("Lỗi", "Vui lòng chọn số sao đánh giá");
      return;
    }
    
    if (!comment.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập nội dung đánh giá");
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Get authentication token
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert("Thông báo", "Bạn cần đăng nhập để đánh giá", [
          { text: "Hủy", style: "cancel" },
          { text: "Đăng nhập", onPress: () => router.push("/customer") }
        ]);
        setIsSubmitting(false);
        return;
      }
      
      // Sửa đường dẫn API để gửi đánh giá đến endpoint đúng
      console.log("Sending review to:", `${API_URL}/api/reviews/fields`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ rating, comment, field_id })
      });
      
      const response = await fetch(`${API_URL}/api/reviews/fields/${field_id}`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ rating, comment, field_id }),
      });
      
      console.log("Response status:", response.status);
      
      const data = await response.json();
      console.log("Review submission response:", data);
      
      if (response.ok) {
        // Add the new review to the list
        const newReview = {
          ...data,
          full_name: data.full_name || "Khách hàng" 
        };
        setReviews([newReview, ...reviews]);
        
        // Tính lại đánh giá trung bình với đánh giá mới
        const newReviews = [newReview, ...reviews];
        const sum = newReviews.reduce((total, item) => total + parseFloat(item.rating), 0);
        const newAvgRating = sum / newReviews.length;
        
        console.log("New calculated average rating:", newAvgRating);
        
        // Ưu tiên dùng đánh giá từ server nếu có, nếu không dùng giá trị tính toán
        if (data.fieldRating) {
          console.log("Using server rating:", data.fieldRating);
          setFieldAvgRating(parseFloat(data.fieldRating));
        } else {
          console.log("Using calculated rating:", newAvgRating);
          setFieldAvgRating(newAvgRating);
        }
        
        // Reset form
        setRating(0);
        setComment("");
        setShowAddReview(false);
        
        Alert.alert("Thành công", "Đánh giá của bạn đã được gửi thành công!");
      } else {
        Alert.alert("Lỗi", data.message || "Không thể gửi đánh giá. Vui lòng thử lại sau.");
      }
    } catch (error) {
      console.error("Error submitting review:", error);
      Alert.alert("Lỗi", "Có lỗi xảy ra khi gửi đánh giá. Vui lòng thử lại sau.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.title}>Chi tiết sân bóng</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 200 }}>
        <View style={styles.imageContainer}>
          <TouchableOpacity onPress={() => openImageModal(mainImage?.image_name || imageString)}>
            <Image
              source={{ uri: mainImageUrl }}
              style={styles.image}
              onError={(error) => console.log(`Main image load error for field ${field_id}:`, error.nativeEvent)}
              onLoad={() => console.log(`Main image loaded for field ${field_id}:`, mainImageUrl)}
            />
          </TouchableOpacity>
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
              return (
                <TouchableOpacity key={index} onPress={() => openImageModal(fieldImage.image_name)}>
                  <View style={styles.styleprev}>
                    <View style={styles.subImageContainer}>
                      <Image
                        source={{ uri: subImageUrl }}
                        style={styles.previmg}
                        onError={(error) => console.log(`Sub image load error ${index + 1} for field ${field_id}:`, error.nativeEvent)}
                        onLoad={() => console.log(`Sub image loaded ${index + 1} for field ${field_id}:`, subImageUrl)}
                      />
                    </View>
                    <Text>{`Ảnh ${index + 1}`}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
        </ScrollView>

        <View style={styles.ratingSection}>
          <Text style={styles.descriptionTitle}>Đánh giá tổng thể</Text>
          <View style={styles.overallRating}>
            <Text style={styles.ratingScore}>
              {typeof fieldAvgRating === 'number' ? fieldAvgRating.toFixed(1) : '0.0'}
            </Text>
            <View style={styles.starsContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Ionicons 
                  key={star} 
                  name={fieldAvgRating >= star - 0.5 ? "star" : "star-outline"} 
                  size={20}
                  color="#FFD700" 
                />
              ))}
            </View>
            <Text style={styles.reviewCount}>({reviews.length} đánh giá)</Text>
          </View>
        </View>

        <Text style={styles.descriptionTitle}>Đánh giá khách hàng</Text>
        
        {reviews.length > 0 ? (
          <View style={styles.reviewsList}>
            {(showAllReviews ? reviews : reviews.slice(0, 5)).map((item, index) => (
              <View key={`${item.id || item.review_id || index}`} style={styles.reviewContainer}>
                <View style={styles.reviewHeader}>
                  <View style={styles.userInfo}>
                    <Image
                      source={{ 
                        uri: item.avatar 
                          ? `${AVATAR_BASE_URL}/${item.avatar}?t=${Date.now()}` 
                          : `${AVATAR_BASE_URL}/default-ava.jpg` 
                      }}
                      style={styles.avatar}
                      onError={(e) => {
                        console.log("Avatar load error, falling back to default");
                        if ((e.nativeEvent as any).error && !item.avatar) {
                          console.log("Default avatar also failed to load");
                        }
                      }}
                    />
                    <View style={styles.nameAndDate}>
                      <Text style={styles.reviewerName}>{item.full_name || "Khách hàng"}</Text>
                      <Text style={styles.reviewDate}>
                        {new Date(item.created_at).toLocaleDateString('vi-VN', { 
                          day: '2-digit', 
                          month: '2-digit', 
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.reviewRating}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Ionicons 
                        key={star} 
                        name={item.rating >= star ? "star" : "star-outline"} 
                        size={16}
                        color="#FFD700" 
                      />
                    ))}
                  </View>
                </View>
                <Text style={styles.reviewText}>{item.comment}</Text>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.reviewContainer}>
            <Text style={styles.reviewText}>Chưa có đánh giá nào</Text>
          </View>
        )}

        <View style={styles.reviewActionContainer}>
          {reviews.length > 5 && (
            <TouchableOpacity style={styles.viewAllReviewsButton} onPress={() => setShowAllReviews(!showAllReviews)}>
              <Text style={styles.viewAllReviewsText}>
                {showAllReviews ? (
                  <>
                    <Ionicons name="chevron-up" size={16} color="#16A34A" /> Ẩn bớt
                  </>
                ) : (
                  <>
                    <Ionicons name="chevron-down" size={16} color="#16A34A" /> Xem tất cả đánh giá ({reviews.length})
                  </>
                )}
              </Text>
            </TouchableOpacity>
          )}

          {canReview && (
            <TouchableOpacity style={styles.addReviewButtonAlt} onPress={() => setShowAddReview(!showAddReview)}>
              <Ionicons name={showAddReview ? "close-circle" : "create"} size={20} color="#fff" style={styles.addReviewIcon} />
              <Text style={styles.addReviewText}>{showAddReview ? "Hủy đánh giá" : "Thêm đánh giá"}</Text>
            </TouchableOpacity>
          )}
          
          {!canReview && (
            <View style={styles.reviewNoteContainer}>
              <Text style={styles.reviewNoteText}>
                <Ionicons name="information-circle" size={16} color="#666" /> Bạn cần đặt và sử dụng sân trước khi đánh giá
              </Text>
            </View>
          )}
        </View>

        {showAddReview && (
          <View style={styles.addReviewContainer}>
            <TextInput
              style={styles.input}
              placeholder="Nhập đánh giá của bạn"
              value={comment}
              onChangeText={setComment}
              multiline={true}
              numberOfLines={4}
            />
            <View style={styles.ratingContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setRating(star)}>
                  <Ionicons
                    name={star <= rating ? "star" : "star-outline"}
                    size={24}
                    color="#FFD700"
                  />
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity 
              style={[styles.submitButton, isSubmitting && styles.disabledButton]} 
              onPress={handleSubmitReview}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.submitText}>Gửi đánh giá</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeImageModal}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={closeImageModal}
        >
          <View style={styles.modalContainer}>
            {selectedImage && (
              <Image
                source={{ uri: selectedImage }}
                style={styles.modalImage}
                resizeMode="contain"
                onError={(error) => console.log("Modal image load error:", error.nativeEvent)}
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
              params: { field_id, name, price, location, image: imageString },
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
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
  reviewContainer: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#16A34A",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  reviewText: {
    fontSize: 14,
    color: "#333",
  },
  reviewDate: {
    fontSize: 12,
    color: "#666",
  },
  addReviewContainer: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  ratingContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 15,
  },
  submitButton: {
    backgroundColor: "#16A34A",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  disabledButton: {
    backgroundColor: "#95d5a6",
  },
  submitText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  addReviewButton: {
    backgroundColor: "#16A34A",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 20,
    marginTop: 10,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  addReviewButtonAlt: {
    flexDirection: "row",
    backgroundColor: "#FF6B00",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    marginTop: 10,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  addReviewIcon: {
    marginRight: 8,
  },
  addReviewText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  overallRating: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 10,
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 8,
  },
  ratingScore: {
    fontSize: 28,
    fontWeight: "bold",
    marginRight: 12,
    color: "#16A34A",
  },
  starsContainer: {
    flexDirection: "row",
    marginRight: 10,
  },
  reviewCount: {
    color: "#666",
    fontSize: 14,
  },
  ratingSection: {
    marginVertical: 10,
  },
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  nameAndDate: {
    marginLeft: 8,
  },
  reviewerName: {
    fontWeight: "bold",
    fontSize: 14,
    color: "#333",
  },
  reviewRating: {
    flexDirection: "row",
  },
  reviewsList: {
    marginBottom: 20, // Tăng margin bên dưới để tạo thêm khoảng cách
  },
  reviewsListContainer: {
    paddingBottom: 10,
  },
  viewAllReviewsButton: {
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    marginVertical: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  viewAllReviewsText: {
    color: "#16A34A",
    fontSize: 14,
    fontWeight: "600",
  },
  avatarContainer: {
    marginRight: 8,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  reviewActionContainer: {
    marginTop: 20,
  },
  reviewNoteContainer: {
    backgroundColor: "#f9f9f9",
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    alignItems: "center",
  },
  reviewNoteText: {
    color: "#666",
    fontSize: 14,
    textAlign: "center",
  },
});