import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Dimensions,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { API_ENDPOINTS, API_URL, AVATAR_BASE_URL } from '../../constants/apiConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GestureHandlerRootView, Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

interface FieldImage {
  image_name: string;
  image_type: 'main' | 'sub';
}

interface SubField {
  subfield_id: number;
  field_id: number;
  name: string;
  status?: string;
}

interface Service {
  service_id: number;
  field_id: number;
  name: string;
  price: number;
  description?: string;
  status: string;
}

interface TimeSlot {
  slot_id: number;
  start_time: string;
  end_time: string;
  price: number;
}

interface Review {
  id?: number;
  review_id?: number;
  field_id: number;
  user_id: number;
  rating: number;
  comment: string;
  created_at: string;
  full_name?: string;
  avatar?: string;
}

interface FieldData {
  field_id: number;
  name: string;
  location: string;
  sport_type: string;
  price_per_hour: number;
  status: string;
  description: string;
  rating: number;
  images: FieldImage[];
  subFields?: SubField[];
  services?: Service[];
  timeSlots?: TimeSlot[];
}

export default function FieldInfo() {
  const router = useRouter();
  const { fieldId } = useLocalSearchParams<{ fieldId: string }>();

  const [fieldData, setFieldData] = useState<FieldData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [showReviews, setShowReviews] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [isImageModalVisible, setIsImageModalVisible] = useState(false);
  const [modalImageIndex, setModalImageIndex] = useState(0);

  // Get screen dimensions for modal
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

  useEffect(() => {
    if (fieldId) {
      fetchFieldData();
      fetchReviews();
    }
  }, [fieldId]);
  const fetchFieldData = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');

      if (!token) {
        Alert.alert('Lỗi', 'Không tìm thấy token xác thực', [
          {
            text: 'OK',
            onPress: () => router.push('/customer')
          }
        ]);
        return;
      } const response = await fetch(`${API_ENDPOINTS.GET_OWNER_FIELD_DETAIL}/${fieldId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 401) {
        Alert.alert('Phiên đăng nhập đã hết hạn', 'Vui lòng đăng nhập lại', [
          {
            text: 'OK',
            onPress: () => router.push('/customer')
          }
        ]);
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      } const data = await response.json();
      console.log('Field data:', data);

      // Fetch additional data in parallel
      const [subFieldsRes, servicesRes, timeSlotsRes] = await Promise.allSettled([
        fetchSubFields(fieldId, token),
        fetchServices(fieldId, token),
        fetchTimeSlots(fieldId, token)
      ]);

      // Process additional data
      const subFields = subFieldsRes.status === 'fulfilled' ? subFieldsRes.value : [];
      const services = servicesRes.status === 'fulfilled' ? servicesRes.value : [];
      const timeSlots = timeSlotsRes.status === 'fulfilled' ? timeSlotsRes.value : [];

      setFieldData({
        ...data,
        subFields,
        services,
        timeSlots
      });

    } catch (error) {
      console.error('Error fetching field data:', error);
      Alert.alert('Lỗi', 'Không thể tải thông tin sân');
    } finally {
      setLoading(false);
    }
  }; const fetchSubFields = async (fieldId: string, token: string): Promise<SubField[]> => {
    try {
      const response = await fetch(`${API_URL}/courts/${fieldId}/subfields`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        return await response.json();
      }
      return [];
    } catch (error) {
      console.error('Error fetching sub-fields:', error);
      return [];
    }
  };
  const fetchServices = async (fieldId: string, token: string): Promise<Service[]> => {
    try {
      const response = await fetch(`${API_URL}/courts/${fieldId}/services`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        return await response.json();
      }
      return [];
    } catch (error) {
      console.error('Error fetching services:', error);
      return [];
    }
  };
  const fetchTimeSlots = async (fieldId: string, token: string): Promise<TimeSlot[]> => {
    try {
      const response = await fetch(`${API_URL}/courts/${fieldId}/timeslots`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        return await response.json();
      }
      return [];
    } catch (error) {
      console.error('Error fetching time slots:', error);
      return [];
    }
  };

  const fetchReviews = async () => {
    try {
      const response = await fetch(`${API_URL}/api/reviews/fields/${fieldId}`);
      console.log("Fetching reviews from:", `${API_URL}/api/reviews/fields/${fieldId}`);
      const data = await response.json();
      console.log("Reviews API response:", data);

      if (Array.isArray(data)) {
        setReviews(data);
        console.log("Reviews set to:", data);
      } else {
        console.log("Reviews data is not an array:", data);
        setReviews([]);
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
      setReviews([]);
    }
  }; const getImageUrl = (imageName: string) => {
    // Tạo URL cho ảnh dựa trên tên file
    return `${API_URL}/fields/${imageName}`;
  };
  const getSportTypeText = (sportType: string) => {
    const sportTypes: { [key: string]: string } = {
      'football': 'Bóng đá',
      'basketball': 'Bóng rổ',
      'badminton': 'Cầu lông',
      'tennis': 'Tennis',
      'pickleball': 'Pickleball',
    };
    return sportTypes[sportType] || sportType;
  };
  const getSportIcon = (sportType: string): keyof typeof Ionicons.glyphMap => {
    const sportIcons: { [key: string]: keyof typeof Ionicons.glyphMap } = {
      'football': 'football-outline',
      'basketball': 'basketball-outline',
      'badminton': 'tennisball-outline',
      'tennis': 'tennisball-outline',
      'pickleball': 'tennisball-outline',
    };
    return sportIcons[sportType] || 'fitness-outline';
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Ionicons key={i} name="star" size={16} color="#FFD700" />
      );
    }

    if (hasHalfStar) {
      stars.push(
        <Ionicons key="half" name="star-half" size={16} color="#FFD700" />
      );
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <Ionicons key={`empty-${i}`} name="star-outline" size={16} color="#FFD700" />
      );
    }

    return stars;
  };

  const renderImageGallery = () => {
    if (!fieldData || !fieldData.images || fieldData.images.length === 0) {
      return (
        <View style={styles.noImageContainer}>
          <Ionicons name="image-outline" size={100} color="#CBD5E1" />
          <Text style={styles.noImageText}>Không có ảnh</Text>
        </View>
      );
    }

    const images = fieldData.images;
    const selectedImage = images[selectedImageIndex];

    return (
      <View style={styles.imageGalleryContainer}>        {/* Ảnh lớn hiển thị chính */}
        <TouchableOpacity
          style={styles.mainImageContainer}
          onPress={() => {
            setModalImageIndex(selectedImageIndex);
            setIsImageModalVisible(true);
          }}
          activeOpacity={0.8}
        >
          <Image
            source={{ uri: getImageUrl(selectedImage.image_name) }}
            style={styles.mainImage}
            resizeMode="cover"
          />
          {selectedImage.image_type === 'main' && (
            <View style={styles.mainImageBadge}>
              <Text style={styles.mainImageBadgeText}>Ảnh chính</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Danh sách ảnh nhỏ */}
        <View style={styles.thumbnailContainer}>
          <FlatList
            data={images}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item, index) => `${item.image_name}-${index}`}
            renderItem={({ item, index }) => (
              <TouchableOpacity
                style={[
                  styles.thumbnailWrapper,
                  selectedImageIndex === index && styles.selectedThumbnailWrapper
                ]}
                onPress={() => setSelectedImageIndex(index)}
              >
                <Image
                  source={{ uri: getImageUrl(item.image_name) }}
                  style={styles.thumbnailImage}
                  resizeMode="cover"
                />
                {item.image_type === 'main' && (
                  <View style={styles.thumbnailMainBadge}>
                    <Ionicons name="star" size={12} color="#FFD700" />
                  </View>
                )}
                {selectedImageIndex === index && (
                  <View style={styles.selectedOverlay}>
                    <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                  </View>
                )}
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.thumbnailList}
          />
        </View>        {/* Modal for full-screen image */}
        <Modal
          visible={isImageModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setIsImageModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <TouchableOpacity
              style={styles.modalBackground}
              onPress={() => setIsImageModalVisible(false)}
              activeOpacity={1}
            >
              <View style={styles.modalContent}>
                {/* Close Button */}
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setIsImageModalVisible(false)}
                >
                  <Ionicons name="close" size={24} color="#FFFFFF" />
                </TouchableOpacity>                {/* Image Container with Swipe Gesture */}
                <GestureHandlerRootView style={{ flex: 1, width: '100%' }}>
                  <GestureDetector
                    gesture={Gesture.Pan()
                      .onEnd((e) => {
                        // Swipe left to see next image
                        if (e.translationX < -50) {
                          setModalImageIndex((prevIndex) =>
                            (prevIndex + 1) % fieldData.images.length
                          );
                        }
                        // Swipe right to see previous image
                        else if (e.translationX > 50) {
                          setModalImageIndex((prevIndex) =>
                            prevIndex === 0 ? fieldData.images.length - 1 : prevIndex - 1
                          );
                        }
                      })
                    }
                  >
                    <View style={styles.modalImageContainer}>
                      <Image
                        source={{ uri: getImageUrl(fieldData.images[modalImageIndex].image_name) }}
                        style={styles.modalImage}
                        resizeMode="contain"
                      />

                      {/* Navigation Buttons */}
                      <TouchableOpacity
                        style={[styles.modalNavButton, styles.modalNavButtonLeft]}
                        onPress={() => {
                          // Navigate to previous image or loop back to last image
                          setModalImageIndex((prevIndex) =>
                            prevIndex === 0 ? fieldData.images.length - 1 : prevIndex - 1
                          );
                        }}
                      >
                        <Ionicons name="chevron-back" size={30} color="#FFFFFF" />
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.modalNavButton, styles.modalNavButtonRight]}
                        onPress={() => {
                          // Navigate to next image or loop back to first image
                          setModalImageIndex((prevIndex) =>
                            (prevIndex + 1) % fieldData.images.length
                          );
                        }}
                      >
                        <Ionicons name="chevron-forward" size={30} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>
                  </GestureDetector>
                </GestureHandlerRootView>

                {/* Image Info */}
                <View style={styles.modalImageInfo}>
                  <Text style={styles.modalImageInfoText}>
                    {modalImageIndex + 1} / {fieldData.images.length}
                    {fieldData.images[modalImageIndex].image_type === 'main' && ' - Ảnh chính'}
                  </Text>
                  <Text style={styles.modalImageInfoText}>
                    Nhấn vào ảnh để xem ảnh tiếp theo • Nhấn ra ngoài để đóng
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        </Modal>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Đang tải thông tin sân...</Text>
      </View>
    );
  }

  if (!fieldData) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={50} color="#EF4444" />
        <Text style={styles.errorText}>Không thể tải thông tin sân</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchFieldData}>
          <Text style={styles.retryButtonText}>Thử lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thông tin sân</Text>        <TouchableOpacity
          style={styles.editButton}
          onPress={() => {
            console.log('Edit button pressed, fieldId:', fieldId);
            router.push({
              pathname: './update-field-info',
              params: { fieldId: fieldId }
            });
          }}
        >
          <Ionicons name="create-outline" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Image Gallery */}
        {renderImageGallery()}

        {/* Field Information */}
        <View style={styles.infoContainer}>          {/* Field Name */}
          <View style={styles.infoSection}>
            <View style={styles.fieldNameContainer}>
              <Text style={styles.fieldName}>{fieldData.name}</Text>
              <View style={[
                styles.statusBadge,
                { backgroundColor: fieldData.status === 'available' ? '#10B981' : '#EF4444' }
              ]}>
                <Text style={styles.statusText}>
                  {fieldData.status === 'available' ? 'Hoạt động' : 'Ngừng hoạt động'}
                </Text>
              </View>
            </View>
          </View>          {/* Location */}
          <View style={styles.infoSection}>
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={20} color="#6B7280" />
              <Text style={styles.infoValue}>{fieldData.location}</Text>
            </View>
          </View>          {/* Sport Type */}
          <View style={styles.infoSection}>
            <View style={styles.infoRow}>
              <Ionicons name={getSportIcon(fieldData.sport_type)} size={20} color="#6B7280" />
              <Text style={styles.infoValue}>{getSportTypeText(fieldData.sport_type)}</Text>
            </View>
          </View>

          {/* Description */}
          <View style={styles.infoSection}>
            <View style={styles.infoRow}>
              <Ionicons name="document-text-outline" size={20} color="#6B7280" />
              <Text style={styles.infoLabel}>Mô tả:</Text>
            </View>
            <Text style={styles.descriptionText}>{fieldData.description}</Text>
          </View>          {/* Rating */}
          <View style={styles.infoSection}>
            <View style={styles.infoRow}>
              <Ionicons name="star-outline" size={20} color="#6B7280" />
              <Text style={styles.infoLabel}>Đánh giá:</Text>
            </View>
            <TouchableOpacity
              style={styles.ratingContainer}
              onPress={() => setShowReviews(!showReviews)}
            >
              <View style={styles.starsContainer}>
                {renderStars(fieldData.rating || 0)}
              </View>
              <Text style={styles.ratingText}>
                {(fieldData.rating || 0).toFixed(1)} / 5.0
              </Text>
              <Text style={styles.reviewCount}>
                ({reviews.length} đánh giá)
              </Text>
              <Ionicons
                name={showReviews ? "chevron-up" : "chevron-down"}
                size={20}
                color="#6B7280"
                style={styles.chevronIcon}
              />
            </TouchableOpacity>
          </View>

          {/* Reviews Section */}
          {showReviews && (
            <View style={styles.reviewsSection}>
              <View style={styles.reviewsHeader}>
                <Text style={styles.reviewsTitle}>Tất cả đánh giá</Text>
              </View>

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
                <View style={styles.noReviewsContainer}>
                  <Text style={styles.noReviewsText}>Chưa có đánh giá nào</Text>
                </View>
              )}

              {reviews.length > 5 && (
                <TouchableOpacity
                  style={styles.viewAllReviewsButton}
                  onPress={() => setShowAllReviews(!showAllReviews)}
                >
                  <Text style={styles.viewAllReviewsText}>
                    {showAllReviews ? (
                      <>
                        <Ionicons name="chevron-up" size={16} color="#3B82F6" /> Ẩn bớt
                      </>
                    ) : (
                      <>
                        <Ionicons name="chevron-down" size={16} color="#3B82F6" /> Xem tất cả đánh giá ({reviews.length})
                      </>
                    )}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}{/* Sub-fields Information */}
          <View style={styles.infoSection}>
            <View style={styles.infoRow}>
              <Ionicons name="grid-outline" size={20} color="#6B7280" />
              <Text style={styles.infoLabel}>Sân con:</Text>
            </View>
            {fieldData.subFields && fieldData.subFields.length > 0 ? (
              <View style={styles.subFieldsContainer}>
                <Text style={styles.subFieldsCount}>
                  Tổng số: {fieldData.subFields.length} sân con
                </Text>
                <View style={styles.subFieldsList}>
                  {fieldData.subFields.map((subField, index) => (
                    <View key={subField.subfield_id} style={styles.subFieldItem}>
                      <Text style={styles.subFieldName}>{subField.name}</Text>
                      <View style={[
                        styles.subFieldStatus,
                        { backgroundColor: subField.status === 'available' ? '#10B981' : '#EF4444' }
                      ]}>
                        <Text style={styles.subFieldStatusText}>
                          {subField.status === 'available' ? 'Hoạt động' : 'Ngừng hoạt động'}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            ) : (
              <Text style={styles.infoValue}>Chưa có thông tin sân con</Text>
            )}
          </View>

          {/* Services Information */}
          <View style={styles.infoSection}>
            <View style={styles.infoRow}>
              <Ionicons name="settings-outline" size={20} color="#6B7280" />
              <Text style={styles.infoLabel}>Dịch vụ thêm:</Text>
            </View>
            {fieldData.services && fieldData.services.length > 0 ? (
              <View style={styles.servicesContainer}>
                {fieldData.services.map((service) => (
                  <View key={service.service_id} style={styles.serviceItem}>
                    <View style={styles.serviceInfo}>
                      <Text style={styles.serviceName}>{service.name}</Text>
                      {service.description && (
                        <Text style={styles.serviceDescription}>{service.description}</Text>
                      )}
                    </View>
                    <View style={styles.servicePriceContainer}>
                      <Text style={styles.servicePrice}>
                        {new Intl.NumberFormat('vi-VN', {
                          style: 'currency',
                          currency: 'VND'
                        }).format(service.price)}
                      </Text>
                      <View style={[
                        styles.serviceStatus,
                        { backgroundColor: service.status === 'available' ? '#10B981' : '#EF4444' }
                      ]}>
                        <Text style={styles.serviceStatusText}>
                          {service.status === 'available' ? 'Có sẵn' : 'Ngừng cung cấp'}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.infoValue}>Chưa có dịch vụ thêm</Text>
            )}
          </View>

          {/* Time Slots Information */}
          <View style={styles.infoSection}>
            <View style={styles.infoRow}>
              <Ionicons name="time-outline" size={20} color="#6B7280" />
              <Text style={styles.infoLabel}>Bảng giá theo giờ:</Text>
            </View>
            {fieldData.timeSlots && fieldData.timeSlots.length > 0 ? (
              <View style={styles.timeSlotsContainer}>
                {fieldData.timeSlots.map((slot) => (
                  <View key={slot.slot_id} style={styles.timeSlotItem}>
                    <View style={styles.timeSlotInfo}>
                      <Text style={styles.timeSlotTime}>
                        {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                      </Text>
                    </View>
                    <Text style={styles.timeSlotPrice}>
                      {new Intl.NumberFormat('vi-VN', {
                        style: 'currency',
                        currency: 'VND'
                      }).format(slot.price)}
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.infoValue}>Chưa có thông tin khung giờ</Text>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  editButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 20,
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: '#3B82F6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  imageGalleryContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mainImageContainer: {
    position: 'relative',
    height: 250,
  },
  mainImage: {
    width: '100%',
    height: '100%',
  },
  mainImageBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  mainImageBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  thumbnailContainer: {
    backgroundColor: '#F8FAFC',
    padding: 12,
  },
  thumbnailList: {
    paddingHorizontal: 4,
  },
  thumbnailWrapper: {
    position: 'relative',
    marginHorizontal: 4,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedThumbnailWrapper: {
    borderColor: '#10B981',
  },
  thumbnailImage: {
    width: 60,
    height: 60,
  },
  thumbnailMainBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 10,
    padding: 2,
  },
  selectedOverlay: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 10,
    padding: 2,
  },
  noImageContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  noImageText: {
    marginTop: 12,
    fontSize: 16,
    color: '#9CA3AF',
  },
  infoContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 20,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  }, infoSection: {
    marginBottom: 20,
  },
  fieldNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  fieldName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
    flex: 1,
    marginRight: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 8,
  },
  infoValue: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
  },
  descriptionText: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
    textAlign: 'justify',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
    marginRight: 8,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  }, placeholderSection: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 20,
    marginTop: 20,
  },
  placeholderText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 8,
  },
  // Sub-fields styles
  subFieldsContainer: {
    marginTop: 8,
  },
  subFieldsCount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  subFieldsList: {
    gap: 8,
  },
  subFieldItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  subFieldName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  subFieldStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  subFieldStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Services styles
  servicesContainer: {
    marginTop: 8,
    gap: 12,
  },
  serviceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  serviceInfo: {
    flex: 1,
    marginRight: 12,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  serviceDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  servicePriceContainer: {
    alignItems: 'flex-end',
  },
  servicePrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#059669',
    marginBottom: 4,
  },
  serviceStatus: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  serviceStatusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Time slots styles
  timeSlotsContainer: {
    marginTop: 8,
    gap: 8,
  },
  timeSlotItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  timeSlotInfo: {
    flex: 1,
  },
  timeSlotTime: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  }, timeSlotPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#059669',
  },
  // Reviews styles
  reviewCount: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
  },
  chevronIcon: {
    marginLeft: 8,
  },
  reviewsSection: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  reviewsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
  },
  overallRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingScore: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 8,
  },
  reviewsList: {
    gap: 12,
  },
  reviewContainer: {
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  nameAndDate: {
    flex: 1,
  },
  reviewerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  reviewDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  reviewRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  noReviewsContainer: {
    alignItems: 'center',
    padding: 20,
  },
  noReviewsText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  viewAllReviewsButton: {
    marginTop: 12,
    alignItems: 'center',
  },
  viewAllReviewsText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#3B82F6',
  },  // Modal styles
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  modalBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '95%',
    height: '80%',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000',
    position: 'relative',
  },
  modalImageContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalImage: {
    width: '100%',
    height: '100%',
  },
  modalCloseButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 8,
    zIndex: 10,
  },
  modalImageInfo: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 8,
    padding: 12,
    zIndex: 10,
  }, modalImageInfoText: {
    color: '#FFFFFF',
    fontSize: 14,
    textAlign: 'center',
  },
  modalNavButton: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 25,
    padding: 8,
    zIndex: 10,
  },
  modalNavButtonLeft: {
    left: 15,
  },
  modalNavButtonRight: {
    right: 15,
  },
});