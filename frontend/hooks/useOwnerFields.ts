import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { API_ENDPOINTS, FIELD_IMAGE_BASE_URL } from '../constants/apiConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Field {
    field_id: number;
    name: string;
    location: string;
    sport_type: string;
    price_per_hour: number;
    status: string;
    description: string;
    image_name: string | null;
    image_url?: string;
    rating?: number; // Thêm rating sau
}

interface UseOwnerFieldsResult {
    fields: Field[];
    loading: boolean;
    error: string | null;
    refreshFields: () => Promise<void>;
}

/**
 * Hook để lấy danh sách sân của chủ sân
 */
const useOwnerFields = (): UseOwnerFieldsResult => {
    const [fields, setFields] = useState<Field[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Hàm để tạo đường dẫn đầy đủ cho ảnh
    const getImageUrl = (imageName: string | null): string => {
        if (!imageName) {
            return 'https://via.placeholder.com/150'; // Placeholder cho ảnh nếu không có
        }
        return `${FIELD_IMAGE_BASE_URL}/${imageName}`;
    };

    // Hàm để lấy token từ AsyncStorage
    const getToken = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            return token;
        } catch (error) {
            console.error('Error getting token:', error);
            return null;
        }
    };

    // Hàm để lấy danh sách sân từ API
    const fetchFields = async () => {
        try {
            setLoading(true);
            setError(null);

            const token = await getToken();

            if (!token) {
                setError('Bạn chưa đăng nhập. Vui lòng đăng nhập để xem danh sách sân.');
                setLoading(false);
                return;
            }

            const response = await fetch(API_ENDPOINTS.GET_OWNER_FIELDS, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Không thể lấy danh sách sân.');
            }

            const data = await response.json();

            // Biến đổi dữ liệu để thêm đường dẫn ảnh và rating mặc định
            const formattedFields: Field[] = data.fields.map((field: Field) => ({
                ...field,
                image_url: getImageUrl(field.image_name),
                rating: field.rating || 5, // Rating mặc định là 5 sao nếu không có giá trị rating
                price_per_hour: field.price_per_hour || 0, // Đảm bảo có giá trị price_per_hour
            }));

            setFields(formattedFields);
        } catch (error) {
            console.error('Error fetching fields:', error);
            setError(error instanceof Error ? error.message : 'Đã có lỗi xảy ra khi lấy danh sách sân');

            // Hiển thị alert nếu có lỗi
            Alert.alert(
                'Lỗi',
                error instanceof Error ? error.message : 'Đã có lỗi xảy ra khi lấy danh sách sân',
                [{ text: 'OK' }]
            );
        } finally {
            setLoading(false);
        }
    };

    // Lấy danh sách sân khi component mount
    useEffect(() => {
        fetchFields();
    }, []);

    // Hàm để refresh danh sách sân
    const refreshFields = async () => {
        await fetchFields();
    };

    return { fields, loading, error, refreshFields };
};

export default useOwnerFields;