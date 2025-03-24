import React, { useState } from 'react';
import { View, TextInput, Button, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { changePassword } from '../constants/apiService'; // Import hàm từ apiService

const ChangePassword = () => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');  // Thêm biến lưu trữ xác nhận mật khẩu
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const router = useRouter();

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
      // Sau khi đổi mật khẩu thành công, chuyển hướng về màn hình đăng nhập
      setTimeout(() => {
        router.push('/'); // Chuyển sang màn hình đăng nhập
      }, 2000);
    } catch (err: any) {
      setMessage('');
      setError(err.message || 'Lỗi khi thay đổi mật khẩu. Thử lại sau!');
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

      <Text style={styles.label}>Nhập mã OTP</Text>
      <TextInput
        placeholder="Mã OTP"
        value={otp}
        onChangeText={setOtp}
        keyboardType="numeric"
        style={styles.input}
      />

      <Text style={styles.label}>Nhập mật khẩu mới</Text>
      <TextInput
        placeholder="Mật khẩu mới"
        value={newPassword}
        onChangeText={setNewPassword}
        secureTextEntry
        style={styles.input}
      />

      <Text style={styles.label}>Xác nhận mật khẩu mới</Text>  {/* Trường xác nhận mật khẩu */}
      <TextInput
        placeholder="Xác nhận mật khẩu"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
        style={styles.input}
      />

      {error && <Text style={styles.error}>{error}</Text>}
      {message && <Text style={styles.success}>{message}</Text>}

      <Button title="Thay đổi mật khẩu" onPress={handleChangePassword} />
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

export default ChangePassword;
