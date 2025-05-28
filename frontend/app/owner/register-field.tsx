import React, { useState } from 'react';
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
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import useRegister from '../../hooks/useRegister';

// Helper function để format thời gian
const formatTime = (timeString: string) => {
  const hour = parseInt(timeString.substring(0, 2));
  const minute = timeString.substring(3, 5);

  // Chuyển đổi giờ 24:00 thành 00:00
  if (hour === 24) {
    return `00:${minute}`;
  }

  return `${hour.toString().padStart(2, '0')}:${minute}`;
};

export default function RegisterField() {
  const router = useRouter();
  const [showTimeSlots, setShowTimeSlots] = useState(false);
  const {
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
  } = useRegister();

  const handleSubmit = async () => {
    await submitField(() => router.push('/owner/dashboard'));
  };

  const toggleTimeSlotsVisibility = () => {
    setShowTimeSlots(prev => !prev);
  };

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


        <Text style={styles.title}>Đăng ký sân tập</Text>


        <View style={styles.formContainer}>

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
                    if (currentCount < 10) {
                      updateFieldData('subFieldCount', (currentCount + 1).toString());
                    }
                  }}
                  disabled={fieldData.subFieldCount === '10'}
                >
                  <Text style={[styles.countButtonText, fieldData.subFieldCount === '10' && styles.disabledText]}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>


          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Dịch vụ thêm</Text>
            <View style={styles.sectionContent}>

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


              <TouchableOpacity
                style={styles.addButton}
                onPress={() => addService()}
                activeOpacity={0.7}
              >
                <Text style={styles.addButtonText}>Thêm dịch vụ mới</Text>
              </TouchableOpacity>
            </View>
          </View>          <View style={styles.sectionContainer}>
            <TouchableOpacity
              style={styles.collapsibleHeader}
              onPress={toggleTimeSlotsVisibility}
              activeOpacity={0.7}
            >
              <Text style={styles.sectionTitle}>Nhập khung giờ & giá sân</Text>
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
                  value={fieldData.price}
                  onChangeText={(text) => updateDefaultPrice(text)}
                  placeholder="Nhập giá (VD: 250000)"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                />

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

                    <TouchableOpacity
                      style={styles.collapseButton}
                      onPress={toggleTimeSlotsVisibility}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.collapseButtonText}>Rút gọn</Text>
                      <Ionicons name="chevron-up" size={16} color="#6B7280" />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
          </View>


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
              />
            </View>
          </View>
        </View>


        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.disabledButton]}
          onPress={handleSubmit}
          disabled={isSubmitting}
          activeOpacity={0.7}
        >
          <Text style={styles.submitText}>
            {isSubmitting ? 'Đang xử lý...' : 'Đăng ký sân'}
          </Text>
        </TouchableOpacity>
      </ScrollView>


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
  }, addButton: {
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
  }, collapsibleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 4,
    marginBottom: 16,
  },
  collapseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginTop: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  collapseButtonText: {
    fontSize: 14,
    color: '#6B7280',
    marginRight: 4,
    fontWeight: '500',
  },
});