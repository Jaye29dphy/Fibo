import { useState, useEffect } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';
import { API_ENDPOINTS } from '../constants/apiConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';

// Define service interface
interface Service {
  name: string;
  price: string;
  description: string;
}

// Define time slot interface
interface TimeSlot {
  slot_id: number;
  start_time: string;
  end_time: string;
  price: string; // Giá cho khung giờ này
  selected: boolean; // Trạng thái chọn/không chọn
}

interface FieldData {
  name: string;
  location: string;
  type: string;
  description: string;
  price: string;
  subFieldCount: string;
  services: Service[];
  timeSlots: TimeSlot[]; // Mảng khung giờ và giá tương ứng
  images: string[];
}

interface RegisterResponse {
  success: boolean;
  message: string;
}

const useRegister = () => {
  const [fieldData, setFieldData] = useState<FieldData>({
    name: '',
    location: '',
    type: 'football',
    description: '',
    price: '',
    subFieldCount: '1',
    services: [],
    timeSlots: [],
    images: [],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalSuccess, setModalSuccess] = useState(true);
  const [loading, setLoading] = useState(false);
  const [syncPrices, setSyncPrices] = useState(true); // Trạng thái đồng bộ giá

  // Lấy danh sách khung giờ khi component được mount
  useEffect(() => {
    fetchTimeSlots();
  }, []);

  // Hàm lấy danh sách khung giờ từ API
  const fetchTimeSlots = async () => {
    setLoading(true);
    try {
      // Tạo dữ liệu mẫu từ 05:00 đến 23:00
      const mockTimeSlots: TimeSlot[] = [];
      for (let i = 5; i <= 23; i++) {
        mockTimeSlots.push({
          slot_id: i - 4,
          start_time: `${i.toString().padStart(2, '0')}:00:00`,
          end_time: `${(i + 1).toString().padStart(2, '0')}:00:00`,
          price: '',
          selected: true // Mặc định là được chọn
        });
      }

      // Thêm khung giờ 00:00-01:00 và 01:00-02:00 - sẽ xếp xuống cuối cùng sau khi sắp xếp
      mockTimeSlots.push({
        slot_id: 20,
        start_time: '00:00:00',
        end_time: '01:00:00',
        price: '',
        selected: true
      });
      mockTimeSlots.push({
        slot_id: 21,
        start_time: '01:00:00',
        end_time: '02:00:00',
        price: '',
        selected: true
      });

      // Sắp xếp lại các khung giờ, đưa 00:00-01:00 và 01:00-02:00 xuống cuối
      const sortedTimeSlots = [...mockTimeSlots].sort((a, b) => {
        const timeA = parseInt(a.start_time.split(':')[0]);
        const timeB = parseInt(b.start_time.split(':')[0]);

        // Đặc biệt xử lý khung giờ 00 và 01 ra cuối
        if (timeA === 0 || timeA === 1) return 1;
        if (timeB === 0 || timeB === 1) return -1;
        return timeA - timeB;
      });

      setFieldData(prev => ({
        ...prev,
        timeSlots: sortedTimeSlots
      }));

      // TODO: Khi API sẵn sàng, thay thế bằng code dưới đây
      /*
      const response = await fetch(API_ENDPOINTS.GET_TIME_SLOTS);
      const data = await response.json();
      
      if (data && Array.isArray(data)) {
        const timeSlots = data.map(slot => ({
          ...slot,
          price: '',
          selected: true // Mặc định là được chọn
        }));
        
        setFieldData(prev => ({
          ...prev,
          timeSlots
        }));
      }
      */
    } catch (error) {
      console.error('Lỗi khi lấy danh sách khung giờ:', error);
    } finally {
      setLoading(false);
    }
  };

  // Cập nhật giá cho một khung giờ cụ thể
  const updateTimeSlotPrice = (slotId: number, price: string) => {
    if (syncPrices) {
      // Nếu đang đồng bộ, tự động tắt đồng bộ khi thay đổi giá riêng
      setSyncPrices(false);
    }

    setFieldData(prev => ({
      ...prev,
      timeSlots: prev.timeSlots.map(slot =>
        slot.slot_id === slotId ? { ...slot, price } : slot
      )
    }));
  };

  // Thay đổi trạng thái chọn của một khung giờ
  const toggleTimeSlotSelection = (slotId: number) => {
    setFieldData(prev => ({
      ...prev,
      timeSlots: prev.timeSlots.map(slot =>
        slot.slot_id === slotId ? { ...slot, selected: !slot.selected } : slot
      )
    }));
  };

  // Đồng bộ giá của tất cả khung giờ được chọn
  const syncAllPrices = (price: string) => {
    setFieldData(prev => ({
      ...prev,
      timeSlots: prev.timeSlots.map(slot =>
        slot.selected ? { ...slot, price } : slot
      )
    }));
  };

  // Cập nhật giá mặc định và đồng bộ nếu cần
  const updateDefaultPrice = (price: string) => {
    setFieldData(prev => ({
      ...prev,
      price
    }));

    // Nếu chế độ đồng bộ đang bật, cập nhật giá tất cả khung giờ được chọn
    if (syncPrices) {
      syncAllPrices(price);
    }
  };

  // Thay đổi trạng thái đồng bộ
  const toggleSyncPrices = (value: boolean) => {
    setSyncPrices(value);

    // Nếu bật đồng bộ, tự động đồng bộ giá
    if (value && fieldData.price) {
      syncAllPrices(fieldData.price);
    }
  };

  const updateFieldData = (field: keyof FieldData, value: string) => {
    setFieldData((prev) => ({ ...prev, [field]: value }));
  };

  // Thêm dịch vụ mới
  const addService = () => {
    setFieldData((prev) => ({
      ...prev,
      services: [...prev.services, { name: '', price: '', description: '' }]
    }));
  };

  // Cập nhật thông tin dịch vụ
  const updateService = (index: number, field: keyof Service, value: string) => {
    setFieldData((prev) => {
      const updatedServices = [...prev.services];
      updatedServices[index] = { ...updatedServices[index], [field]: value };
      return { ...prev, services: updatedServices };
    });
  };

  // Xóa dịch vụ
  const removeService = (index: number) => {
    setFieldData((prev) => ({
      ...prev,
      services: prev.services.filter((_, i) => i !== index)
    }));
  };

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Quyền truy cập bị từ chối', 'Cần cấp quyền truy cập thư viện ảnh để chọn ảnh.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled && result.assets[0].uri) {
      setFieldData((prev) => ({
        ...prev,
        images: [...prev.images, result.assets[0].uri],
      }));
    }
  };

  const removeImage = (index: number) => {
    setFieldData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const submitField = async (onSuccess: () => void): Promise<RegisterResponse> => {
    setIsSubmitting(true);
    console.log('Starting field submission process...');

    // Kiểm tra kết nối mạng cơ bản
    try {
      console.log('Checking basic network connectivity...');
      await fetch('https://www.google.com', { method: 'HEAD', mode: 'no-cors' });
      console.log('Basic connectivity test passed');
    } catch (error) {
      console.error('Basic connectivity test failed:', error);
      setModalMessage('Không thể kết nối mạng. Vui lòng kiểm tra kết nối internet.');
      setModalSuccess(false);
      setModalVisible(true);
      setIsSubmitting(false);
      return { success: false, message: 'Lỗi kết nối mạng.' };
    }

    const formData = new FormData();
    formData.append('name', fieldData.name);
    formData.append('location', fieldData.location);
    formData.append('type', fieldData.type);
    formData.append('description', fieldData.description);
    formData.append('price', fieldData.price);
    formData.append('subFieldCount', fieldData.subFieldCount);

    // Thêm các dịch vụ vào formData
    formData.append('services', JSON.stringify(fieldData.services));

    // Thêm các khung giờ được chọn và giá tương ứng vào formData
    const selectedTimeSlots = fieldData.timeSlots
      .filter(slot => slot.selected)
      .map(({ slot_id, start_time, end_time, price }) => ({
        slot_id, start_time, end_time, price: price || fieldData.price
      }));

    formData.append('timeSlots', JSON.stringify(selectedTimeSlots));

    // Cách xử lý hình ảnh tương thích với React Native
    for (const [index, imageUri] of fieldData.images.entries()) {
      try {
        // Lấy thông tin file để xác định tên và loại
        const fileInfo = await FileSystem.getInfoAsync(imageUri);
        console.log(`Processing image ${index}:`, fileInfo);

        // Lấy tên file từ URI
        const filename = imageUri.split('/').pop() || `image_${index}.jpg`;
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';

        console.log(`Adding image to FormData: ${filename}, type: ${type}`);

        // React Native FormData cần format đặc biệt này
        // @ts-ignore - FormData trong React Native khác với FormData web tiêu chuẩn
        formData.append('images', {
          uri: imageUri,
          name: filename,
          type
        });
      } catch (error) {
        console.error(`Error processing image ${index}:`, error);
      }
    }

    // Lấy token xác thực
    const token = await AsyncStorage.getItem('token');
    console.log('Token available:', !!token);

    console.log('Sending request to:', API_ENDPOINTS.REGISTER_FIELD);

    try {
      const response = await fetch(API_ENDPOINTS.REGISTER_FIELD, {
        method: 'POST',
        headers: {
          // Không đặt Content-Type khi gửi multipart/form-data
          // FormData sẽ tự động thiết lập boundary
          'Accept': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: formData,
      });

      console.log('Response status:', response.status);

      if (response.ok) {
        setModalMessage('Đăng ký sân thành công!');
        setModalSuccess(true);
        setModalVisible(true);
        setTimeout(() => {
          setModalVisible(false);
          onSuccess();
        }, 2000);
        return { success: true, message: 'Đăng ký sân thành công!' };
      } else {
        let errorMessage = 'Đăng ký sân thất bại. Vui lòng thử lại.';
        try {
          const errorData = await response.json();
          console.log('Error response:', errorData);
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          console.error('Error parsing response:', e);
        }

        setModalMessage(errorMessage);
        setModalSuccess(false);
        setModalVisible(true);
        return { success: false, message: errorMessage };
      }
    } catch (error: any) {
      console.error('Network error in submitField:', error);
      setModalMessage('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.');
      setModalSuccess(false);
      setModalVisible(true);
      return { success: false, message: 'Lỗi kết nối.' };
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    fieldData,
    loading,
    syncPrices,
    updateFieldData,
    updateDefaultPrice,
    updateTimeSlotPrice,
    toggleTimeSlotSelection,
    toggleSyncPrices,
    pickImage,
    removeImage,
    addService,
    updateService,
    removeService,
    submitField,
    isSubmitting,
    modalVisible,
    setModalVisible,
    modalMessage,
    modalSuccess,
  };
};

export default useRegister;