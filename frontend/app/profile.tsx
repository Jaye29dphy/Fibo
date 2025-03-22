import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AntDesign } from "@expo/vector-icons";

type User = {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  created_at: string;
};

export default function ProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        router.replace('/');
        return;
      }

      try {
        const response = await fetch('http://localhost:5000/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (!response.ok) throw new Error('Unauthorized');

        setUser({
          id: data.id,
          full_name: data.full_name,
          email: data.email,
          phone: data.phone,
          role: data.role,
          status: data.status,
          created_at: data.created_at,
        });
      } catch (error) {
        await AsyncStorage.removeItem('token');
        router.replace('/');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const handleLogout = async () => {
    await AsyncStorage.removeItem('token');
    router.replace('/');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "green";
      case "inactive": return "gray";
      case "banned": return "red";
      default: return "black";
    }
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
          onPress={() => router.back()}
        />
        <Text style={styles.title}>Hồ Sơ</Text>
      </View>

      <Image source={{ uri: 'https://randomuser.me/api/portraits/women/79.jpg' }} style={styles.avatar} />

      {/* Thông tin cá nhân */}
      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>THÔNG TIN CÁ NHÂN</Text>
        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <AntDesign name="user" size={20} color="#333" />
          <Text style={styles.label}>Tên đầy đủ:</Text>
          <Text style={styles.value}>{user?.full_name || 'N/A'}</Text>
        </View>

        <View style={styles.infoRow}>
          <AntDesign name="mail" size={20} color="#333" />
          <Text style={styles.label}>Email:</Text>
          <Text style={styles.value}>{user?.email || 'N/A'}</Text>
        </View>

        <View style={styles.infoRow}>
          <AntDesign name="phone" size={20} color="#333" />
          <Text style={styles.label}>Số điện thoại:</Text>
          <Text style={styles.value}>{user?.phone || 'N/A'}</Text>
        </View>

        <View style={styles.infoRow}>
          <AntDesign name="idcard" size={20} color="#333" />
          <Text style={styles.label}>Vai trò:</Text>
          <Text style={styles.value}>{user?.role || 'N/A'}</Text>
        </View>

        <View style={styles.infoRow}>
          <AntDesign name="infocirlceo" size={20} color="#333" />
          <Text style={styles.label}>Trạng thái:</Text>
          <Text style={styles.value}>{user?.status || 'N/A'}</Text>
          <View style={styles.statusDotContainer}>
            <View style={[styles.statusDot, { backgroundColor: getStatusColor(user?.status || '') }]} />
          </View>
        </View>


        <View style={styles.infoRow}>
          <AntDesign name="calendar" size={20} color="#333" />
          <Text style={styles.label}>Thời gian tạo tài khoản:</Text>
          <Text style={styles.value}>{user?.created_at ? new Date(user.created_at).toLocaleString("vi-VN") : 'N/A'}</Text>
        </View>
      </View>

      {/* Nút đăng xuất */}
      <TouchableOpacity
        style={styles.button}
        onPress={handleLogout}
        activeOpacity={0.7}
      >
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
  infoBox: {
    backgroundColor: "white",
    padding: 15,
    borderRadius: 10,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 5,
  },
  divider: {
    height: 2,
    backgroundColor: "#ccc",
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  label: {
    flex: 1,
    fontSize: 14,
    color: "#555",
    marginLeft: 10,
  },
  value: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    textAlign: "right",
    flex: 1.5,
  },
  statusDotContainer: {
    marginLeft: 8, // Tạo khoảng cách giữa status và chấm tròn
    justifyContent: 'center', // Căn giữa theo chiều dọc
    alignItems: 'center',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  button: {
    backgroundColor: '#cb0909',
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

  buttonPress: {
    backgroundColor: '#a10707',
  },
});
