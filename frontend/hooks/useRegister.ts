import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';
import { API_ENDPOINTS } from '../constants/apiConfig';

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

    const formData = new FormData();
    formData.append('name', fieldData.name);
    formData.append('location', fieldData.location);
    formData.append('type', fieldData.type);
    formData.append('description', fieldData.description);
    formData.append('price', fieldData.price);

    // Chuyển đổi URI ảnh thành Blob để gửi dưới dạng file
    for (const [index, imageUri] of fieldData.images.entries()) {
      // Nếu URI là base64, chuyển đổi thành Blob
      if (imageUri.startsWith('data:image')) {
        const base64Data = imageUri.split(',')[1];
        const byteString = atob(base64Data);
        const arrayBuffer = new ArrayBuffer(byteString.length);
        const uint8Array = new Uint8Array(arrayBuffer);
        for (let i = 0; i < byteString.length; i++) {
          uint8Array[i] = byteString.charCodeAt(i);
        }
        const blob = new Blob([uint8Array], { type: 'image/jpeg' });
        formData.append('images', blob, `image_${index}.jpg`);
      } else {
        // Nếu URI là file (ví dụ trên thiết bị), chuyển thành Blob
        const response = await fetch(imageUri);
        const blob = await response.blob();
        formData.append('images', blob, `image_${index}.jpg`);
      }
    }

    console.log('Sending formData:', {
      name: fieldData.name,
      location: fieldData.location,
      type: fieldData.type,
      description: fieldData.description,
      price: fieldData.price,
      images: fieldData.images,
    });

    try {
      const response = await fetch(API_ENDPOINTS.REGISTER_FIELD, {
        method: 'POST',
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
        const errorData = await response.json();
        console.log('Error response:', errorData);
        setModalMessage(errorData.message || 'Đăng ký sân thất bại. Vui lòng thử lại.');
        setModalSuccess(false);
        setModalVisible(true);
        return { success: false, message: errorData.message || 'Đăng ký sân thất bại.' };
      }
    } catch (error: any) {
      console.error('Error in submitField:', error.message);
      setModalMessage('Đã có lỗi xảy ra. Vui lòng thử lại.');
      setModalSuccess(false);
      setModalVisible(true);
      return { success: false, message: 'Đã có lỗi xảy ra.' };
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