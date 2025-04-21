import React from 'react';
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
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import useRegister from '../../hooks/useRegister';

export default function RegisterField() {
  const router = useRouter();
  const {
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
  } = useRegister();

  const handleSubmit = async () => {
    await submitField(() => router.push('/owner/dashboard'));
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Back Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.push('/owner/dashboard')}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={28} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Title */}
        <Text style={styles.title}>Đăng ký sân cho thuê</Text>

        {/* Form Fields */}
        <View style={styles.formContainer}>
          {/* Field Name */}
          <Text style={styles.label}>Tên sân</Text>
          <TextInput
            style={styles.input}
            value={fieldData.name}
            onChangeText={(text) => updateFieldData('name', text)}
            placeholder="Nhập tên sân"
            placeholderTextColor="#9CA3AF"
          />

          {/* Location */}
          <Text style={styles.label}>Vị trí</Text>
          <TextInput
            style={styles.input}
            value={fieldData.location}
            onChangeText={(text) => updateFieldData('location', text)}
            placeholder="Nhập vị trí"
            placeholderTextColor="#9CA3AF"
          />

          {/* Field Type */}
          <Text style={styles.label}>Loại sân</Text>
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

          {/* Description */}
          <Text style={styles.label}>Đặc điểm sân</Text>
          <TextInput
            style={[styles.input, styles.multilineInput]}
            value={fieldData.description}
            onChangeText={(text) => updateFieldData('description', text)}
            placeholder="Mô tả đặc điểm sân"
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={4}
          />

          {/* Price */}
          <Text style={styles.label}>Giá sân (theo giờ)</Text>
          <TextInput
            style={styles.input}
            value={fieldData.price}
            onChangeText={(text) => updateFieldData('price', text)}
            placeholder="Nhập giá (VD: 250000)"
            placeholderTextColor="#9CA3AF"
            keyboardType="numeric"
          />

          {/* Image Upload */}
          <Text style={styles.label}>Ảnh sân</Text>
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
          />
        </View>

        {/* Submit Button */}
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
    minHeight: 60, // Đảm bảo chiều cao tối thiểu
  },
  picker: {
    fontSize: 16,
    color: '#1E293B',
    height: 60, // Tăng chiều cao để trông cân đối
    paddingVertical: 10, // Thêm padding để text không bị chèn
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
});