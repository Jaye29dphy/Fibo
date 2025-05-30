import { useState, useEffect } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';
import { API_ENDPOINTS, API_URL } from '../constants/apiConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';

// Định nghĩa các kiểu dữ liệu cần thiết
interface FieldImage {
    image_id: number;
    image_name: string;
    image_type: string;
    upload_date: string;
}

interface SubField {
    sub_field_id: number;
    name: string;
    status: string;
}

interface Service {
    service_id: number;
    name: string;
    price: number;
    description: string;
    status: string;
}

interface TimeSlot {
    slot_id: number;
    start_time: string;
    end_time: string;
    price: number;
    selected: boolean;
}

interface FieldData {
    field_id: number;
    name: string;
    location: string;
    sport_type: string;
    price_per_hour: number | string;
    status: string;
    description: string;
    rating?: number;
    images: FieldImage[];
    subFields: SubField[];
    services: Service[];
    timeSlots: TimeSlot[];
}

interface UseUpdateFieldResult {
    fieldData: FieldData | null;
    originalFieldData: FieldData | null;
    loading: boolean;
    saving: boolean;
    imageUploading: boolean; // Add new state for image uploads
    error: string | null;
    syncPrices: boolean;
    formData: {
        name: string;
        location: string;
        sport_type: string;
        price_per_hour: string;
        status: string;
        description: string;
    };
    setFormData: React.Dispatch<React.SetStateAction<{
        name: string;
        location: string;
        sport_type: string;
        price_per_hour: string;
        status: string;
        description: string;
    }>>; subFields: SubField[];
    services: Service[];
    timeSlots: TimeSlot[];
    newlyAddedSubFieldIds: number[]; // Added to track new subfields
    deletedSubFields: number[]; // Track temporarily deleted subfields
    deletedServices: number[]; // Track temporarily deleted services
    updateTimeSlotPrice: (slotId: number, price: string) => void;
    toggleTimeSlotSelection: (slotId: number, selected: boolean) => void; toggleSyncPrices: () => void;
    handlePickImage: () => Promise<void>;
    handleRemoveImage: (imageId: number) => Promise<void>;
    handleAddService: () => void;
    handleUpdateService: (serviceId: number, field: string, value: string | number) => void; handleToggleServiceStatus: (serviceId: number, currentStatus: string) => void; handleAddSubField: () => void;
    handleRemoveSubField: (subFieldId: number) => void;
    handleToggleSubFieldStatus: (subFieldId: number, currentStatus: string) => void;
    handleRemoveService: (serviceId: number) => void;
    updateField: () => Promise<void>; resetForm: () => Promise<void>;
    fetchFieldData: () => Promise<void>;
    clearImageCache: () => Promise<void>; // Thêm hàm xóa cache
}

