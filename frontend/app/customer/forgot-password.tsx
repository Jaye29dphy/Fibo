import React, { useState, useEffect } from 'react';
import { View, TextInput, StyleSheet, Text, TouchableOpacity, ImageBackground } from 'react-native';
import { useRouter } from 'expo-router';
import { sendOtp } from '@/constants/apiService';
import { Ionicons } from '@expo/vector-icons';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const router = useRouter();

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (countdown === 0) {
      setIsButtonDisabled(false);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const validateEmail = (email: string) => {
    const emailRegex = /^[\w.-]+@[\w.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      return false;
    }
    if (email.endsWith('.c') || email.endsWith('.co')) {
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
      setIsButtonDisabled(true);
      setCountdown(60);
      setTimeout(() => {
        router.push({ pathname: '/customer/change-password', params: { email } });
      }, 2000);
    } catch (err: any) {
      setMessage('');
      setError(err.message || 'Lỗi khi gửi OTP. Thử lại sau!');
    }
  };

  return (
    <ImageBackground
      source={require("../../assets/images/anhbiakhach.png")} // Sử dụng cùng hình nền với màn hình đăng nhập
      style={styles.backgroundImage}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <View style={styles.container}>
          <Text style={styles.header}>Gửi mã OTP</Text>
          <Text style={styles.label}>Nhập email của bạn</Text>
          <TextInput
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            style={styles.input}
            placeholderTextColor="#888"
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          {message ? <Text style={styles.success}>{message}</Text> : null}
          {countdown > 0 && (
            <Text style={styles.countdown}>Vui lòng đợi {countdown} giây để gửi lại OTP</Text>
          )}
          <TouchableOpacity
            style={[styles.sendButton, isButtonDisabled && styles.disabledButton]}
            onPress={handleSendOtp}
            disabled={isButtonDisabled}
          >
            <Text style={styles.sendButtonText}>Gửi mã OTP</Text>
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
  countdown: {
    color: "#ffffff",
    fontSize: 14,
    marginBottom: 15,
    textAlign: "center",
    fontWeight: "500",
  },
  sendButton: {
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
  sendButtonText: {
    fontSize: 18,
    color: "#ffffff",
    fontWeight: "600",
  },
  disabledButton: {
    backgroundColor: "#cccccc",
  },
});

export default ForgotPassword;