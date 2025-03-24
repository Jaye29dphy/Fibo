import React, { useState } from 'react';
import { View, TextInput, Button, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { sendOtp } from '../constants/apiService';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const router = useRouter();

  const handleSendOtp = async () => {
    if (!email) {
      setError('Vui lòng nhập email');
      return;
    }

    try {
      const response = await sendOtp(email);
      setMessage('Mã OTP đã được gửi. Kiểm tra email của bạn!');
      setError('');
      // Điều hướng sang màn hình thay đổi mật khẩu
      setTimeout(() => {
        router.push('/change-password'); // Chuyển sang màn đổi mật khẩu
      }, 2000);
    } catch (err: any) {
      setMessage('');
      setError(err.message || 'Lỗi khi gửi OTP. Thử lại sau!');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Nhập email của bạn</Text>
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        style={styles.input}
      />
      {error && <Text style={styles.error}>{error}</Text>}
      {message && <Text style={styles.success}>{message}</Text>}
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
