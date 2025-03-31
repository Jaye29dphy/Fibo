import React, { useState } from 'react';
import { View, TextInput, Button, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { sendOtp } from '../constants/apiService';
import { Ionicons } from '@expo/vector-icons';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const router = useRouter();

  const validateEmail = (email: string) => {
    const emailRegex = /^[\w.-]+@[\w.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      return false;
    }
    if (email.endsWith('.c') || email.endsWith('.co' )) {
      return false;
    }
    return true;
  };

  const handleSendOtp = async () => {
    if (!email) {
      setError('Vui lòng nhập email');
      return;
    }
    
    if (!validateEmail(email)) {
      setError('Email không hợp lệ. Vui lòng nhập đúng định dạng email.');
      return;
    }

    try {
      const response = await sendOtp(email);
      setMessage('Mã OTP đã được gửi. Kiểm tra email của bạn!');
      setError('');
      // Truyền email qua params khi điều hướng
      setTimeout(() => {
        router.push({ pathname: '/change-password', params: { email } });
      }, 2000);
    } catch (err: any) {
      setMessage('');
      setError(err.message || 'Lỗi khi gửi OTP. Thử lại sau!');
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color="black" />
      </TouchableOpacity>
      <Text style={styles.header}>Gửi mã OTP</Text>
      <Text style={styles.label}>Nhập email của bạn</Text>
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        style={styles.input}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {message ? <Text style={styles.success}>{message}</Text> : null}
      <Button title="Gửi mã OTP" onPress={handleSendOtp} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    flex: 1,
    justifyContent: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    zIndex: 1, // Đảm bảo nút back hiển thị trên cùng
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#333',
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 4,
    marginBottom: 10,
    paddingLeft: 8,
  },
  error: {
    color: 'red',
    marginBottom: 10,
  },
  success: {
    color: 'green',
    marginBottom: 10,
  },
});

export default ForgotPassword;