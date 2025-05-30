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
    Switch,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import useUpdateField from '../../hooks/useUpdateField';
import { FIELD_IMAGE_BASE_URL } from '../../constants/apiConfig';

// Helper function to format time
const formatTime = (timeString: string) => {
    const hour = parseInt(timeString.substring(0, 2));
    const minute = timeString.substring(3, 5);

    // Convert 24:00 to 00:00
    if (hour === 24) {
        return `00:${minute}`;
    }

    return `${hour.toString().padStart(2, '0')}:${minute}`;
};

export default function UpdateFieldInfo() {
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const fieldId = Array.isArray(id) ? id[0] : id;
    const [showTimeSlots, setShowTimeSlots] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [confirmationMessage, setConfirmationMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState(''); const {
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
        services,
        timeSlots,
        deletedSubFields,
        deletedServices,
        updateTimeSlotPrice,
        toggleTimeSlotSelection,
        toggleSyncPrices, handlePickImage,
        handleRemoveImage,
        handleAddService,
        handleUpdateService,
        handleToggleServiceStatus,
        handleAddSubField,
        handleRemoveSubField,
        handleToggleSubFieldStatus,
        handleRemoveService,
        updateField,
        resetForm,
        fetchFieldData,
    } = useUpdateField(fieldId);

    useEffect(() => {
        if (fieldId) {
            fetchFieldData();
        } else {
            Alert.alert('Lỗi', 'Không tìm thấy ID sân.');
            router.push('/owner/dashboard');
        }
    }, [fieldId]);    // Log subFields khi có thay đổi
    useEffect(() => {
        console.log('Current subFields in update-field-info:', subFields);
    }, [subFields]);

    // Filter out deleted items for display
    const visibleSubFields = subFields.filter(subField => !deletedSubFields.includes(subField.sub_field_id));
    const visibleServices = services.filter(service => !deletedServices.includes(service.service_id));

    const toggleTimeSlotsVisibility = () => {
        setShowTimeSlots(prev => !prev);
    };

    const handleSubmit = async () => {
        setConfirmationMessage('Bạn có chắc muốn cập nhật thông tin sân?');
        setShowConfirmModal(true);
    };

    const confirmSubmit = async () => {
        setShowConfirmModal(false);

        try {
            await updateField();
            setSuccessMessage('Cập nhật thông tin sân thành công!');
            setTimeout(() => {
                setSuccessMessage('');
                router.push('/owner/dashboard');
            }, 1500);
        } catch (err) {
            Alert.alert('Lỗi', 'Có lỗi xảy ra khi cập nhật thông tin sân.');
        }
    };

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
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.push('/owner/dashboard')}
                    activeOpacity={0.7}
                >
                    <Ionicons name="arrow-back" size={28} color="#FFFFFF" />
                </TouchableOpacity>

                <Text style={styles.title}>Cập nhật thông tin sân</Text>

                <View style={styles.formContainer}>
                    {/* Thông tin cơ bản */}
                    <View style={styles.sectionContainer}>
                        <Text style={styles.sectionTitle}>Tên sân</Text>
                        <View style={styles.sectionContent}>
                            <TextInput
                                style={styles.input}
                                value={formData.name}
                                onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                                placeholder="Nhập tên sân"
                                placeholderTextColor="#9CA3AF"
                            />
                        </View>
                    </View>

                    <View style={styles.sectionContainer}>
                        <Text style={styles.sectionTitle}>Vị trí</Text>
                        <View style={styles.sectionContent}>
                            <TextInput
                                style={styles.input}
                                value={formData.location}
                                onChangeText={(text) => setFormData(prev => ({ ...prev, location: text }))}
                                placeholder="Nhập vị trí"
                                placeholderTextColor="#9CA3AF"
                            />
                        </View>
                    </View>

                    <View style={styles.sectionContainer}>
                        <Text style={styles.sectionTitle}>Loại sân</Text>
                        <View style={styles.sectionContent}>
                            <View style={styles.pickerContainer}>
                                <Picker
                                    selectedValue={formData.sport_type}
                                    style={styles.picker}
                                    onValueChange={(itemValue) => setFormData(prev => ({ ...prev, sport_type: itemValue }))}
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

                    <View style={styles.sectionContainer}>
                        <Text style={styles.sectionTitle}>Trạng thái</Text>
                        <View style={styles.sectionContent}>
                            <View style={styles.pickerContainer}>
                                <Picker
                                    selectedValue={formData.status}
                                    style={styles.picker}
                                    onValueChange={(itemValue) => setFormData(prev => ({ ...prev, status: itemValue }))}
                                    dropdownIconColor="#6B7280"
                                >
                                    <Picker.Item label="Hoạt động" value="available" />
                                    <Picker.Item label="Ngừng hoạt động" value="unavailable" />
                                </Picker>
                            </View>
                        </View>
                    </View>

                    <View style={styles.sectionContainer}>
                        <Text style={styles.sectionTitle}>Đặc điểm sân</Text>
                        <View style={styles.sectionContent}>
                            <TextInput
                                style={[styles.input, styles.multilineInput]}
                                value={formData.description}
                                onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
                                placeholder="Mô tả đặc điểm sân"
                                placeholderTextColor="#9CA3AF"
                                multiline
                                numberOfLines={4}
                            />
                        </View>
                    </View>

                    {/* Sub-fields - Các sân con */}                    <View style={styles.sectionContainer}>
                        <Text style={styles.sectionTitle}>Quản lý sân con</Text>
                        <View style={styles.sectionContent}>
                            {visibleSubFields.map((subField, index) => (
                                <View key={subField.sub_field_id} style={styles.subFieldContainer}>
                                    <View style={styles.subFieldInfo}>
                                        <Text style={styles.subFieldName}>{subField.name}</Text>                                        <View style={[
                                            styles.statusBadge,
                                            subField.status === 'available' ? styles.statusActive : styles.statusInactive
                                        ]}>
                                            <Text style={styles.statusText}>
                                                {subField.status === 'available' ? 'Hoạt động' : 'Ngừng hoạt động'}
                                            </Text>
                                        </View>
                                    </View>                                    <View style={styles.subFieldActions}>
                                        <TouchableOpacity
                                            style={[
                                                styles.toggleStatusButton,
                                                subField.status === 'available' ? styles.deactivateButton : styles.activateButton
                                            ]}
                                            onPress={() => handleToggleSubFieldStatus(subField.sub_field_id, subField.status)}
                                            activeOpacity={0.7}
                                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                        >
                                            <Text style={styles.toggleStatusText}>
                                                {subField.status === 'available' ? 'Tạm ngừng' : 'Kích hoạt'}
                                            </Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={styles.deleteButton}
                                            onPress={() => handleRemoveSubField(subField.sub_field_id)}
                                            activeOpacity={0.7}
                                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                        >
                                            <Ionicons name="close" size={20} color="#EF4444" />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))}

                            <TouchableOpacity
                                style={styles.addButton}
                                onPress={handleAddSubField}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.addButtonText}>Thêm sân con mới</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Services - Dịch vụ thêm */}                    <View style={styles.sectionContainer}>
                        <Text style={styles.sectionTitle}>Dịch vụ thêm</Text>
                        <View style={styles.sectionContent}>
                            {visibleServices.map((service) => (
                                <View key={service.service_id} style={styles.serviceContainer}>
                                    <View style={styles.serviceMainContent}>
                                        <TextInput
                                            style={styles.serviceInput}
                                            value={service.name}
                                            onChangeText={(text) => handleUpdateService(service.service_id, 'name', text)}
                                            placeholder="Tên dịch vụ"
                                            placeholderTextColor="#9CA3AF"
                                        />
                                        <TextInput
                                            style={[styles.serviceInput, styles.descriptionInput]}
                                            value={service.description}
                                            onChangeText={(text) => handleUpdateService(service.service_id, 'description', text)}
                                            placeholder="Mô tả dịch vụ"
                                            placeholderTextColor="#9CA3AF"
                                            multiline
                                        />                                        <TextInput
                                            style={styles.serviceInput}
                                            value={service.price !== undefined ? service.price.toString() : '0'}
                                            onChangeText={(text) => {
                                                const numericValue = text === '' ? 0 : Number(text);
                                                if (!isNaN(numericValue)) {
                                                    handleUpdateService(service.service_id, 'price', numericValue);
                                                }
                                            }}
                                            placeholder="Giá dịch vụ (VNĐ)"
                                            placeholderTextColor="#9CA3AF"
                                            keyboardType="numeric"
                                        />
                                    </View>                                    <View style={styles.serviceActions}>
                                        <TouchableOpacity
                                            style={[
                                                styles.toggleStatusButton,
                                                service.status === 'available' ? styles.deactivateButton : styles.activateButton
                                            ]}
                                            onPress={() => handleToggleServiceStatus(service.service_id, service.status)}
                                            activeOpacity={0.7}
                                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                        >
                                            <Text style={styles.toggleStatusText}>
                                                {service.status === 'available' ? 'Tạm ngưng' : 'Kích hoạt'}
                                            </Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={styles.deleteButton}
                                            onPress={() => handleRemoveService(service.service_id)}
                                            activeOpacity={0.7}
                                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                        >
                                            <Ionicons name="close" size={20} color="#EF4444" />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))}

                            <TouchableOpacity
                                style={styles.addButton}
                                onPress={handleAddService}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.addButtonText}>Thêm dịch vụ mới</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Time Slots - Khung giờ */}
                    <View style={styles.sectionContainer}>
                        <TouchableOpacity
                            style={styles.collapsibleHeader}
                            onPress={toggleTimeSlotsVisibility}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.sectionTitle}>Cập nhật khung giờ & giá sân</Text>
                            <Ionicons
                                name={showTimeSlots ? "chevron-up" : "chevron-down"}
                                size={24}
                                color="#6B7280"
                            />
                        </TouchableOpacity>

                        {showTimeSlots && (
                            <View style={styles.sectionContent}>
                                <TextInput
                                    style={styles.input}
                                    value={formData.price_per_hour !== undefined ? formData.price_per_hour.toString() : '0'}
                                    onChangeText={(text) => {
                                        // Ensure text is a valid number or empty string
                                        if (text === '' || !isNaN(Number(text))) {
                                            setFormData(prev => ({ ...prev, price_per_hour: text }));
                                            if (syncPrices) {
                                                timeSlots.forEach(slot => {
                                                    if (slot.selected) {
                                                        updateTimeSlotPrice(slot.slot_id, text || '0');
                                                    }
                                                });
                                            }
                                        }
                                    }}
                                    placeholder="Nhập giá cơ bản (VNĐ)"
                                    placeholderTextColor="#9CA3AF"
                                    keyboardType="numeric"
                                />

                                <TouchableOpacity
                                    style={styles.checkboxContainer}
                                    onPress={toggleSyncPrices}
                                    activeOpacity={0.7}
                                >
                                    <View style={[styles.customCheckbox, syncPrices && styles.customCheckboxChecked]}>
                                        {syncPrices && (
                                            <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                                        )}
                                    </View>
                                    <Text style={styles.checkboxLabel}>Đồng bộ giá sân giữa các khung giờ</Text>
                                </TouchableOpacity>

                                <View style={styles.timeSlotsContainer}>
                                    {timeSlots.map((slot) => (
                                        <View key={slot.slot_id} style={styles.timeSlotWrapper}>
                                            <View style={styles.timeSlotBox}>
                                                <TouchableOpacity
                                                    style={styles.timeSlotCheckbox}
                                                    onPress={() => toggleTimeSlotSelection(slot.slot_id, slot.selected)}
                                                    activeOpacity={0.7}
                                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
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

                                                <TouchableOpacity
                                                    style={{ flex: 1 }}
                                                    onPress={() => toggleTimeSlotSelection(slot.slot_id, slot.selected)}
                                                    activeOpacity={0.7}
                                                >
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
                                                </TouchableOpacity>
                                            </View>

                                            {slot.selected && (<TextInput
                                                style={styles.timeSlotPriceInput}
                                                value={slot.price !== undefined ? slot.price.toString() : '0'}
                                                onChangeText={(text) => {
                                                    // Ensure text is a valid number or empty string
                                                    if (text === '' || !isNaN(Number(text))) {
                                                        updateTimeSlotPrice(slot.slot_id, text || '0');
                                                    }
                                                }}
                                                placeholder="Giá sân theo giờ"
                                                placeholderTextColor="#9CA3AF"
                                                keyboardType="numeric"
                                                textAlign="left"
                                            />
                                            )}
                                        </View>
                                    ))}

                                    <TouchableOpacity
                                        style={styles.collapseButton}
                                        onPress={toggleTimeSlotsVisibility}
                                        activeOpacity={0.7}
                                    >
                                        <Text style={styles.collapseButtonText}>Rút gọn</Text>
                                        <Ionicons name="chevron-up" size={16} color="#6B7280" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                    </View>                    {/* Images - Ảnh sân */}
                    <View style={styles.sectionContainer}>
                        <Text style={styles.sectionTitle}>Ảnh sân</Text>
                        <View style={styles.sectionContent}>
                            <TouchableOpacity
                                style={[
                                    styles.uploadButton,
                                    imageUploading && styles.disabledButton
                                ]}
                                onPress={handlePickImage}
                                activeOpacity={0.7}
                                disabled={imageUploading}
                            >                            {imageUploading ? (<View style={{ flexDirection: 'column', alignItems: 'center' }}>
                                <ActivityIndicator size="small" color="#3B82F6" />
                                <Text style={[styles.uploadText, { marginTop: 8 }]}>Đang xử lý ảnh...</Text>
                                <Text style={styles.uploadSubtext}>Vui lòng đợi trong giây lát</Text>
                            </View>
                            ) : (<>
                                <Ionicons name="image" size={24} color="#3B82F6" />
                                <Text style={styles.uploadText}>Chọn ảnh mới</Text>
                                <Text style={styles.uploadSubtext}>(Các thay đổi sẽ được lưu khi bạn nhấn "Cập nhật")</Text>
                            </>
                            )}
                            </TouchableOpacity>                            {fieldData && (<FlatList
                                data={fieldData.images}
                                horizontal
                                renderItem={({ item }) => {                                    // Determine image source - for temp images use local URI, for existing images use server URL
                                    const imageSource = item.image_id < 0
                                        ? { uri: item.image_name } // For temp images, image_name contains the local URI
                                        : { uri: `${FIELD_IMAGE_BASE_URL}/${item.image_name}?t=${Date.now()}` }; // Add cache-busting parameter

                                    return (
                                        <View style={styles.imageContainer}>
                                            <Image
                                                source={imageSource}
                                                style={styles.image}
                                                resizeMode="cover"
                                            />                                            <View style={styles.imageOverlay}>
                                                {item.image_type === 'main' && (
                                                    <View style={styles.mainImageBadge}>
                                                        <Text style={styles.mainImageText}>Chính</Text>
                                                    </View>
                                                )}
                                                {item.image_id < 0 && (
                                                    <View style={styles.newImageBadge}>
                                                        <Text style={styles.newImageText}>Mới</Text>
                                                    </View>
                                                )}
                                            </View>

                                            {/* Hiển thị nút xóa chỉ cho ảnh mới (ID âm) */}
                                            {item.image_id < 0 && (
                                                <TouchableOpacity
                                                    style={styles.removeButton}
                                                    onPress={() => handleRemoveImage(item.image_id)}
                                                    disabled={imageUploading}
                                                    activeOpacity={0.6}
                                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                                >
                                                    <Ionicons name="trash-outline" size={20} color="#ff4d4f" />
                                                </TouchableOpacity>
                                            )}

                                            <Text style={styles.imageIdText}>ID: {item.image_id}</Text>
                                        </View>
                                    );
                                }}
                                keyExtractor={(item) => item.image_id !== undefined ? item.image_id.toString() : `image-${Math.random()}`}
                                style={styles.imageList}
                                showsHorizontalScrollIndicator={false}
                                ItemSeparatorComponent={() => <View style={{ width: 10 }} />} // Add space between items
                            />
                            )}
                        </View>
                    </View>
                </View>

                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        style={styles.resetButton}
                        onPress={resetForm}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.resetButtonText}>Hủy thay đổi</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.submitButton, saving && styles.disabledButton]}
                        onPress={handleSubmit}
                        disabled={saving}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.submitText}>
                            {saving ? 'Đang xử lý...' : 'Lưu thay đổi'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* Confirmation Modal */}
            <Modal
                animationType="fade"
                transparent
                visible={showConfirmModal}
                onRequestClose={() => setShowConfirmModal(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Xác nhận</Text>
                        <Text style={styles.modalMessage}>{confirmationMessage}</Text>
                        <View style={styles.modalButtonsContainer}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => setShowConfirmModal(false)}
                            >
                                <Text style={styles.cancelButtonText}>Hủy</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.confirmButton]}
                                onPress={confirmSubmit}
                            >
                                <Text style={styles.confirmButtonText}>Xác nhận</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Success Message */}
            {successMessage !== '' && (
                <View style={styles.successMessageContainer}>
                    <View style={styles.successMessageContent}>
                        <Ionicons name="checkmark-circle" size={36} color="#4CAF50" />
                        <Text style={styles.successMessageText}>{successMessage}</Text>
                    </View>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F1F5F9',
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F1F5F9',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#6B7280',
    },
    scrollContent: {
        flexGrow: 1,
        padding: 16,
        paddingTop: 60,
        paddingBottom: 40,
    },
    backButton: {
        position: 'absolute',
        top: 16,
        left: 16,
        backgroundColor: '#3B82F6',
        borderRadius: 12,
        padding: 10,
        zIndex: 100,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 24,
        textAlign: 'center',
    },
    formContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    sectionContainer: {
        marginBottom: 24,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
        paddingBottom: 20,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1E293B',
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
    },
    sectionContent: {
        width: '100%',
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
    subFieldContainer: {
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    subFieldInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    subFieldName: {
        fontSize: 16,
        fontWeight: '500',
        color: '#1E293B',
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
        marginLeft: 10,
    },
    statusActive: {
        backgroundColor: '#DCFCE7',
    },
    statusInactive: {
        backgroundColor: '#FEE2E2',
    },
    statusText: {
        fontSize: 14,
        fontWeight: '500',
    },
    toggleStatusButton: {
        borderRadius: 8,
        paddingVertical: 8,
        paddingHorizontal: 12,
        alignItems: 'center',
    },
    deactivateButton: {
        backgroundColor: '#FEE2E2',
    },
    activateButton: {
        backgroundColor: '#DCFCE7',
    }, toggleStatusText: {
        fontSize: 14,
        fontWeight: '500',
    },
    subFieldActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    }, deleteButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#FEE2E2',
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 10,
    },
    serviceMainContent: {
        flex: 1,
    },
    serviceActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 12,
    },
    serviceContainer: {
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    serviceInput: {
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        padding: 10,
        fontSize: 14,
        color: '#1E293B',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginBottom: 10,
    },
    descriptionInput: {
        height: 60,
        textAlignVertical: 'top',
    },
    addButton: {
        backgroundColor: '#EFF6FF',
        borderColor: '#3B82F6',
        borderWidth: 1,
        borderRadius: 12,
        padding: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
    },
    addButtonText: {
        color: '#3B82F6',
        fontSize: 16,
        fontWeight: '500',
    },
    collapsibleHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 4,
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
    timeSlotsContainer: {
        marginTop: 8,
    },
    timeSlotWrapper: {
        marginBottom: 12,
    },
    timeSlotBox: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    timeSlotCheckbox: {
        marginRight: 10,
    },
    timeSlotRow: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderRadius: 8,
        padding: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    selectedTimeSlot: {
        backgroundColor: '#EFF6FF',
        borderColor: '#BFDBFE',
    },
    timeSlotInfo: {
        flex: 1,
    },
    timeSlotText: {
        fontSize: 16,
        color: '#1E293B',
    },
    selectedTimeSlotText: {
        color: '#1E40AF',
        fontWeight: '500',
    },
    timeSlotPriceInput: {
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        padding: 10,
        fontSize: 14,
        color: '#1E293B',
        borderWidth: 1,
        borderColor: '#BFDBFE',
        marginTop: 4,
        marginLeft: 34,
    },
    collapseButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        marginTop: 8,
    },
    collapseButtonText: {
        color: '#6B7280',
        fontSize: 14,
        marginRight: 4,
    },
    uploadButton: {
        backgroundColor: '#EFF6FF',
        borderColor: '#3B82F6',
        borderWidth: 1,
        borderStyle: 'dashed',
        borderRadius: 12,
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    }, uploadText: {
        color: '#3B82F6',
        fontSize: 16,
        fontWeight: '500',
        marginTop: 4,
    }, uploadSubtext: {
        color: '#6B7280',
        fontSize: 12,
        marginTop: 4,
        fontStyle: 'italic',
    },
    imageList: {
        marginBottom: 8,
    },
    imageContainer: {
        position: 'relative',
        marginRight: 12,
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        width: 120,
        height: 120,
    },
    image: {
        width: 120,
        height: 120,
        borderRadius: 12,
    },
    imageOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 8,
    }, mainImageBadge: {
        backgroundColor: 'rgba(59, 130, 246, 0.7)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        alignSelf: 'flex-start',
    },
    mainImageText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '600',
    },
    newImageBadge: {
        backgroundColor: 'rgba(34, 197, 94, 0.7)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        alignSelf: 'flex-start',
        marginTop: 4,
    }, newImageText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '600',
    },
    removeButton: {
        position: 'absolute',
        top: 4,
        right: 4,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        width: 30,
        height: 30,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
    },
    imageIdText: {
        position: 'absolute',
        bottom: 4,
        right: 4,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        color: '#FFFFFF',
        fontSize: 10,
        padding: 2,
        borderRadius: 4,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 40,
    },
    resetButton: {
        flex: 1,
        backgroundColor: '#F1F5F9',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
        borderWidth: 1,
        borderColor: '#CBD5E1',
    },
    resetButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#64748B',
    },
    submitButton: {
        flex: 1,
        backgroundColor: '#3B82F6',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 10,
    },
    submitText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    disabledButton: {
        backgroundColor: '#93C5FD',
        opacity: 0.7,
    },
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '80%',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#1E293B',
        textAlign: 'center',
        marginBottom: 16,
    },
    modalMessage: {
        fontSize: 16,
        color: '#4B5563',
        textAlign: 'center',
        marginBottom: 24,
    },
    modalButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    modalButton: {
        flex: 1,
        borderRadius: 8,
        padding: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelButton: {
        backgroundColor: '#F1F5F9',
        marginRight: 8,
        borderWidth: 1,
        borderColor: '#CBD5E1',
    },
    confirmButton: {
        backgroundColor: '#3B82F6',
        marginLeft: 8,
    },
    cancelButtonText: {
        color: '#64748B',
        fontSize: 16,
        fontWeight: '500',
    },
    confirmButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '500',
    },
    successMessageContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        zIndex: 1000,
    },
    successMessageContent: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 4,
    },
    successMessageText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1E293B',
        textAlign: 'center',
        marginTop: 12,
    },
});