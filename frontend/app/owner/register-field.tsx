import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Modal, FlatList } from 'react-native';
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
      {/* Nút Back */}
      <TouchableOpacity style={styles.backButton} onPress={() => router.push('/owner/dashboard')}>
        <Ionicons name="arrow-back" size={24} color="#000" />
      </TouchableOpacity>

      <Text style={styles.title}>Thông tin sân cho thuê</Text>

      <Text style={styles.label}>Tên sân</Text>
      <TextInput
        style={styles.input}
        value={fieldData.name}
        onChangeText={(text) => updateFieldData('name', text)}
        placeholder="Nhập tên sân"
      />

      <Text style={styles.label}>Vị trí</Text>
      <TextInput
        style={styles.input}
        value={fieldData.location}
        onChangeText={(text) => updateFieldData('location', text)}
        placeholder="Nhập vị trí"
      />

      <Text style={styles.label}>Loại sân</Text>
      <Picker
        selectedValue={fieldData.type}
        style={styles.picker}
        onValueChange={(itemValue) => updateFieldData('type', itemValue)}
      >
        <Picker.Item label="Bóng đá" value="football" />
        <Picker.Item label="Bóng rổ" value="basketball" />
        <Picker.Item label="Cầu lông" value="badminton" />
        <Picker.Item label="Tennis" value="tennis" />
      </Picker>

      <Text style={styles.label}>Đặc điểm sân</Text>
      <TextInput
        style={styles.input}
        value={fieldData.description}
        onChangeText={(text) => updateFieldData('description', text)}
        placeholder="Nhập đặc điểm sân"
        multiline
      />

      <Text style={styles.label}>Giá sân (thuê theo giờ)</Text>
      <TextInput
        style={styles.input}
        value={fieldData.price}
        onChangeText={(text) => updateFieldData('price', text)}
        placeholder="Nhập giá sân (VD: 250000)"
        keyboardType="numeric"
      />

      <Text style={styles.label}>Ảnh sân (nếu có)</Text>
      <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
        <Text style={styles.uploadText}>Tải ảnh</Text>
      </TouchableOpacity>

      {/* Hiển thị danh sách ảnh đã tải */}
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
              <Ionicons name="close-circle" size={24} color="red" />
            </TouchableOpacity>
          </View>
        )}
        keyExtractor={(item, index) => index.toString()}
        style={styles.imageList}
      />

      <TouchableOpacity
        style={[styles.submitButton, isSubmitting && styles.disabledButton]}
        onPress={handleSubmit}
        disabled={isSubmitting}
      >
        <Text style={styles.submitText}>{isSubmitting ? 'Đang gửi...' : 'SUBMIT'}</Text>
      </TouchableOpacity>

      {/* Pop-up Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, modalSuccess ? styles.modalSuccess : styles.modalError]}>
            <Text style={styles.modalText}>{modalMessage}</Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setModalVisible(false)}
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
    padding: 20,
    backgroundColor: '#fff',
  },
  backButton: {
    marginBottom: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  input: {
    borderBottomWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    fontSize: 16,
    marginBottom: 20,
  },
  picker: {
    borderBottomWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    fontSize: 16,
    marginBottom: 20,
  },
  uploadButton: {
    backgroundColor: '#ddd',
    padding: 10,
    alignItems: 'center',
    borderRadius: 5,
    marginBottom: 20,
  },
  uploadText: {
    fontSize: 16,
    color: '#000',
  },
  imageList: {
    marginBottom: 20,
  },
  imageContainer: {
    position: 'relative',
    marginRight: 10,
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 5,
  },
  removeButton: {
    position: 'absolute',
    top: -10,
    right: -10,
  },
  submitButton: {
    backgroundColor: '#000',
    padding: 15,
    alignItems: 'center',
    borderRadius: 5,
  },
  disabledButton: {
    backgroundColor: '#666',
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: 300,
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalSuccess: {
    backgroundColor: '#d4edda',
  },
  modalError: {
    backgroundColor: '#f8d7da',
  },
  modalText: {
    fontSize: 16,
    marginBottom: 15,
    textAlign: 'center',
  },
  modalButton: {
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 5,
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
  },
});