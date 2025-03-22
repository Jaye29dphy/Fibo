import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AntDesign } from "@expo/vector-icons";

type User = {
  id: number;
  name: string;
  email: string;
};

export default function ProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true); // State loading cho xác thực

  useEffect(() => {
    const checkAuth = async () => {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        router.replace('/'); // Quay lại màn đăng nhập nếu token không tồn tại
        return;
      }

      try {
        const response = await fetch('http://localhost:5000/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (!response.ok) throw new Error('Unauthorized');

        setUser(data); // Lưu thông tin người dùng sau khi xác thực thành công
      } catch (error) {
        await AsyncStorage.removeItem('token'); // Xóa token nếu xác thực thất bại
        router.replace('/');
      } finally {
        setLoading(false); // Dừng trạng thái loading
      }
    };

    checkAuth();
  }, []);
  const handleLogout = () => {
    router.replace('/');
  };



  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#42ba96" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <AntDesign
          name="arrowleft"
          size={24}
          color="white"
          onPress={() => router.back()} // Điều hướng quay lại
        />
        <Text style={styles.title}>Hồ Sơ</Text>
      </View>
      <Image
        source={{ uri: 'https://randomuser.me/api/portraits/women/79.jpg' }} // Ảnh đại diện mẫu
        style={styles.avatar}
      />
      <Text style={styles.infoText}>Tên người dùng: {user?.name || 'User'}</Text>
      <Text style={styles.infoText}>Email: {user?.email}</Text>

      <TouchableOpacity style={styles.button} onPress={handleLogout}>
        <Text style={styles.buttonText}>Đăng xuất</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
  },
  header: {
    backgroundColor: "#42BA96",
    paddingVertical: 15,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  title: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
    marginLeft: 10,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignSelf: 'center',
    marginVertical: 20,
  },
  infoText: {
    fontSize: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#42ba96',
    paddingVertical: 12,
    borderRadius: 20,
    marginTop: 20,
    width: '100%',
    alignSelf: 'center',
  },
  buttonText: {
    textAlign: 'center',
    color: '#fff',
    fontSize: 16,
  },
});