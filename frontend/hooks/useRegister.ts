import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';
import { API_ENDPOINTS } from '../constants/apiConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';

interface FieldData {
  name: string;
  location: string;
  type: string;
  description: string;
  price: string;
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
    images: [],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalSuccess, setModalSuccess] = useState(true);

  const updateFieldData = (field: keyof FieldData, value: string) => {
    setFieldData((prev) => ({ ...prev, [field]: value }));
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
    updateFieldData,
    pickImage,
    removeImage,
    submitField,
    isSubmitting,
    modalVisible,
    setModalVisible,
    modalMessage,
    modalSuccess,
  };
};

export default useRegister;