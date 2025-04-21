import React, { useState } from 'react';
import { View, TextInput, StyleSheet, Text, TouchableOpacity, ImageBackground } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { changePassword } from '@/constants/apiService';
import { Ionicons } from '@expo/vector-icons';

const ChangePassword = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const emailFromParams = params.email as string;
  const [email, setEmail] = useState(emailFromParams || '');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleChangePassword = async () => {
    if (!email || !otp || !newPassword || !confirmPassword) {
      setError('Vui lòng điền đủ thông tin');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Mật khẩu mới và mật khẩu xác nhận không khớp');
      return;
    }

    try {
      const response = await changePassword(email, newPassword, otp);
      setMessage(response.message || 'Mật khẩu đã được thay đổi thành công!');
      setError('');
      setTimeout(() => {
        router.push('/customer');
      }, 2000);
    } catch (err: any) {
      setMessage('');
      setError(err.message || 'Lỗi khi thay đổi mật khẩu. Thử lại sau!');
    }
  };

  return (
    <ImageBackground
      source={require("../../assets/images/anhbiakhach.png")} // Sử dụng cùng hình nền với các màn hình khác
      style={styles.backgroundImage}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <View style={styles.container}>
          <Text style={styles.header}>Thay đổi mật khẩu</Text>
          <Text style={styles.label}>Email của bạn</Text>
          <TextInput
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            style={[styles.input, styles.disabledInput]}
            placeholderTextColor="#888"
            editable={false}
          />
          <Text style={styles.label}>Nhập mã OTP</Text>
          <TextInput
            placeholder="Mã OTP"
            value={otp}
            onChangeText={setOtp}
            keyboardType="numeric"
            style={styles.input}
            placeholderTextColor="#888"
          />
          <Text style={styles.label}>Nhập mật khẩu mới</Text>
          <TextInput
            placeholder="Mật khẩu mới"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
            style={styles.input}
            placeholderTextColor="#888"
          />
          <Text style={styles.label}>Xác nhận mật khẩu mới</Text>
          <TextInput
            placeholder="Xác nhận mật khẩu"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            style={styles.input}
            placeholderTextColor="#888"
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          {message ? <Text style={styles.success}>{message}</Text> : null}
          <TouchableOpacity
            style={styles.changePasswordButton}
            onPress={handleChangePassword}
          >
            <Text style={styles.changePasswordButtonText}>Thay đổi mật khẩu</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  container: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "rgba(255, 255, 255, 0.2)", // Lớp phủ trắng trong suốt
    borderRadius: 15,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    zIndex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 20,
    padding: 8,
  },
  header: {
    fontSize: 28,
    fontWeight: "700",
    color: "#ffffff",
    textAlign: "center",
    marginBottom: 30,
    fontFamily: "Poppins",
  },
  label: {
    fontSize: 16,
    color: "#ffffff",
    marginBottom: 8,
    fontWeight: "500",
  },
  input: {
    width: "100%",
    padding: 12,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d1d1d1",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 20,
    fontSize: 16,
    color: "#333",
  },
  disabledInput: {
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    color: "#666",
  },
  error: {
    color: "#ff5252",
    fontSize: 14,
    marginBottom: 15,
    textAlign: "center",
  },
  success: {
    color: "#4caf50",
    fontSize: 14,
    marginBottom: 15,
    textAlign: "center",
  },
  changePasswordButton: {
    width: "100%",
    paddingVertical: 15,
    backgroundColor: "#ff6200",
    borderRadius: 8,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  changePasswordButtonText: {
    fontSize: 18,
    color: "#ffffff",
    fontWeight: "600",
  },
});

export default ChangePassword;