const useUpdateField = (fieldId: string | null): UseUpdateFieldResult => {
    const [fieldData, setFieldData] = useState<FieldData | null>(null);
    const [originalFieldData, setOriginalFieldData] = useState<FieldData | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [saving, setSaving] = useState<boolean>(false);
    const [imageUploading, setImageUploading] = useState<boolean>(false); // Add new state
    const [error, setError] = useState<string | null>(null);
    const [syncPrices, setSyncPrices] = useState<boolean>(false);

    // Trạng thái form
    const [formData, setFormData] = useState({
        name: '',
        location: '',
        sport_type: '',
        price_per_hour: '',
        status: '',
        description: ''
    });

    // Các trạng thái chi tiết
    const [subFields, setSubFields] = useState<SubField[]>([]);
    const [services, setServices] = useState<Service[]>([]);
    const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
    const [newlyAddedSubFieldIds, setNewlyAddedSubFieldIds] = useState<number[]>([]); // Track newly added subfields
    const [modifiedServices, setModifiedServices] = useState<{ [key: number]: boolean }>({});  // Track modified services
    const [newServices, setNewServices] = useState<number[]>([]); // Track new services with temp IDs

    // Theo dõi các thay đổi cho khung giờ
    const [modifiedTimeSlots, setModifiedTimeSlots] = useState<{ [key: number]: boolean }>({});

    // Theo dõi thay đổi cho ảnh
    const [imagesToUpload, setImagesToUpload] = useState<Array<{ uri: string, name: string, type: string }>>([]);
    const [imagesToDelete, setImagesToDelete] = useState<number[]>([]);
    const [mainImageId, setMainImageId] = useState<number | null>(null);
    const [imageOrderChanged, setImageOrderChanged] = useState<boolean>(false);    // Theo dõi thay đổi trạng thái sân con
    const [modifiedSubFields, setModifiedSubFields] = useState<{ [key: number]: boolean }>({});

    // Theo dõi các mục đã bị xóa tạm thời
    const [deletedSubFields, setDeletedSubFields] = useState<number[]>([]);
    const [deletedServices, setDeletedServices] = useState<number[]>([]);    // Bật/tắt đồng bộ giá
    const toggleSyncPrices = () => {
        setSyncPrices(!syncPrices);

        // Đồng bộ giá cho tất cả khung giờ nếu bật
        if (!syncPrices && formData.price_per_hour) {
            const price = formData.price_per_hour;
            setTimeSlots(prev => prev.map(slot => ({
                ...slot,
                price: Number(price)
            })));

            // Đánh dấu có thay đổi time slots (sử dụng key đặc biệt để báo hiệu cần refresh toàn bộ)
            setModifiedTimeSlots(prev => ({ ...prev, '__refresh_all__': true }));
        }
    };// Cập nhật giá cho khung giờ cụ thể (chỉ cập nhật state local)
    const updateTimeSlotPrice = (slotId: number, price: string) => {
        try {
            if (isNaN(Number(price))) {
                Alert.alert('Lỗi', 'Giá phải là số');
                return;
            }

            const numericPrice = Number(price);

            // Chỉ cập nhật state local
            setTimeSlots(prev => prev.map(slot =>
                slot.slot_id === slotId
                    ? { ...slot, price: numericPrice }
                    : slot
            ));

            // Đánh dấu có thay đổi time slots (sử dụng key đặc biệt để báo hiệu cần refresh toàn bộ)
            setModifiedTimeSlots(prev => ({ ...prev, '__refresh_all__': true, [slotId]: true }));

        } catch (error) {
            console.error('Error updating time slot price:', error);
            Alert.alert('Lỗi', 'Đã xảy ra lỗi khi cập nhật giá khung giờ');
        }
    };    // Bật/tắt chọn khung giờ (chỉ cập nhật state local)
    const toggleTimeSlotSelection = (slotId: number, selected: boolean) => {
        try {
            // Chỉ cập nhật state local
            setTimeSlots(prev => prev.map(slot =>
                slot.slot_id === slotId
                    ? { ...slot, selected: !selected }
                    : slot
            ));

            // Đánh dấu có thay đổi time slots (sử dụng key đặc biệt để báo hiệu cần refresh toàn bộ)
            setModifiedTimeSlots(prev => ({ ...prev, '__refresh_all__': true, [slotId]: true }));

        } catch (error) {
            console.error('Error toggling time slot selection:', error);
            Alert.alert('Lỗi', 'Đã xảy ra lỗi khi cập nhật trạng thái khung giờ');
        }
    };// Thêm dịch vụ (chỉ thêm vào state local, chưa gửi lên server)
    const handleAddService = () => {
        // Tạo service mới với ID tạm thời âm (để phân biệt các service mới)
        const tempId = Math.floor(Math.random() * -1000) - 1; // Tạo ID âm ngẫu nhiên

        const newService: Service = {
            service_id: tempId,
            name: '',
            description: '',
            price: 0,
            status: 'available'
        };

        setServices(prev => [...prev, newService]);
        setNewServices(prev => [...prev, tempId]); // Thêm vào danh sách dịch vụ mới
    };// Cập nhật thông tin dịch vụ (chỉ cập nhật state local, chưa gửi lên server)
    const handleUpdateService = (serviceId: number, field: string, value: string | number) => {
        // Chỉ cập nhật state local
        setServices(prev => prev.map(s =>
            s.service_id === serviceId ? { ...s, [field]: value } : s
        ));

        // Đánh dấu service là đã được sửa đổi
        setModifiedServices(prev => ({ ...prev, [serviceId]: true }));
    };    // Bật/tắt trạng thái dịch vụ (chỉ cập nhật state local, chưa gửi lên server)
    const handleToggleServiceStatus = (serviceId: number, currentStatus: string) => {
        const newStatus = currentStatus === 'available' ? 'unavailable' : 'available';

        // Đánh dấu dịch vụ đã được chỉnh sửa (nếu không phải dịch vụ mới)
        if (serviceId > 0) {
            setModifiedServices(prev => ({ ...prev, [serviceId]: true }));
        }

        // Chỉ cập nhật state local
        setServices(prev => prev.map(service =>
            service.service_id === serviceId
                ? { ...service, status: newStatus }
                : service
        ));
    };// Thêm sân con (chỉ thêm vào state cục bộ)
    const handleAddSubField = () => {
        if (subFields.length >= 10) {
            Alert.alert('Thông báo', 'Không thể tạo thêm sân con. Tối đa 10 sân con.');
            return;
        }

        try {
            // Tạo ID tạm thời cho sân con mới
            const tempId = Math.floor(Math.random() * -1000) - 1; // Tạo ID âm ngẫu nhiên

            console.log(`[Local] Adding temporary subfield with ID: ${tempId}`);

            // Tạo sân con mới với ID tạm thời
            const newSubField: SubField = {
                sub_field_id: tempId,
                name: `Sân ${subFields.length + 1}`,
                status: 'available'
            };

            // Thêm sân con mới vào state
            setSubFields(prev => [...prev, newSubField]);
            // Thêm ID tạm thời vào danh sách ID mới để theo dõi
            setNewlyAddedSubFieldIds(prev => [...prev, tempId]);
        } catch (error) {
            console.error('Error adding sub-field to local state:', error);
            Alert.alert('Lỗi', 'Đã xảy ra lỗi khi thêm sân con');
        }
    };    // Chuyển đổi trạng thái sân con (chỉ cập nhật state local)
    const handleToggleSubFieldStatus = (subFieldId: number, currentStatus: string) => {
        try {
            const newStatus = currentStatus === 'available' ? 'unavailable' : 'available';

            console.log(`[Local] Updating subfield ${subFieldId} status to ${newStatus}`);

            // Chỉ cập nhật state local
            setSubFields(prev => prev.map(subField =>
                subField.sub_field_id === subFieldId
                    ? { ...subField, status: newStatus }
                    : subField
            ));

            // Đánh dấu subfield này đã được sửa đổi
            setModifiedSubFields(prev => ({ ...prev, [subFieldId]: true }));
        } catch (error) {
            console.error('Error updating sub-field status:', error);
            Alert.alert('Lỗi', 'Đã xảy ra lỗi khi cập nhật trạng thái sân con');
        }
    };

    // Xóa sân con tạm thời (chỉ ẩn khỏi UI, có thể khôi phục)
    const handleRemoveSubField = (subFieldId: number) => {
        try {
            console.log(`[Local] Temporarily removing subfield ${subFieldId}`);

            // Thêm vào danh sách đã xóa tạm thời
            setDeletedSubFields(prev => [...prev, subFieldId]);

        } catch (error) {
            console.error('Error removing sub-field:', error);
            Alert.alert('Lỗi', 'Đã xảy ra lỗi khi xóa sân con');
        }
    };

    // Xóa dịch vụ tạm thời (chỉ ẩn khỏi UI, có thể khôi phục)
    const handleRemoveService = (serviceId: number) => {
        try {
            console.log(`[Local] Temporarily removing service ${serviceId}`);

            // Thêm vào danh sách đã xóa tạm thời
            setDeletedServices(prev => [...prev, serviceId]);

        } catch (error) {
            console.error('Error removing service:', error);
            Alert.alert('Lỗi', 'Đã xảy ra lỗi khi xóa dịch vụ');
        }
    };    // Chọn và tải lên ảnh với logic thay thế đơn giản
    const handlePickImage = async () => {
        try {
            console.log('Starting image selection process');

            // Yêu cầu quyền truy cập thư viện ảnh
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Quyền truy cập bị từ chối', 'Cần cấp quyền truy cập thư viện ảnh để chọn ảnh.');
                return;
            }

            // Kiểm tra xem có ảnh cũ không (ảnh có ID dương - đã tồn tại trên server)
            const existingImages = fieldData?.images?.filter(img => img.image_id > 0) || [];
            const newImages = fieldData?.images?.filter(img => img.image_id < 0) || [];

            // Nếu có ảnh cũ và chưa có ảnh mới nào, hiển thị dialog xác nhận
            if (existingImages.length > 0 && newImages.length === 0) {
                Alert.alert(
                    'Thay thế ảnh',
                    'Bạn có muốn thay thế tất cả ảnh hiện có bằng ảnh mới không? Tất cả ảnh cũ sẽ bị xóa.',
                    [
                        { text: 'Hủy', style: 'cancel' },
                        {
                            text: 'Thay thế',
                            style: 'destructive',
                            onPress: () => processImagePicker()
                        }
                    ]
                );
            } else {
                // Nếu không có ảnh cũ hoặc đã có ảnh mới, tiến hành chọn ảnh trực tiếp
                processImagePicker();
            }
        } catch (error) {
            console.error('Error in handlePickImage:', error);
            Alert.alert('Lỗi', 'Đã xảy ra lỗi khi xử lý yêu cầu');
        }
    };

    // Function xử lý việc chọn và thay thế ảnh
    const processImagePicker = async () => {
        try {
            setImageUploading(true);

            // Mở bộ chọn ảnh với chất lượng giảm để nén ảnh và cho phép crop
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true, // Bật tính năng chỉnh sửa
                quality: 0.7, // Giảm chất lượng xuống 70% để giảm kích thước
            });

            console.log('Image picker result:', result.canceled ? 'Canceled' : 'Selected image');

            if (!result.canceled && result.assets && result.assets[0]) {
                // Log image details
                console.log('Selected image details:', {
                    width: result.assets[0].width,
                    height: result.assets[0].height,
                    uri: result.assets[0].uri.substring(0, 50) + '...',
                    type: result.assets[0].type,
                    fileSize: result.assets[0].fileSize ? `${(result.assets[0].fileSize / 1024).toFixed(2)} KB` : 'unknown',
                });

                const uri = result.assets[0].uri;
                const filename = uri.split('/').pop() || `image_${Date.now()}.jpg`;
                const match = /\.(\w+)$/.exec(filename);
                const type = match ? `image/${match[1]}` : 'image/jpeg';

                // Tạo object ảnh mới để upload
                const imageToUpload = {
                    uri: uri,
                    name: filename,
                    type: type
                };                // Đánh dấu tất cả ảnh cũ (có ID dương) để xóa (chỉ lần đầu tiên khi chưa có ảnh mới nào)
                const currentNewImages = fieldData?.images?.filter(img => img.image_id < 0) || [];

                if (currentNewImages.length === 0) {
                    // Chỉ đánh dấu ảnh cũ để xóa khi đây là ảnh mới đầu tiên
                    const existingImages = fieldData?.images?.filter(img => img.image_id > 0) || [];
                    const existingImageIds = existingImages.map(img => img.image_id);

                    console.log('Marking existing images for deletion:', existingImageIds);
                    setImagesToDelete(existingImageIds);
                }

                // Thêm ảnh mới vào danh sách upload (không reset, chỉ thêm)
                setImagesToUpload(prev => [...prev, imageToUpload]);// Tạo ảnh tạm thời để hiển thị trong UI
                const tempImageId = -Date.now();
                const tempImage: FieldImage = {
                    image_id: tempImageId,
                    image_name: uri, // Use local URI for display
                    image_type: fieldData?.images?.length === 0 || fieldData?.images?.every(img => img.image_id > 0) ? 'main' : 'additional', // Ảnh đầu tiên sẽ là main
                    upload_date: new Date().toISOString()
                };

                // Cập nhật UI để hiển thị ảnh mới cùng với ảnh đã chọn trước đó (nhưng không hiển thị ảnh cũ)
                if (fieldData) {
                    const currentNewImages = fieldData.images?.filter(img => img.image_id < 0) || [];
                    const updatedImages = [...currentNewImages, tempImage];

                    // Nếu đây là ảnh đầu tiên được chọn, set làm main
                    if (currentNewImages.length === 0) {
                        tempImage.image_type = 'main';
                    }

                    setFieldData({
                        ...fieldData,
                        images: updatedImages
                    });
                }

                // Reset các state liên quan đến ảnh cũ
                setMainImageId(null);
                setImageOrderChanged(false);

                Alert.alert('Thành công', 'Đã thêm ảnh mới. Tất cả ảnh cũ sẽ được thay thế khi bạn nhấn "Cập nhật"');
            }
        } catch (error) {
            console.error('Error picking image:', error);
            Alert.alert('Lỗi', 'Đã xảy ra lỗi khi chọn ảnh. Vui lòng thử lại sau.');
        } finally {
            setImageUploading(false);
        }
    };    // Xóa ảnh (chỉ hỗ trợ xóa ảnh mới chưa upload)
    const handleRemoveImage = async (imageId: number) => {
        try {
            console.log('Removing image - simplified version');

            if (!fieldData) return;

            // Chỉ cho phép xóa ảnh mới (có ID âm - chưa upload)
            if (imageId < 0) {
                // Tìm ảnh trong fieldData
                const imageToRemove = fieldData.images.find(img => img.image_id === imageId);
                if (!imageToRemove) {
                    console.error('Image not found in collection');
                    return;
                }

                Alert.alert(
                    'Xác nhận',
                    'Bạn có chắc muốn xóa ảnh này không?',
                    [
                        { text: 'Hủy', style: 'cancel' },
                        {
                            text: 'Xóa',
                            style: 'destructive',
                            onPress: () => {
                                try {
                                    // Xóa khỏi danh sách upload
                                    setImagesToUpload(prev =>
                                        prev.filter(img => img.uri !== imageToRemove.image_name)
                                    );

                                    // Xóa khỏi UI
                                    const updatedImages = fieldData.images.filter(img => img.image_id !== imageId);

                                    // Nếu xóa ảnh main và còn ảnh khác, đặt ảnh đầu tiên làm main
                                    if (imageToRemove.image_type === 'main' && updatedImages.length > 0) {
                                        updatedImages[0].image_type = 'main';
                                    }

                                    setFieldData({
                                        ...fieldData,
                                        images: updatedImages
                                    });

                                    Alert.alert('Thành công', 'Đã xóa ảnh');
                                } catch (error) {
                                    console.error('Error removing image from local state:', error);
                                    Alert.alert('Lỗi', 'Đã xảy ra lỗi khi xóa ảnh');
                                }
                            }
                        }
                    ]
                );
            } else {
                // Không cho phép xóa ảnh cũ riêng lẻ - chỉ có thể thay thế toàn bộ
                Alert.alert(
                    'Thông báo',
                    'Để thay đổi ảnh, vui lòng sử dụng nút "Chọn ảnh mới" để thay thế toàn bộ ảnh hiện có.'
                );
            }
        } catch (error) {
            console.error('Error in handleRemoveImage:', error);
            Alert.alert('Lỗi', 'Đã xảy ra lỗi khi xử lý yêu cầu');
        }
    };// Đặt ảnh làm ảnh chính (chỉ cập nhật state cục bộ)
    const handleSetMainImage = async (imageId: number) => {
        if (!fieldData) return;

        try {
            console.log(`[Local] Setting image ${imageId} as main image`);

            // Tìm ảnh được chọn
            const selectedImage = fieldData.images.find(img => img.image_id === imageId);
            if (selectedImage) {
                // Tìm ảnh hiện tại đang làm ảnh chính
                const currentMainImage = fieldData.images.find(img => img.image_type === 'main');

                // Cập nhật state ảnh - giữ nguyên thứ tự của các ảnh
                const updatedImages = fieldData.images.map(img => {
                    if (img.image_id === imageId) {
                        return { ...img, image_type: 'main' };
                    } else if (img.image_type === 'main') {
                        return { ...img, image_type: 'sub' };
                    } else {
                        return img;
                    }
                });

                setFieldData({
                    ...fieldData,
                    images: updatedImages
                });

                // Lưu ID của ảnh chính để cập nhật khi lưu
                setMainImageId(imageId);

                Alert.alert('Thành công', 'Đã đánh dấu ảnh chính. Các thay đổi sẽ được lưu khi bạn nhấn "Cập nhật"');
            }
        } catch (error) {
            console.error('Error setting main image in local state:', error);
            Alert.alert('Lỗi', 'Đã xảy ra lỗi khi đặt ảnh chính');
        }
    };// Sắp xếp lại thứ tự ảnh (chỉ cập nhật state cục bộ)
    const handleReorderImages = async (imageIds: number[]) => {
        if (!fieldData) return;

        try {
            console.log('[Local] Reordering images with IDs:', imageIds);

            // Cập nhật state local theo thứ tự mới
            if (imageIds.length === fieldData.images.length) {
                // Sắp xếp lại ảnh theo thứ tự mới
                const reorderedImages = imageIds.map(id =>
                    fieldData.images.find(img => img.image_id === id)!
                );

                // Đảm bảo ảnh đầu tiên là ảnh chính
                reorderedImages[0] = { ...reorderedImages[0], image_type: 'main' };
                for (let i = 1; i < reorderedImages.length; i++) {
                    reorderedImages[i] = { ...reorderedImages[i], image_type: 'sub' };
                }

                setFieldData({
                    ...fieldData,
                    images: reorderedImages
                });

                // Đánh dấu rằng thứ tự ảnh đã thay đổi
                setImageOrderChanged(true);

                Alert.alert('Thành công', 'Đã đánh dấu thay đổi thứ tự ảnh. Các thay đổi sẽ được lưu khi bạn nhấn "Cập nhật"');
            }
        } catch (error) {
            console.error('Error reordering images in local state:', error);
            Alert.alert('Lỗi', 'Đã xảy ra lỗi khi sắp xếp lại ảnh');
        }
    };    // Lấy dữ liệu sân
    const fetchFieldData = async () => {
        try {
            setLoading(true);
            setError(null);

            if (!fieldId) {
                setError('Không tìm thấy ID sân');
                setLoading(false);
                return;
            }

            const token = await AsyncStorage.getItem('token');
            if (!token) {
                setError('Không tìm thấy token xác thực');
                setLoading(false);
                return;
            }

            // Lấy thông tin cơ bản của sân
            const fieldResponse = await fetch(`${API_ENDPOINTS.GET_OWNER_FIELD_DETAIL}/${fieldId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!fieldResponse.ok) {
                if (fieldResponse.status === 401) {
                    setError('Phiên đăng nhập đã hết hạn');
                } else {
                    const errorData = await fieldResponse.json();
                    setError(errorData.message || 'Không thể tải thông tin sân');
                }
                setLoading(false);
                return;
            }

            const fieldDataResponse = await fieldResponse.json();            // Lấy danh sách sân con
            const subFieldsResponse = await fetch(`${API_ENDPOINTS.GET_SUB_FIELDS}/${fieldId}/subfields`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            let subFieldsData: SubField[] = [];
            if (subFieldsResponse.ok) {
                subFieldsData = await subFieldsResponse.json();
                console.log('Subfields data retrieved:', subFieldsData);
            } else {
                console.error('Failed to fetch subfields:', subFieldsResponse.status, subFieldsResponse.statusText);
            }

            // Lấy danh sách dịch vụ
            const servicesResponse = await fetch(`${API_ENDPOINTS.GET_OWNER_FIELD_SERVICES}/${fieldId}/services`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            let servicesData: Service[] = [];
            if (servicesResponse.ok) {
                servicesData = await servicesResponse.json();
            }

            // Lấy tất cả các khung giờ hệ thống từ API
            const allTimeSlotsResponse = await fetch(`${API_ENDPOINTS.GET_TIME_SLOTS}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            // Lấy danh sách khung giờ của sân (có giá)
            const fieldTimeSlotsResponse = await fetch(`${API_ENDPOINTS.GET_OWNER_FIELD_TIME_SLOTS}/${fieldId}/time-slots`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            let timeSlotsData: TimeSlot[] = [];
            let fieldTimeSlots: any[] = [];

            // Lấy tất cả khung giờ hệ thống
            if (allTimeSlotsResponse.ok) {
                const allTimeSlots = await allTimeSlotsResponse.json();

                // Lấy khung giờ của sân này (nếu có)
                if (fieldTimeSlotsResponse.ok) {
                    fieldTimeSlots = await fieldTimeSlotsResponse.json();
                }

                // Tạo map các khung giờ đã được chọn cho sân này để dễ kiểm tra
                const selectedSlotsMap: { [key: number]: { price: number } } = {};
                fieldTimeSlots.forEach((slot: any) => {
                    selectedSlotsMap[slot.slot_id] = { price: slot.price };
                });

                // Tạo danh sách đầy đủ các khung giờ, đánh dấu những slot đã được chọn
                timeSlotsData = allTimeSlots.map((slot: any) => ({
                    slot_id: slot.slot_id,
                    start_time: slot.start_time,
                    end_time: slot.end_time,
                    price: selectedSlotsMap[slot.slot_id]?.price || formData.price_per_hour || 0,
                    selected: !!selectedSlotsMap[slot.slot_id] // true nếu slot này đã được chọn cho sân
                }));

                // Sắp xếp khung giờ với giờ nửa đêm (00:00-02:00) xuống cuối
                timeSlotsData.sort((a, b) => {
                    const hourA = parseInt(a.start_time.split(':')[0]);
                    const hourB = parseInt(b.start_time.split(':')[0]);

                    // Nếu giờ A từ 0-2 (nửa đêm), đẩy xuống cuối
                    if (hourA >= 0 && hourA < 3) return 1;
                    // Nếu giờ B từ 0-2 (nửa đêm), đẩy xuống cuối  
                    if (hourB >= 0 && hourB < 3) return -1;
                    // Sắp xếp bình thường theo giờ
                    return hourA - hourB;
                });
            }            // Log received image data before processing
            console.log('[fetchFieldData] Received field data with images:',
                fieldDataResponse.images ?
                    `${fieldDataResponse.images.length} images` :
                    'No images');

            if (fieldDataResponse.images) {
                // Log each image details for debugging
                fieldDataResponse.images.forEach((img: FieldImage, index: number) => {
                    console.log(`[fetchFieldData] Image ${index + 1}: ID=${img.image_id}, Type=${img.image_type}, Name=${img.image_name}`);
                });
            }

            // Tổng hợp tất cả dữ liệu
            const completeFieldData: FieldData = {
                ...fieldDataResponse,
                subFields: subFieldsData,
                services: servicesData,
                timeSlots: timeSlotsData,
            };

            // Cập nhật state
            setFieldData(completeFieldData);
            setOriginalFieldData(JSON.parse(JSON.stringify(completeFieldData))); // Deep copy để lưu trữ dữ liệu gốc

            // Cập nhật formData từ dữ liệu lấy về
            setFormData({
                name: completeFieldData.name || '',
                location: completeFieldData.location || '',
                sport_type: completeFieldData.sport_type || '',
                price_per_hour: completeFieldData.price_per_hour?.toString() || '',
                status: completeFieldData.status || '',
                description: completeFieldData.description || ''
            });

            // Cập nhật các state chi tiết
            setSubFields(subFieldsData);
            setServices(servicesData);
            setTimeSlots(timeSlotsData);

        } catch (error) {
            console.error('Error fetching field data:', error);
            setError('Đã xảy ra lỗi khi tải dữ liệu');
        } finally {
            setLoading(false);
        }
    };

    // Reset form về dữ liệu gốc
    const resetForm = async () => {
        if (originalFieldData) {
            setFormData({
                name: originalFieldData.name || '',
                location: originalFieldData.location || '',
                sport_type: originalFieldData.sport_type || '',
                price_per_hour: originalFieldData.price_per_hour?.toString() || '',
                status: originalFieldData.status || '',
                description: originalFieldData.description || ''
            });

            // Nếu có dữ liệu chi tiết, cũng reset
            if (originalFieldData.subFields) {
                setSubFields([...originalFieldData.subFields]);
            }

            if (originalFieldData.services) {
                setServices([...originalFieldData.services]);
            }

            if (originalFieldData.timeSlots) {
                setTimeSlots([...originalFieldData.timeSlots]);
            }            // Reset fieldData về giá trị ban đầu
            setFieldData(JSON.parse(JSON.stringify(originalFieldData)));            // Reset danh sách dịch vụ đã sửa đổi và dịch vụ mới
            setModifiedServices({});
            setNewServices([]);

            // Reset các biến theo dõi thay đổi cho ảnh
            setImagesToUpload([]);
            setImagesToDelete([]);
            setMainImageId(null);
            setImageOrderChanged(false);

            // Reset biến theo dõi thay đổi khung giờ
            setModifiedTimeSlots({});
            // Reset biến theo dõi thay đổi sân con
            setModifiedSubFields({});

            // Reset danh sách các mục đã xóa tạm thời
            setDeletedSubFields([]);
            setDeletedServices([]);

            // Xóa các sân con tạm thời đã thêm
            if (newlyAddedSubFieldIds.length > 0) {
                console.log(`[resetForm] Removing ${newlyAddedSubFieldIds.length} newly added subfields from local state`);

                // Đối với các sân con có ID tạm thời (ID âm), chỉ cần xóa khỏi state
                // Đối với các sân con đã được tạo trên server (ID dương), cần gọi API để xóa

                const tempSubFieldIds = newlyAddedSubFieldIds.filter(id => id < 0);
                const actualSubFieldIds = newlyAddedSubFieldIds.filter(id => id > 0);

                // Xóa các sân con trên server (nếu có)
                let hasError = false;
                for (const subFieldId of actualSubFieldIds) {
                    try {
                        const token = await AsyncStorage.getItem('token');
                        if (!token) {
                            Alert.alert('Lỗi', 'Không tìm thấy token xác thực');
                            return;
                        }

                        console.log(`[resetForm] Deleting subfield with ID: ${subFieldId}`);

                        // Gọi API xóa sân con
                        const response = await fetch(`${API_URL}/courts/${fieldId}/subfields/${subFieldId}`, {
                            method: 'DELETE',
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json',
                            },
                        });

                        if (!response.ok) {
                            console.error(`[resetForm] Failed to delete subfield ${subFieldId}:`, await response.text());
                            hasError = true;
                        } else {
                            console.log(`[resetForm] Successfully deleted subfield ${subFieldId}`);
                        }
                    } catch (error) {
                        console.error(`[resetForm] Error deleting sub-field ${subFieldId}:`, error);
                        hasError = true;
                    }
                }

                // Reset lại danh sách sân con và newlyAddedSubFieldIds
                setSubFields(originalFieldData.subFields);
                setNewlyAddedSubFieldIds([]);

                if (hasError) {
                    console.warn('[resetForm] Not all newly added subfields were deleted successfully');
                } else {
                    console.log('[resetForm] All newly added subfields deleted successfully');
                }
            }

            Alert.alert('Thành công', 'Đã khôi phục về dữ liệu gốc');
        }
    };    // Cập nhật thông tin sân
    const updateField = async () => {
        try {
            // Validate form
            if (!formData.name.trim()) {
                Alert.alert('Lỗi', 'Vui lòng nhập tên sân');
                return;
            }
            if (!formData.location.trim()) {
                Alert.alert('Lỗi', 'Vui lòng nhập địa chỉ');
                return;
            }
            if (!formData.sport_type) {
                Alert.alert('Lỗi', 'Vui lòng chọn loại thể thao');
                return;
            }
            if (!formData.price_per_hour || isNaN(Number(formData.price_per_hour))) {
                Alert.alert('Lỗi', 'Vui lòng nhập giá hợp lệ');
                return;
            }

            setSaving(true);

            const token = await AsyncStorage.getItem('token');
            if (!token) {
                Alert.alert('Lỗi', 'Không tìm thấy token xác thực');
                setSaving(false);
                return;
            }            // Thực hiện cập nhật trực tiếp (confirmation đã được xử lý ở UI component)
            try {
                let updateSuccess = true;

                // 1. Cập nhật thông tin cơ bản của sân (tên, vị trí, đặc điểm, loại sân, trạng thái)
                console.log('[updateField] Updating basic field information');
                try {
                    const updateData = {
                        name: formData.name.trim(),
                        location: formData.location.trim(),
                        sport_type: formData.sport_type,
                        price_per_hour: Number(formData.price_per_hour),
                        status: formData.status,
                        description: formData.description.trim()
                    };

                    console.log('[updateField] Sending field update data:', updateData);

                    const response = await fetch(`${API_URL}/api/fields/${fieldId}`, {
                        method: 'PUT',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(updateData),
                    });

                    if (!response.ok) {
                        const errorText = await response.text();
                        console.error(`[updateField] Error updating field: ${response.status} - ${errorText}`);
                        Alert.alert('Lỗi', `Không thể cập nhật thông tin sân: ${errorText}`);
                        updateSuccess = false;
                        return;
                    }

                    console.log('[updateField] Successfully updated field information');
                } catch (error) {
                    console.error('Error updating basic field information:', error);
                    Alert.alert('Lỗi', 'Không thể cập nhật thông tin cơ bản của sân');
                    updateSuccess = false;
                    return;
                }

                // 2. Quản lý sân con (PUT cho sân con đã có, POST cho sân con mới)
                console.log('[updateField] Managing subfields');
                try {
                    // 2.1 Xóa các sân con đã đánh dấu xóa
                    for (const subFieldId of deletedSubFields) {
                        if (subFieldId > 0) {
                            try {
                                console.log(`[updateField] Deleting subfield with ID: ${subFieldId}`);

                                const deleteResponse = await fetch(`${API_URL}/api/fields/${fieldId}/subfields/${subFieldId}`, {
                                    method: 'DELETE',
                                    headers: {
                                        'Authorization': `Bearer ${token}`,
                                        'Content-Type': 'application/json',
                                    },
                                });

                                if (!deleteResponse.ok) {
                                    console.error(`[updateField] Error deleting subfield ${subFieldId}:`, await deleteResponse.text());
                                } else {
                                    console.log(`[updateField] Successfully deleted subfield ${subFieldId}`);
                                }
                            } catch (error) {
                                console.error(`[updateField] Error deleting subfield ${subFieldId}:`, error);
                            }
                        }
                    }

                    // 2.2 Tạo mới các sân con với ID tạm thời (POST)
                    for (const tempSubFieldId of newlyAddedSubFieldIds) {
                        if (tempSubFieldId < 0) {
                            const tempSubField = subFields.find(s => s.sub_field_id === tempSubFieldId);
                            if (tempSubField) {
                                try {
                                    console.log(`[updateField] Creating new subfield: ${tempSubField.name}`);

                                    const createResponse = await fetch(`${API_URL}/api/fields/${fieldId}/subfields`, {
                                        method: 'POST',
                                        headers: {
                                            'Authorization': `Bearer ${token}`,
                                            'Content-Type': 'application/json',
                                        },
                                        body: JSON.stringify({
                                            name: tempSubField.name,
                                            status: tempSubField.status
                                        }),
                                    });

                                    if (!createResponse.ok) {
                                        console.error(`[updateField] Error creating subfield ${tempSubField.name}:`, await createResponse.text());
                                    } else {
                                        console.log(`[updateField] Successfully created subfield ${tempSubField.name}`);
                                    }
                                } catch (error) {
                                    console.error(`[updateField] Error creating subfield ${tempSubField.name}:`, error);
                                }
                            }
                        }
                    }

                    // 2.3 Cập nhật trạng thái các sân con đã có (PUT)
                    for (const subFieldId in modifiedSubFields) {
                        if (modifiedSubFields[subFieldId] && Number(subFieldId) > 0) {
                            const subField = subFields.find(s => s.sub_field_id === Number(subFieldId));
                            if (subField) {
                                try {
                                    console.log(`[updateField] Updating subfield ${subFieldId}`);

                                    const subFieldResponse = await fetch(`${API_URL}/api/fields/${fieldId}/subfields/${subFieldId}`, {
                                        method: 'PUT',
                                        headers: {
                                            'Authorization': `Bearer ${token}`,
                                            'Content-Type': 'application/json',
                                        },
                                        body: JSON.stringify({
                                            name: subField.name,
                                            status: subField.status
                                        }),
                                    });

                                    if (!subFieldResponse.ok) {
                                        console.error(`[updateField] Error updating subfield ${subFieldId}:`, await subFieldResponse.text());
                                    } else {
                                        console.log(`[updateField] Successfully updated subfield ${subFieldId}`);
                                    }
                                } catch (error) {
                                    console.error(`[updateField] Error updating subfield ${subFieldId}:`, error);
                                }
                            }
                        }
                    }
                } catch (error) {
                    console.error('Error managing subfields:', error);
                }

                // 3. Quản lý dịch vụ (PUT + DELETE/POST theo số lượng)
                console.log('[updateField] Managing services');
                try {
                    const originalServices = originalFieldData?.services || [];
                    const currentServices = services.filter(s => !deletedServices.includes(s.service_id));

                    console.log(`[updateField] Original services count: ${originalServices.length}`);
                    console.log(`[updateField] Current services count: ${currentServices.length}`);

                    // 3.1 Xóa các dịch vụ đã đánh dấu xóa
                    for (const serviceId of deletedServices) {
                        if (serviceId > 0) {
                            try {
                                console.log(`[updateField] Deleting service with ID: ${serviceId}`);

                                const deleteResponse = await fetch(`${API_URL}/api/fields/${fieldId}/services/${serviceId}`, {
                                    method: 'DELETE',
                                    headers: {
                                        'Authorization': `Bearer ${token}`,
                                        'Content-Type': 'application/json',
                                    },
                                });

                                if (!deleteResponse.ok) {
                                    console.error(`[updateField] Error deleting service ${serviceId}:`, await deleteResponse.text());
                                } else {
                                    console.log(`[updateField] Successfully deleted service ${serviceId}`);
                                }
                            } catch (error) {
                                console.error(`[updateField] Error deleting service ${serviceId}:`, error);
                            }
                        }
                    }

                    // 3.2 Tạo mới các dịch vụ với ID âm (POST)
                    for (const serviceId of newServices) {
                        if (serviceId < 0) {
                            const newService = services.find(s => s.service_id === serviceId);
                            if (newService) {
                                try {
                                    console.log(`[updateField] Creating new service: ${newService.name}`);

                                    const serviceResponse = await fetch(`${API_URL}/api/fields/${fieldId}/services`, {
                                        method: 'POST',
                                        headers: {
                                            'Authorization': `Bearer ${token}`,
                                            'Content-Type': 'application/json',
                                        },
                                        body: JSON.stringify({
                                            name: newService.name,
                                            description: newService.description,
                                            price: newService.price,
                                            status: newService.status
                                        }),
                                    });

                                    if (!serviceResponse.ok) {
                                        console.error('[updateField] Error creating service:', await serviceResponse.text());
                                    } else {
                                        console.log(`[updateField] Successfully created service ${newService.name}`);
                                    }
                                } catch (error) {
                                    console.error('[updateField] Error creating service:', error);
                                }
                            }
                        }
                    }

                    // 3.3 Cập nhật các dịch vụ đã sửa đổi (PUT)
                    for (const serviceId in modifiedServices) {
                        if (modifiedServices[serviceId] && Number(serviceId) > 0) {
                            const updatedService = services.find(s => s.service_id === Number(serviceId));
                            if (updatedService) {
                                try {
                                    console.log(`[updateField] Updating service: ${updatedService.name}`);

                                    const serviceResponse = await fetch(`${API_URL}/api/fields/${fieldId}/services/${serviceId}`, {
                                        method: 'PUT',
                                        headers: {
                                            'Authorization': `Bearer ${token}`,
                                            'Content-Type': 'application/json',
                                        },
                                        body: JSON.stringify({
                                            name: updatedService.name,
                                            description: updatedService.description,
                                            price: updatedService.price,
                                            status: updatedService.status
                                        }),
                                    });

                                    if (!serviceResponse.ok) {
                                        console.error('[updateField] Error updating service:', await serviceResponse.text());
                                    } else {
                                        console.log(`[updateField] Successfully updated service ${updatedService.name}`);
                                    }
                                } catch (error) {
                                    console.error('[updateField] Error updating service:', error);
                                }
                            }
                        }
                    }
                } catch (error) {
                    console.error('Error managing services:', error);
                }                                // 4. Cập nhật khung giờ (DELETE ALL + POST selected ones)
                console.log('[updateField] Managing time slots');
                try {
                    // 4.1 Kiểm tra nếu có bất kỳ thay đổi nào về time slots
                    const hasTimeSlotChanges = Object.keys(modifiedTimeSlots).length > 0;

                    if (hasTimeSlotChanges) {
                        console.log('[updateField] Time slot changes detected, refreshing all time slots');

                        // 4.2 Lấy danh sách tất cả time slots hiện tại của field để xóa
                        const existingTimeSlotsResponse = await fetch(`${API_ENDPOINTS.GET_OWNER_FIELD_TIME_SLOTS}/${fieldId}/time-slots`, {
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json',
                            },
                        });

                        if (existingTimeSlotsResponse.ok) {
                            const existingTimeSlots = await existingTimeSlotsResponse.json();
                            console.log(`[updateField] Found ${existingTimeSlots.length} existing time slots to delete`);

                            // 4.3 Xóa TẤT CẢ time slots hiện tại của field
                            for (const existingSlot of existingTimeSlots) {
                                try {
                                    console.log(`[updateField] Deleting existing time slot ${existingSlot.slot_id}`);

                                    const deleteResponse = await fetch(`${API_URL}/api/fields/${fieldId}/time-slots/${existingSlot.slot_id}`, {
                                        method: 'DELETE',
                                        headers: {
                                            'Authorization': `Bearer ${token}`,
                                            'Content-Type': 'application/json',
                                        },
                                    });

                                    if (!deleteResponse.ok) {
                                        console.error(`[updateField] Error deleting time slot ${existingSlot.slot_id}:`, await deleteResponse.text());
                                    } else {
                                        console.log(`[updateField] Successfully deleted time slot ${existingSlot.slot_id}`);
                                    }
                                } catch (error) {
                                    console.error(`[updateField] Error deleting time slot ${existingSlot.slot_id}:`, error);
                                }
                            }
                        }

                        // 4.4 Tạo mới TẤT CẢ time slots được chọn (selected = true)
                        const selectedTimeSlots = timeSlots.filter(slot => slot.selected);
                        console.log(`[updateField] Creating ${selectedTimeSlots.length} new time slots`);

                        for (const slot of selectedTimeSlots) {
                            try {
                                console.log(`[updateField] Creating time slot ${slot.slot_id} with price ${slot.price}`);

                                const createResponse = await fetch(`${API_URL}/api/fields/${fieldId}/time-slots`, {
                                    method: 'POST',
                                    headers: {
                                        'Authorization': `Bearer ${token}`,
                                        'Content-Type': 'application/json',
                                    },
                                    body: JSON.stringify({
                                        slot_id: slot.slot_id,
                                        price: slot.price
                                    }),
                                });

                                if (!createResponse.ok) {
                                    console.error(`[updateField] Error creating time slot ${slot.slot_id}:`, await createResponse.text());
                                } else {
                                    console.log(`[updateField] Successfully created time slot ${slot.slot_id}`);
                                }
                            } catch (error) {
                                console.error(`[updateField] Error creating time slot ${slot.slot_id}:`, error);
                            }
                        }
                    }
                } catch (error) {
                    console.error('Error managing time slots:', error);
                }                                // 5. Xử lý ảnh (DELETE ALL existing + POST new ones với tên {field_id}_{index})
                console.log('[updateField] Processing images');
                if (imagesToUpload.length > 0) {
                    console.log(`[updateField] Found ${imagesToUpload.length} new images to upload - will replace ALL existing images`);

                    // 5.1 Xóa TẤT CẢ ảnh hiện tại của field (cả trong DB và filesystem)
                    try {
                        console.log(`[updateField] Deleting ALL existing images for field ${fieldId}`);

                        const deleteAllResponse = await fetch(`${API_ENDPOINTS.UPLOAD_FIELD_IMAGE}/${fieldId}/images`, {
                            method: 'DELETE',
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json',
                            },
                        });

                        if (deleteAllResponse.ok) {
                            const result = await deleteAllResponse.json();
                            console.log(`[updateField] Successfully deleted all ${result.deleted_images?.length || 0} existing images`);
                        } else {
                            console.error('[updateField] Error deleting all existing images:', await deleteAllResponse.text());
                        }
                    } catch (error) {
                        console.error('[updateField] Error deleting all existing images:', error);
                    }

                    // 5.3 Upload TẤT CẢ ảnh mới với tên theo định dạng {field_id}_{index}
                    console.log('[updateField] Starting upload of new images with correct naming format');
                    for (let index = 0; index < imagesToUpload.length; index++) {
                        const imageToUpload = imagesToUpload[index];
                        try {
                            console.log(`[updateField] Uploading new image ${index + 1}/${imagesToUpload.length}`);

                            const fileExtension = imageToUpload.name.split('.').pop() || 'jpg';
                            const newFileName = `${fieldId}_${index}.${fileExtension}`;

                            console.log(`[updateField] Using correct filename format: ${newFileName}`);

                            const formData = new FormData();
                            // @ts-ignore - FormData in React Native differs from standard web FormData
                            formData.append('image', {
                                uri: imageToUpload.uri,
                                name: newFileName,
                                type: imageToUpload.type
                            });

                            const uploadResponse = await fetch(`${API_ENDPOINTS.UPLOAD_FIELD_IMAGE}/${fieldId}/images`, {
                                method: 'POST',
                                headers: {
                                    'Authorization': `Bearer ${token}`,
                                    'Content-Type': 'multipart/form-data',
                                },
                                body: formData,
                            });

                            if (!uploadResponse.ok) {
                                console.error(`[updateField] Error uploading image ${newFileName}:`, await uploadResponse.text());
                            } else {
                                console.log(`[updateField] Successfully uploaded image ${newFileName}`);
                            }
                        } catch (error) {
                            console.error(`[updateField] Error uploading image ${imageToUpload.name}:`, error);
                        }
                    }

                    console.log('[updateField] Image replacement completed - all old images deleted, all new images uploaded with correct naming');
                }

                // Refresh data if the update was successful
                if (updateSuccess) {
                    console.log('[updateField] Update completed successfully');                                    // Wait a moment to ensure all operations have completed on the server
                    await new Promise(resolve => setTimeout(resolve, 1000));

                    // Clear image cache before fetching new data
                    await clearImageCache();

                    // Fetch new data
                    await fetchFieldData();

                    // Reset all tracking variables
                    setNewServices([]);
                    setModifiedServices({});
                    setModifiedTimeSlots({});
                    setImagesToUpload([]);
                    setImagesToDelete([]);
                    setModifiedSubFields({});
                    setNewlyAddedSubFieldIds([]);
                    setDeletedSubFields([]);
                    setDeletedServices([]);                    // ĐÃ XÓA Alert.alert('Thành công', 'Cập nhật thông tin sân thành công!');
                }
            } catch (error) {
                console.error('Error updating field:', error);
                Alert.alert('Lỗi', 'Đã xảy ra lỗi khi cập nhật');
            } finally {
                setSaving(false);
            }
        } catch (error) {
            console.error('Error in updateField function:', error);
            Alert.alert('Lỗi', 'Đã xảy ra lỗi không xác định');
            setSaving(false);
        }
    };

    // Hàm xóa bộ nhớ cache của ảnh
    const clearImageCache = async () => {
        try {
            // Sử dụng Expo FileSystem để xóa bộ nhớ cache
            if (FileSystem.cacheDirectory) {
                const imagesCacheDir = `${FileSystem.cacheDirectory}images/`;

                console.log('[clearImageCache] Attempting to clear image cache');

                // Kiểm tra xem thư mục cache có tồn tại không
                const cacheExists = await FileSystem.getInfoAsync(imagesCacheDir);

                if (cacheExists.exists) {
                    console.log('[clearImageCache] Found image cache directory, clearing...');
                    await FileSystem.deleteAsync(imagesCacheDir, { idempotent: true });
                    console.log('[clearImageCache] Image cache cleared successfully');
                } else {
                    console.log('[clearImageCache] No image cache directory found');
                }
            }
        } catch (error) {
            console.error('[clearImageCache] Error clearing image cache:', error);
        }
    };

    // Lấy dữ liệu sân khi component mount hoặc fieldId thay đổi
    useEffect(() => {
        if (fieldId) {
            fetchFieldData();
        }
    }, [fieldId]);

    return {
        fieldData,
        originalFieldData,
        loading,
        saving,
        imageUploading,
        error,
        syncPrices,
        formData,
        setFormData,
        subFields,
        services, timeSlots,
        newlyAddedSubFieldIds,
        deletedSubFields,
        deletedServices,
        updateTimeSlotPrice,
        toggleTimeSlotSelection,
        toggleSyncPrices, handlePickImage,
        handleRemoveImage,
        handleAddService,
        handleUpdateService,
        handleToggleServiceStatus, handleAddSubField,
        handleRemoveSubField,
        handleToggleSubFieldStatus,
        handleRemoveService, updateField,
        resetForm,
        fetchFieldData,
        clearImageCache, // Thêm hàm xóa cache vào kết quả trả về
    };
};

export default useUpdateField;
