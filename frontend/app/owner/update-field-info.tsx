import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Alert,
    Image,
    ActivityIndicator,
    Modal,
    FlatList
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL, API_ENDPOINTS } from '../../constants/apiConfig';
import * as ImagePicker from 'expo-image-picker';

interface FieldImage {
    image_id: number;
    image_name: string;
    uploaded_at: string;
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
}

interface TimeSlot {
    slot_id: number;
    start_time: string;
    end_time: string;
    price: number;
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

export default function UpdateFieldInfo() {
    console.log('UpdateFieldInfo component loaded');
    const router = useRouter();
    const { fieldId } = useLocalSearchParams<{ fieldId: string }>();

    console.log('Received fieldId:', fieldId);

    const [fieldData, setFieldData] = useState<FieldData | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showSportModal, setShowSportModal] = useState(false);
    const [showStatusModal, setShowStatusModal] = useState(false);

    // Form data
    const [formData, setFormData] = useState({
        name: '',
        location: '',
        sport_type: '',
        price_per_hour: '',
        status: '',
        description: ''
    });

    const sportTypes = [
        { key: 'football', label: 'Bóng đá' },
        { key: 'basketball', label: 'Bóng rổ' },
        { key: 'badminton', label: 'Cầu lông' },
        { key: 'tennis', label: 'Tennis' },
        { key: 'volleyball', label: 'Bóng chuyền' }
    ];

    const statusOptions = [
        { key: 'active', label: 'Hoạt động' },
        { key: 'inactive', label: 'Tạm dừng' },
        { key: 'maintenance', label: 'Bảo trì' }
    ]; useEffect(() => {
        console.log('UpdateFieldInfo useEffect triggered, fieldId:', fieldId);
        if (fieldId) {
            fetchFieldData();
        } else {
            console.log('No fieldId provided');
        }
    }, [fieldId]);

