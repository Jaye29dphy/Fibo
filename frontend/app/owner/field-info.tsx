import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Modal,
  FlatList,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { API_ENDPOINTS, FIELD_IMAGE_BASE_URL, API_URL, AVATAR_BASE_URL } from '../../constants/apiConfig';

// Định nghĩa kiểu dữ liệu
interface Service {
  service_id?: number;
  name: string;
  description: string;
  price: string;
  isNew?: boolean;
}

interface TimeSlot {
  slot_id: number;
  start_time: string;
  end_time: string;
  price: string;
  selected: boolean;
}

interface FieldImage {
  image_id: number;
  image_name: string;
}

interface FieldData {
  name: string;
  location: string;
  type: string;
  description: string;
  subFieldCount: string;
  services: Service[];
  price: string;
  timeSlots: TimeSlot[];
  images: string[];
  status: string;
}

// Helper function để format thời gian
const formatTime = (timeString: string): string => {
  const hour = parseInt(timeString.substring(0, 2));
  const minute = timeString.substring(3, 5);

  // Chuyển đổi giờ 24:00 thành 00:00
  if (hour === 24) {
    return `00:${minute}`;
  }

  return `${hour.toString().padStart(2, '0')}:${minute}`;
};

export default function FieldInfo() {
  const router = useRouter();
  const { fieldId } = useLocalSearchParams();

  // State cho dữ liệu sân
  const [fieldData, setFieldData] = useState<FieldData>({
    name: '',
    location: '',
    type: 'football',
    description: '',
    subFieldCount: '1',
    services: [],
    price: '',
    timeSlots: [],
    images: [],
    status: 'available'
  });

  // State phụ trợ
  const [loading, setLoading] = useState<boolean>(true);
  const [syncPrices, setSyncPrices] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [modalMessage, setModalMessage] = useState<string>('');
  const [modalSuccess, setModalSuccess] = useState<boolean>(false);
  const [originalImages, setOriginalImages] = useState<FieldImage[]>([]);
  const [removedImages, setRemovedImages] = useState<(number | string)[]>([]);
  const [newImages, setNewImages] = useState<string[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [fieldAvgRating, setFieldAvgRating] = useState<number>(0);
  const [showAllReviews, setShowAllReviews] = useState<boolean>(false);

  // Fetch thông tin sân khi component được load
  useEffect(() => {
    fetchFieldData();
    fetchTimeSlots();
    fetchReviews();
  }, [fieldId]);

  // Lấy thông tin sân từ API
  const fetchFieldData = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');

      if (!token) {
        showModal('Vui lòng đăng nhập để tiếp tục', false);
        return;
      }

      // Gọi API để lấy thông tin chi tiết của sân
      const response = await fetch(`${API_ENDPOINTS.GET_FIELD_DETAIL}/${fieldId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Không thể lấy thông tin sân');
      }

      // Lấy danh sách dịch vụ của sân
      const servicesResponse = await fetch(`${API_ENDPOINTS.GET_FIELD_SERVICES}/${fieldId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const servicesData = await servicesResponse.json();

      // Lấy thông tin giá và khung giờ
      const pricesResponse = await fetch(`${API_ENDPOINTS.GET_FIELD_PRICES}/${fieldId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const pricesData = await pricesResponse.json();

      // Lấy thông tin hình ảnh sân
      const imagesResponse = await fetch(`${API_ENDPOINTS.GET_FIELD_IMAGES}/${fieldId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const imagesData = await imagesResponse.json();

      // Khởi tạo dữ liệu sân với thông tin lấy được từ API
      const fieldImages = imagesData && imagesData.images ?
        imagesData.images.map((img: FieldImage) => `${FIELD_IMAGE_BASE_URL}/${img.image_name}`) : [];

      setOriginalImages(imagesData && imagesData.images ? imagesData.images : []);

      // Cập nhật state với dữ liệu từ API
      setFieldData({
        name: data.field.name || '',
        location: data.field.location || '',
        type: data.field.sport_type || 'football',
        description: data.field.description || '',
        subFieldCount: data.field.sub_field_count?.toString() || '1',
        services: servicesData && servicesData.services ? servicesData.services.map((service: any) => ({
          name: service.name || '',
          description: service.description || '',
          price: service.price?.toString() || '0',
          service_id: service.service_id
        })) : [],
        price: data.field.price_per_hour?.toString() || '',
        status: data.field.status || 'available',
        images: fieldImages,
        timeSlots: [] // Sẽ được cập nhật trong fetchTimeSlots
      });

    } catch (error) {
      console.error('Lỗi khi lấy thông tin sân:', error);
      showModal('Không thể lấy thông tin sân. Vui lòng thử lại sau.', false);
    } finally {
      setLoading(false);
    }
  };

  // Lấy danh sách khung giờ
  const fetchTimeSlots = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        showModal('Vui lòng đăng nhập để tiếp tục', false);
        return;
      }

      // Lấy danh sách tất cả các khung giờ có sẵn
      const slotsResponse = await fetch(API_ENDPOINTS.GET_TIME_SLOTS, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      // Kiểm tra response status trước khi parse JSON
      if (!slotsResponse.ok) {
        console.error('Lỗi khi lấy danh sách khung giờ:', slotsResponse.status, slotsResponse.statusText);
        const errorText = await slotsResponse.text(); // Đọc response dưới dạng text để debug
        console.error('Response error:', errorText);
        throw new Error(`Lỗi khi lấy danh sách khung giờ: ${slotsResponse.status}`);
      }

      const slotsData = await slotsResponse.json();
      // API có thể trả về dữ liệu trực tiếp là mảng khung giờ, không có thuộc tính timeSlots
      const timeSlots = Array.isArray(slotsData) ? slotsData : (slotsData.timeSlots || []);

      if (!timeSlots || timeSlots.length === 0) {
        console.warn('Không có dữ liệu khung giờ');
      }

      // Lấy thông tin khung giờ và giá của sân hiện tại
      const fieldPricesResponse = await fetch(`${API_ENDPOINTS.GET_FIELD_PRICES}/${fieldId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!fieldPricesResponse.ok) {
        console.error('Lỗi khi lấy thông tin giá:', fieldPricesResponse.status);
        throw new Error(`Lỗi khi lấy thông tin giá: ${fieldPricesResponse.status}`);
      }

      const fieldPricesData = await fieldPricesResponse.json();
      const fieldPrices = fieldPricesData && fieldPricesData.prices ? fieldPricesData.prices : [];

      // Kết hợp dữ liệu từ API để tạo mảng khung giờ với giá và trạng thái đã chọn
      const combinedTimeSlots = timeSlots.map((slot: any) => {
        const matchedPrice = fieldPrices.find((price: any) => price.slot_id === slot.slot_id);
        return {
          ...slot,
          price: matchedPrice ? matchedPrice.price.toString() : fieldData.price || '0',
          selected: !!matchedPrice
        };
      });

      setFieldData(prevData => ({
        ...prevData,
        timeSlots: combinedTimeSlots
      }));

    } catch (error) {
      console.error('Lỗi khi lấy danh sách khung giờ:', error);
      Alert.alert('Thông báo', 'Không thể lấy danh sách khung giờ, vui lòng thử lại sau.');
    }
  };

  // Lấy thông tin đánh giá sân từ API
  const fetchReviews = async () => {
    try {
      if (!fieldId) return;
      
      // Gọi API để lấy đánh giá của sân
      const response = await fetch(`${API_URL}/api/reviews/fields/${fieldId}`);
      console.log("Fetching reviews from:", `${API_URL}/api/reviews/fields/${fieldId}`);
      
      if (!response.ok) {
        console.error("Error response from API:", response.status);
        return;
      }

      const data = await response.json();
      console.log("Reviews API response:", data);

      if (Array.isArray(data)) {
        setReviews(data);
        console.log("Reviews set to:", data);

        // Tính toán điểm đánh giá trung bình
        if (data.length > 0) {
          const sum = data.reduce((total, item) => total + parseFloat(item.rating), 0);
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

  // Cập nhật trường dữ liệu
  const updateFieldData = (field: keyof FieldData, value: string) => {
    setFieldData(prevData => ({
      ...prevData,
      [field]: value
    }));
  };

  // Cập nhật giá mặc định
  const updateDefaultPrice = (price: string) => {
    setFieldData(prevData => ({
      ...prevData,
      price
    }));

    // Nếu đồng bộ giá được bật, cập nhật giá cho tất cả khung giờ đã chọn
    if (syncPrices) {
      setFieldData(prevData => ({
        ...prevData,
        timeSlots: prevData.timeSlots.map(slot =>
          slot.selected ? { ...slot, price } : slot
        )
      }));
    }
  };

  // Cập nhật giá cho một khung giờ cụ thể
  const updateTimeSlotPrice = (slotId: number, price: string) => {
    setFieldData(prevData => ({
      ...prevData,
      timeSlots: prevData.timeSlots.map(slot =>
        slot.slot_id === slotId ? { ...slot, price } : slot
      )
    }));
  };

  // Bật/tắt chọn một khung giờ
  const toggleTimeSlotSelection = (slotId: number) => {
    setFieldData(prevData => {
      // Tìm khung giờ hiện tại
      const currentSlot = prevData.timeSlots.find(slot => slot.slot_id === slotId);
      if (!currentSlot) return prevData;

      const isSelected = !currentSlot.selected;

      return {
        ...prevData,
        timeSlots: prevData.timeSlots.map(slot => {
          if (slot.slot_id === slotId) {
            return {
              ...slot,
              selected: isSelected,
              // Nếu được chọn và đồng bộ giá được bật, sử dụng giá mặc định
              price: isSelected && syncPrices ? prevData.price : slot.price
            };
          }
          return slot;
        })
      };
    });
  };

  // Bật/tắt đồng bộ giá
  const toggleSyncPrices = (value: boolean) => {
    setSyncPrices(value);

    // Nếu đồng bộ giá được bật, cập nhật giá cho tất cả khung giờ đã chọn
    if (value) {
      setFieldData(prevData => ({
        ...prevData,
        timeSlots: prevData.timeSlots.map(slot =>
          slot.selected ? { ...slot, price: prevData.price } : slot
        )
      }));
    }
  };

  // Thêm dịch vụ mới
  const addService = () => {
    setFieldData(prevData => ({
      ...prevData,
      services: [
        ...prevData.services,
        { name: '', description: '', price: '', isNew: true }
      ]
    }));
  };

  // Cập nhật thông tin dịch vụ
  const updateService = (index: number, field: keyof Service, value: string) => {
    setFieldData(prevData => ({
      ...prevData,
      services: prevData.services.map((service, i) =>
        i === index ? { ...service, [field]: value } : service
      )
    }));
  };

  // Xóa dịch vụ
  const removeService = (index: number) => {
    setFieldData(prevData => ({
      ...prevData,
      services: prevData.services.filter((_, i) => i !== index)
    }));
  };

  // Chọn ảnh từ thư viện
  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert('Cần quyền truy cập', 'Vui lòng cấp quyền truy cập thư viện ảnh để tiếp tục.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        // Thêm ảnh mới vào danh sách
        const newImage = result.assets[0].uri;
        setFieldData(prevData => ({
          ...prevData,
          images: [...prevData.images, newImage]
        }));

        // Lưu ảnh mới để upload sau
        setNewImages(prev => [...prev, newImage]);
      }
    } catch (error) {
      console.error('Lỗi khi chọn ảnh:', error);
      Alert.alert('Lỗi', 'Không thể chọn ảnh. Vui lòng thử lại sau.');
    }
  };

  // Xóa ảnh
  const removeImage = (index: number) => {
    // Kiểm tra xem đây có phải là ảnh gốc không
    if (index < originalImages.length) {
      // Thêm vào danh sách ảnh cần xóa
      const imageToRemove = originalImages[index];
      setRemovedImages(prev => [...prev, imageToRemove.image_id]);
    } else {
      // Xóa khỏi danh sách ảnh mới
      const adjustedIndex = index - originalImages.length;
      setNewImages(prev => prev.filter((_, i) => i !== adjustedIndex));
    }

    // Xóa khỏi UI
    setFieldData(prevData => ({
      ...prevData,
      images: prevData.images.filter((_, i) => i !== index)
    }));
  };

  // Hiển thị modal thông báo
  const showModal = (message: string, success: boolean) => {
    setModalMessage(message);
    setModalSuccess(success);
    setModalVisible(true);
  };

  // Chuẩn bị và gửi dữ liệu cập nhật lên server
  const handleUpdateField = async () => {
    try {
      // Kiểm tra thông tin bắt buộc
      if (!fieldData.name || !fieldData.location || !fieldData.description || !fieldData.price) {
        showModal('Vui lòng điền đầy đủ thông tin sân', false);
        return;
      }

      // Kiểm tra xem có khung giờ nào được chọn không
      const hasSelectedTimeSlots = fieldData.timeSlots.some(slot => slot.selected);
      if (!hasSelectedTimeSlots) {
        showModal('Vui lòng chọn ít nhất một khung giờ', false);
        return;
      }

      setIsSubmitting(true);
      const token = await AsyncStorage.getItem('token');

      // 1. Cập nhật thông tin cơ bản của sân
      const updateResponse = await fetch(`${API_ENDPOINTS.UPDATE_FIELD}/${fieldId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: fieldData.name,
          location: fieldData.location,
          sport_type: fieldData.type,
          description: fieldData.description,
          price_per_hour: parseFloat(fieldData.price),
          sub_field_count: parseInt(fieldData.subFieldCount),
          status: fieldData.status
        })
      });

      const updateData = await updateResponse.json();

      if (!updateResponse.ok) {
        throw new Error(updateData.message || 'Không thể cập nhật thông tin sân');
      }

      // 2. Cập nhật khung giờ và giá sân
      const selectedTimeSlots = fieldData.timeSlots
        .filter(slot => slot.selected)
        .map(slot => ({
          slot_id: slot.slot_id,
          price: parseFloat(slot.price)
        }));

      const timeSlotResponse = await fetch(`${API_ENDPOINTS.UPDATE_FIELD_PRICES}/${fieldId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prices: selectedTimeSlots
        })
      });

      if (!timeSlotResponse.ok) {
        const timeSlotError = await timeSlotResponse.json();
        throw new Error(timeSlotError.message || 'Không thể cập nhật khung giờ và giá sân');
      }

      // 3. Cập nhật các dịch vụ
      // - Tạo dịch vụ mới
      const newServices = fieldData.services.filter(service => service.isNew);
      if (newServices.length > 0) {
        const addServicesResponse = await fetch(`${API_ENDPOINTS.ADD_FIELD_SERVICES}/${fieldId}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            services: newServices.map(service => ({
              name: service.name,
              description: service.description,
              price: parseFloat(service.price)
            }))
          })
        });

        if (!addServicesResponse.ok) {
          const servicesError = await addServicesResponse.json();
          throw new Error(servicesError.message || 'Không thể thêm dịch vụ mới');
        }
      }

      // - Cập nhật dịch vụ hiện có
      const existingServices = fieldData.services.filter(service => !service.isNew && service.service_id);
      for (const service of existingServices) {
        await fetch(`${API_ENDPOINTS.UPDATE_FIELD_SERVICE}/${service.service_id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: service.name,
            description: service.description,
            price: parseFloat(service.price)
          })
        });
      }

      // 4. Xử lý xóa ảnh
      if (removedImages.length > 0) {
        await fetch(`${API_ENDPOINTS.DELETE_FIELD_IMAGES}/${fieldId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            image_ids: removedImages
          })
        });
      }

      // 5. Upload ảnh mới
      if (newImages.length > 0) {
        const formData = new FormData();

        newImages.forEach((uri, index) => {
          const filename = uri.split('/').pop() || `image_${index}.jpg`;
          const match = /\.(\w+)$/.exec(filename);
          const type = match ? `image/${match[1]}` : 'image';

          formData.append('images', {
            uri,
            name: filename,
            type
          } as any); // Sử dụng as any để tránh lỗi type checking
        });

        await fetch(`${API_ENDPOINTS.UPLOAD_FIELD_IMAGES}/${fieldId}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
          body: formData
        });
      }

      showModal('Cập nhật thông tin sân thành công!', true);

      // Quay lại màn hình danh sách sân sau khi cập nhật thành công
      setTimeout(() => {
        router.push('/owner/update-field-info');
      }, 1500);

    } catch (error: any) {
      console.error('Lỗi khi cập nhật thông tin sân:', error);
      showModal(`Không thể cập nhật thông tin sân: ${error.message || 'Lỗi không xác định'}`, false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading screen
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Đang tải thông tin sân...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Back Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={28} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Title */}
        <Text style={styles.title}>Cập nhật thông tin sân</Text>

        {/* Form Fields */}
        <View style={styles.formContainer}>
          {/* Field Name */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Tên sân</Text>
            <View style={styles.sectionContent}>
              <TextInput
                style={styles.input}
                value={fieldData.name}
                onChangeText={(text) => updateFieldData('name', text)}
                placeholder="Nhập tên sân"
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>

          {/* Location */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Vị trí</Text>
            <View style={styles.sectionContent}>
              <TextInput
                style={styles.input}
                value={fieldData.location}
                onChangeText={(text) => updateFieldData('location', text)}
                placeholder="Nhập vị trí"
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>

          {/* Field Type */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Loại sân</Text>
            <View style={styles.sectionContent}>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={fieldData.type}
                  style={styles.picker}
                  onValueChange={(itemValue) => updateFieldData('type', itemValue)}
                  dropdownIconColor="#6B7280"
                >
                  <Picker.Item label="Bóng đá" value="football" />
                  <Picker.Item label="Bóng rổ" value="basketball" />
                  <Picker.Item label="Cầu lông" value="badminton" />
                  <Picker.Item label="Tennis" value="tennis" />
                </Picker>
              </View>
            </View>
          </View>

          {/* Field Status */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Trạng thái sân</Text>
            <View style={styles.sectionContent}>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={fieldData.status}
                  style={styles.picker}
                  onValueChange={(itemValue) => updateFieldData('status', itemValue)}
                  dropdownIconColor="#6B7280"
                >
                  <Picker.Item label="Đang hoạt động" value="available" />
                  <Picker.Item label="Ngừng hoạt động" value="unavailable" />
                </Picker>
              </View>
            </View>
          </View>

          {/* Description */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Đặc điểm sân</Text>
            <View style={styles.sectionContent}>
              <TextInput
                style={[styles.input, styles.multilineInput]}
                value={fieldData.description}
                onChangeText={(text) => updateFieldData('description', text)}
                placeholder="Mô tả đặc điểm sân"
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={4}
              />
            </View>
          </View>

          {/* Sub Field Count */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Số lượng sân</Text>
            <View style={styles.sectionContent}>
              <View style={styles.countContainer}>
                <TouchableOpacity
                  style={styles.countButton}
                  onPress={() => {
                    const currentCount = parseInt(fieldData.subFieldCount || '1');
                    if (currentCount > 1) {
                      updateFieldData('subFieldCount', (currentCount - 1).toString());
                    }
                  }}
                  disabled={fieldData.subFieldCount === '1'}
                >
                  <Text style={[styles.countButtonText, fieldData.subFieldCount === '1' && styles.disabledText]}>−</Text>
                </TouchableOpacity>

                <TextInput
                  style={styles.countInput}
                  value={fieldData.subFieldCount}
                  onChangeText={(text) => {
                    // Chỉ cho phép nhập số và đảm bảo giá trị tối thiểu là 1
                    const numericValue = text.replace(/[^0-9]/g, '');
                    const finalValue = numericValue === '' ? '1' : numericValue;
                    updateFieldData('subFieldCount', finalValue);
                  }}
                  keyboardType="numeric"
                  maxLength={2}
                />

                <TouchableOpacity
                  style={styles.countButton}
                  onPress={() => {
                    const currentCount = parseInt(fieldData.subFieldCount || '1');
                    if (currentCount < 99) {
                      updateFieldData('subFieldCount', (currentCount + 1).toString());
                    }
                  }}
                  disabled={fieldData.subFieldCount === '99'}
                >
                  <Text style={[styles.countButtonText, fieldData.subFieldCount === '99' && styles.disabledText]}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Additional Services */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Dịch vụ thêm</Text>
            <View style={styles.sectionContent}>
              {/* Danh sách dịch vụ */}
              {fieldData.services.map((service, index) => (
                <View key={index} style={styles.serviceContainer}>
                  <TextInput
                    style={styles.serviceInput}
                    value={service.name}
                    onChangeText={(text) => updateService(index, 'name', text)}
                    placeholder="Tên dịch vụ"
                    placeholderTextColor="#9CA3AF"
                  />
                  <TextInput
                    style={[styles.serviceInput, styles.descriptionInput]}
                    value={service.description}
                    onChangeText={(text) => updateService(index, 'description', text)}
                    placeholder="Mô tả dịch vụ"
                    placeholderTextColor="#9CA3AF"
                    multiline
                  />
                  <TextInput
                    style={styles.serviceInput}
                    value={service.price}
                    onChangeText={(text) => updateService(index, 'price', text)}
                    placeholder="Giá dịch vụ (VNĐ)"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="numeric"
                  />
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeService(index)}
                  >
                    <Text style={styles.removeButtonText}>×</Text>
                  </TouchableOpacity>
                </View>
              ))}

              {/* Button thêm dịch vụ */}
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => addService()}
                activeOpacity={0.7}
              >
                <Text style={styles.addButtonText}>Thêm dịch vụ mới</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Time Slots and Prices */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Khung giờ & Giá sân</Text>

            <View style={styles.sectionContent}>
              <Text style={styles.label}>Giá mặc định (VNĐ/giờ)</Text>
              <TextInput
                style={styles.input}
                value={fieldData.price}
                onChangeText={(text) => updateDefaultPrice(text)}
                placeholder="Nhập giá (VD: 250000)"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
              />

              {/* Sync Prices Checkbox */}
              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => toggleSyncPrices(!syncPrices)}
                activeOpacity={0.7}
              >
                <View style={[styles.customCheckbox, syncPrices && styles.customCheckboxChecked]}>
                  {syncPrices && (
                    <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                  )}
                </View>
                <Text style={styles.checkboxLabel}>Đồng bộ giá sân giữa các khung giờ</Text>
              </TouchableOpacity>

              {/* Time Slots List */}
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#3B82F6" />
                  <Text style={styles.loadingText}>Đang tải danh sách khung giờ...</Text>
                </View>
              ) : (
                <View style={styles.timeSlotsContainer}>
                  {fieldData.timeSlots.map((slot) => (
                    <View key={slot.slot_id} style={styles.timeSlotWrapper}>
                      <View style={styles.timeSlotBox}>
                        {/* Checkbox và thông tin khung giờ */}
                        <TouchableOpacity
                          style={styles.timeSlotCheckbox}
                          onPress={() => toggleTimeSlotSelection(slot.slot_id)}
                          activeOpacity={0.7}
                        >
                          <View style={[
                            styles.customCheckbox,
                            slot.selected && styles.customCheckboxChecked
                          ]}>
                            {slot.selected && (
                              <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                            )}
                          </View>
                        </TouchableOpacity>

                        {/* Hiển thị khung giờ */}
                        <View style={[
                          styles.timeSlotRow,
                          slot.selected && styles.selectedTimeSlot
                        ]}>
                          <View style={styles.timeSlotInfo}>
                            <Text style={[
                              styles.timeSlotText,
                              slot.selected && styles.selectedTimeSlotText
                            ]}>
                              {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                            </Text>
                          </View>
                        </View>
                      </View>

                      {/* Phần nhập giá sân theo giờ */}
                      {slot.selected && (
                        <TextInput
                          style={styles.timeSlotPriceInput}
                          value={slot.price}
                          onChangeText={(text) => updateTimeSlotPrice(slot.slot_id, text)}
                          placeholder="Giá sân theo giờ"
                          placeholderTextColor="#9CA3AF"
                          keyboardType="numeric"
                          textAlign="left"
                        />
                      )}
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>

          {/* Image Upload */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Ảnh sân</Text>
            <View style={styles.sectionContent}>
              <TouchableOpacity
                style={styles.uploadButton}
                onPress={pickImage}
                activeOpacity={0.7}
              >
                <Text style={styles.uploadText}>Tải ảnh lên</Text>
              </TouchableOpacity>

              {/* Image List */}
              <FlatList
                data={fieldData.images}
                horizontal
                renderItem={({ item, index }) => (
                  <View style={styles.imageContainer}>
                    <Image source={{ uri: item }} style={styles.image} />
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => removeImage(index)}
                    >
                      <Text style={styles.removeButtonText}>×</Text>
                    </TouchableOpacity>
                  </View>
                )}
                keyExtractor={(item, index) => index.toString()}
                style={styles.imageList}
                showsHorizontalScrollIndicator={false}
                ListEmptyComponent={
                  <View style={styles.noImagesContainer}>
                    <Text style={styles.noImagesText}>Chưa có ảnh nào</Text>
                  </View>
                }
              />
            </View>
          </View>

          {/* Review and Rating Section */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Đánh giá từ khách hàng</Text>
            <View style={styles.sectionContent}>
              {/* Overall Rating Display */}
              <View style={styles.ratingSection}>
                <Text style={styles.ratingSubTitle}>Đánh giá tổng thể</Text>
                <View style={styles.overallRating}>
                  <Text style={styles.ratingScore}>
                    {typeof fieldAvgRating === 'number' ? fieldAvgRating.toFixed(1) : '0.0'}
                  </Text>
                  <View style={styles.starsContainer}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Ionicons
                        key={star}
                        name={fieldAvgRating >= star - 0.5 ? "star" : "star-outline"}
                        size={24}
                        color="#FFD700"
                        style={{ marginHorizontal: 2 }}
                      />
                    ))}
                  </View>
                  <Text style={styles.reviewCount}>({reviews.length} đánh giá)</Text>
                </View>
              </View>

              {/* Reviews List */}
              {reviews.length > 0 ? (
                <View style={styles.reviewsList}>
                  {(showAllReviews ? reviews : reviews.slice(0, 3)).map((item, index) => (
                    <View key={`${item.id || item.review_id || index}`} style={styles.reviewContainer}>
                      <View style={styles.reviewHeader}>
                        <View style={styles.userInfo}>
                          <Image
                            source={{
                              uri: item.avatar
                                ? `${AVATAR_BASE_URL}/${item.avatar}`
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
                                year: 'numeric'
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
                              style={{ marginHorizontal: 1 }}
                            />
                          ))}
                        </View>
                      </View>
                      <Text style={styles.reviewText}>{item.comment}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.emptyReviewContainer}>
                  <Ionicons name="chatbox-ellipses-outline" size={40} color="#CBD5E1" />
                  <Text style={styles.emptyReviewText}>Chưa có đánh giá nào</Text>
                </View>
              )}

              {/* Button to show/hide all reviews */}
              {reviews.length > 3 && (
                <TouchableOpacity 
                  style={styles.viewAllReviewsButton}
                  onPress={() => setShowAllReviews(!showAllReviews)}
                >
                  <Text style={styles.viewAllReviewsText}>
                    {showAllReviews ? "Ẩn bớt" : `Xem tất cả đánh giá (${reviews.length})`}
                  </Text>
                  <Ionicons 
                    name={showAllReviews ? "chevron-up" : "chevron-down"} 
                    size={16} 
                    color="#16A34A" 
                  />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* Update Button */}
        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.disabledButton]}
          onPress={handleUpdateField}
          disabled={isSubmitting}
          activeOpacity={0.7}
        >
          <Text style={styles.submitText}>
            {isSubmitting ? 'Đang xử lý...' : 'Cập nhật'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Modal */}
      <Modal
        animationType="fade"
        transparent
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View
            style={[
              styles.modalContent,
              modalSuccess ? styles.modalSuccess : styles.modalError,
            ]}
          >
            <Text style={styles.modalText}>{modalMessage}</Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setModalVisible(false)}
              activeOpacity={0.7}
            >
              <Text style={styles.modalButtonText}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingVertical: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 40,
  },
  backButton: {
    padding: 12,
    backgroundColor: '#3B82F6',
    borderRadius: 50,
    alignSelf: 'flex-start',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 32,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  formContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3B82F6',
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  sectionContent: {
    paddingHorizontal: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1E293B',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  multilineInput: {
    height: 120,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
    overflow: 'hidden',
    minHeight: 60,
  },
  picker: {
    fontSize: 16,
    color: '#1E293B',
    height: 60,
    paddingVertical: 10,
  },
  countContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  countButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  disabledText: {
    color: '#9CA3AF',
  },
  countInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1E293B',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    textAlign: 'center',
    width: 80,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  customCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  customCheckboxChecked: {
    backgroundColor: '#3B82F6',
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#1E293B',
    marginLeft: 8,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  timeSlotsContainer: {
    marginTop: 10,
    marginBottom: 20,
  },
  timeSlotWrapper: {
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  timeSlotBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 8,
  },
  timeSlotCheckbox: {
    marginRight: 10,
  },
  timeSlotRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 6,
  },
  selectedTimeSlot: {
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
  },
  timeSlotInfo: {
    flex: 1,
  },
  timeSlotText: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
  selectedTimeSlotText: {
    fontWeight: 'bold',
    color: '#3B82F6',
  },
  timeSlotPriceInput: {
    marginTop: 4,
    padding: 12,
    height: 48,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'left',
  },
  uploadButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  uploadText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  imageList: {
    marginBottom: 20,
  },
  imageContainer: {
    position: 'relative',
    marginRight: 12,
  },
  image: {
    width: 96,
    height: 96,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  noImagesContainer: {
    width: 96,
    height: 96,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImagesText: {
    color: '#9CA3AF',
    fontSize: 14,
    textAlign: 'center',
  },
  removeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#EF4444',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 24,
  },
  submitButton: {
    backgroundColor: '#10B981',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  disabledButton: {
    backgroundColor: '#6B7280',
    opacity: 0.7,
  },
  submitText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalContent: {
    width: '80%',
    maxWidth: 400,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  modalSuccess: {
    backgroundColor: '#D1FAE5',
  },
  modalError: {
    backgroundColor: '#FEE2E2',
  },
  modalText: {
    fontSize: 16,
    color: '#1E293B',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  serviceContainer: {
    backgroundColor: '#F8FAFC',
    padding: 16,
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    position: 'relative',
  },
  serviceInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1E293B',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  descriptionInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  addButton: {
    backgroundColor: '#3B82F6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  addButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  ratingSection: {
    marginVertical: 10,
  },
  ratingSubTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  overallRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
    backgroundColor: '#F8FAFC',
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  ratingScore: {
    fontSize: 28,
    fontWeight: 'bold',
    marginRight: 12,
    color: '#16A34A',
  },
  starsContainer: {
    flexDirection: 'row',
    marginRight: 10,
  },
  reviewCount: {
    color: '#64748B',
    fontSize: 14,
  },
  reviewsList: {
    marginTop: 16,
    marginBottom: 20,
  },
  reviewContainer: {
    backgroundColor: '#F8FAFC',
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#16A34A',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 8,
  },
  nameAndDate: {
    marginLeft: 8,
  },
  reviewerName: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#1E293B',
  },
  reviewDate: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  reviewRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewText: {
    fontSize: 14,
    color: '#334155',
    marginTop: 8,
    lineHeight: 20,
  },
  viewAllReviewsButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  viewAllReviewsText: {
    color: '#16A34A',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 4,
  },
  emptyReviewContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    padding: 30,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyReviewText: {
    fontSize: 16,
    color: '#94A3B8',
    marginTop: 8,
  },
});