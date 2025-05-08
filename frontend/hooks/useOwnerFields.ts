import { useState, useEffect } from 'react';
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

            // Xử lý tất cả các trạng thái phản hồi
            let errorData;

            try {
                errorData = await response.json();
            } catch (e) {
                // Nếu không thể parse JSON, tiếp tục với errorData rỗng
                errorData = {};
            }

            // Kiểm tra xem response có chứa thông báo lỗi về owner không
            const responseText = JSON.stringify(errorData).toLowerCase();

            if (!response.ok) {
                // Xử lý trường hợp "User is not an owner" đặc biệt với bất kỳ status code nào
                if (
                    responseText.includes("not an owner") ||
                    responseText.includes("not owner") ||
                    responseText.includes("không phải chủ sân") ||
                    responseText.includes("user is not an") ||
                    response.status === 403
                ) {
                    setFields([]);
                    setLoading(false);
                    return;
                }

                throw new Error(errorData.message || 'Không thể lấy danh sách sân.');
            }

            // Kiểm tra xem có thuộc tính fields trong data không
            if (!errorData.fields && Array.isArray(errorData)) {
                // Nếu response trả về mảng trực tiếp
                const formattedFields = errorData.map((field: Field) => ({
                    ...field,
                    image_url: getImageUrl(field.image_name),
                    rating: field.rating || 0,
                    price_per_hour: field.price_per_hour || 0,
                }));
                setFields(formattedFields);
            } else if (errorData.fields && Array.isArray(errorData.fields)) {
                // Nếu response trả về đối tượng có thuộc tính fields
                const formattedFields = errorData.fields.map((field: Field) => ({
                    ...field,
                    image_url: getImageUrl(field.image_name),
                    rating: field.rating || 0,
                    price_per_hour: field.price_per_hour || 0,
                }));
                setFields(formattedFields);
            } else {
                setFields([]);
            }
        } catch (error) {
            if (error instanceof Error &&
                (error.message.toLowerCase().includes('owner') ||
                    error.message.toLowerCase().includes('chủ sân'))) {
                setFields([]);
            } else {
                setError(error instanceof Error ? error.message : 'Đã có lỗi xảy ra khi lấy danh sách sân');
            }
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