    const fetchFieldData = async () => {
        try {
            setLoading(true);
            const token = await AsyncStorage.getItem('token');

            if (!token) {
                Alert.alert('Lỗi', 'Không tìm thấy token xác thực', [
                    { text: 'OK', onPress: () => router.push('/customer') }
                ]);
                return;
            } const response = await fetch(`${API_ENDPOINTS.GET_OWNER_FIELD_DETAIL}/${fieldId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.status === 401) {
                Alert.alert('Lỗi', 'Phiên đăng nhập đã hết hạn', [
                    { text: 'OK', onPress: () => router.push('/customer') }
                ]);
                return;
            }

            if (response.ok) {
                const data = await response.json();
                console.log('Field data:', data);

                setFieldData(data);
                setFormData({
                    name: data.name || '',
                    location: data.location || '',
                    sport_type: data.sport_type || '',
                    price_per_hour: data.price_per_hour?.toString() || '',
                    status: data.status || '',
                    description: data.description || ''
                });
            } else {
                Alert.alert('Lỗi', 'Không thể tải thông tin sân');
            }
        } catch (error) {
            console.error('Error fetching field data:', error);
            Alert.alert('Lỗi', 'Đã xảy ra lỗi khi tải dữ liệu');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateField = async () => {
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
                return;
            }

            const updateData = {
                name: formData.name.trim(),
                location: formData.location.trim(),
                sport_type: formData.sport_type,
                price_per_hour: Number(formData.price_per_hour),
                status: formData.status,
                description: formData.description.trim()
            }; const response = await fetch(`${API_ENDPOINTS.UPDATE_OWNER_FIELD}/${fieldId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updateData),
            });

            if (response.status === 401) {
                Alert.alert('Lỗi', 'Phiên đăng nhập đã hết hạn', [
                    { text: 'OK', onPress: () => router.push('/customer') }
                ]);
                return;
            }

            if (response.ok) {
                Alert.alert('Thành công', 'Cập nhật thông tin sân thành công!', [
                    { text: 'OK', onPress: () => router.back() }
                ]);
            } else {
                const errorData = await response.json();
                Alert.alert('Lỗi', errorData.message || 'Không thể cập nhật thông tin sân');
            }
        } catch (error) {
            console.error('Error updating field:', error);
            Alert.alert('Lỗi', 'Đã xảy ra lỗi khi cập nhật');
        } finally {
            setSaving(false);
        }
    };

    const getSportTypeLabel = (key: string) => {
        const sport = sportTypes.find(s => s.key === key);
        return sport ? sport.label : key;
    };

    const getStatusLabel = (key: string) => {
        const status = statusOptions.find(s => s.key === key);
        return status ? status.label : key;
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2ECC71" />
                <Text style={styles.loadingText}>Đang tải thông tin sân...</Text>
            </View>
        );
    }

    if (!fieldData) {
        return (
            <View style={styles.errorContainer}>
                <Ionicons name="warning-outline" size={50} color="#E74C3C" />
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
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#2C3E50" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Cập nhật thông tin sân</Text>
                <TouchableOpacity
                    onPress={handleUpdateField}
                    style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                    disabled={saving}
                >
                    {saving ? (
                        <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                        <Ionicons name="checkmark" size={24} color="#FFF" />
                    )}
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Basic Information */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Thông tin cơ bản</Text>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Tên sân <Text style={styles.required}>*</Text></Text>
                        <TextInput
                            style={styles.input}
                            value={formData.name}
                            onChangeText={(text) => setFormData({ ...formData, name: text })}
                            placeholder="Nhập tên sân"
                            placeholderTextColor="#BDC3C7"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Địa chỉ <Text style={styles.required}>*</Text></Text>
                        <TextInput
                            style={styles.input}
                            value={formData.location}
                            onChangeText={(text) => setFormData({ ...formData, location: text })}
                            placeholder="Nhập địa chỉ sân"
                            placeholderTextColor="#BDC3C7"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Loại thể thao <Text style={styles.required}>*</Text></Text>
                        <TouchableOpacity
                            style={styles.picker}
                            onPress={() => setShowSportModal(true)}
                        >
                            <Text style={[styles.pickerText, !formData.sport_type && styles.placeholderText]}>
                                {formData.sport_type ? getSportTypeLabel(formData.sport_type) : 'Chọn loại thể thao'}
                            </Text>
                            <Ionicons name="chevron-down" size={20} color="#7F8C8D" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Giá thuê (VNĐ/giờ) <Text style={styles.required}>*</Text></Text>
                        <TextInput
                            style={styles.input}
                            value={formData.price_per_hour}
                            onChangeText={(text) => setFormData({ ...formData, price_per_hour: text })}
                            placeholder="Nhập giá thuê"
                            placeholderTextColor="#BDC3C7"
                            keyboardType="numeric"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Trạng thái</Text>
                        <TouchableOpacity
                            style={styles.picker}
                            onPress={() => setShowStatusModal(true)}
                        >
                            <Text style={[styles.pickerText, !formData.status && styles.placeholderText]}>
                                {formData.status ? getStatusLabel(formData.status) : 'Chọn trạng thái'}
                            </Text>
                            <Ionicons name="chevron-down" size={20} color="#7F8C8D" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Mô tả</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            value={formData.description}
                            onChangeText={(text) => setFormData({ ...formData, description: text })}
                            placeholder="Nhập mô tả về sân"
                            placeholderTextColor="#BDC3C7"
                            multiline={true}
                            numberOfLines={4}
                            textAlignVertical="top"
                        />
                    </View>
                </View>

                <View style={styles.bottomSpace} />
            </ScrollView>

            {/* Sport Type Modal */}
            <Modal
                visible={showSportModal}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowSportModal(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Chọn loại thể thao</Text>
                            <TouchableOpacity onPress={() => setShowSportModal(false)}>
                                <Ionicons name="close" size={24} color="#2C3E50" />
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={sportTypes}
                            keyExtractor={(item) => item.key}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[
                                        styles.modalItem,
                                        formData.sport_type === item.key && styles.selectedModalItem
                                    ]}
                                    onPress={() => {
                                        setFormData({ ...formData, sport_type: item.key });
                                        setShowSportModal(false);
                                    }}
                                >
                                    <Text style={[
                                        styles.modalItemText,
                                        formData.sport_type === item.key && styles.selectedModalItemText
                                    ]}>
                                        {item.label}
                                    </Text>
                                    {formData.sport_type === item.key && (
                                        <Ionicons name="checkmark" size={20} color="#2ECC71" />
                                    )}
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </View>
            </Modal>

            {/* Status Modal */}
            <Modal
                visible={showStatusModal}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowStatusModal(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Chọn trạng thái</Text>
                            <TouchableOpacity onPress={() => setShowStatusModal(false)}>
                                <Ionicons name="close" size={24} color="#2C3E50" />
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={statusOptions}
                            keyExtractor={(item) => item.key}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[
                                        styles.modalItem,
                                        formData.status === item.key && styles.selectedModalItem
                                    ]}
                                    onPress={() => {
                                        setFormData({ ...formData, status: item.key });
                                        setShowStatusModal(false);
                                    }}
                                >
                                    <Text style={[
                                        styles.modalItemText,
                                        formData.status === item.key && styles.selectedModalItemText
                                    ]}>
                                        {item.label}
                                    </Text>
                                    {formData.status === item.key && (
                                        <Ionicons name="checkmark" size={20} color="#2ECC71" />
                                    )}
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E9ECEF',
        paddingTop: 50,
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#2C3E50',
        flex: 1,
        textAlign: 'center',
        marginHorizontal: 16,
    },
    saveButton: {
        backgroundColor: '#2ECC71',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
    },
    saveButtonDisabled: {
        backgroundColor: '#BDC3C7',
    },
    content: {
        flex: 1,
        padding: 16,
    },
    section: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#2C3E50',
        marginBottom: 16,
    },
    inputGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: '#2C3E50',
        marginBottom: 8,
    },
    required: {
        color: '#E74C3C',
    },
    input: {
        borderWidth: 1,
        borderColor: '#E9ECEF',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 12,
        fontSize: 16,
        color: '#2C3E50',
        backgroundColor: '#FFF',
    },
    textArea: {
        height: 100,
    },
    picker: {
        borderWidth: 1,
        borderColor: '#E9ECEF',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 12,
        backgroundColor: '#FFF',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    pickerText: {
        fontSize: 16,
        color: '#2C3E50',
    },
    placeholderText: {
        color: '#BDC3C7',
    },
    bottomSpace: {
        height: 20,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8F9FA',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#7F8C8D',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8F9FA',
        padding: 20,
    },
    errorText: {
        fontSize: 16,
        color: '#E74C3C',
        textAlign: 'center',
        marginVertical: 16,
    },
    retryButton: {
        backgroundColor: '#3498DB',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
    },
    retryButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '500',
    },
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FFF',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '70%',
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E9ECEF',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#2C3E50',
    },
    modalItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F8F9FA',
    },
    selectedModalItem: {
        backgroundColor: '#E8F5E8',
    },
    modalItemText: {
        fontSize: 16,
        color: '#2C3E50',
    },
    selectedModalItemText: {
        color: '#2ECC71',
        fontWeight: '500',
    },
});