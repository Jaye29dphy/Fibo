import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_ENDPOINTS } from "../constants/apiConfig";

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

// Hook để lấy và quản lý thông tin người dùng đăng nhập
export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Lấy thông tin người dùng từ token lưu trong AsyncStorage
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) {
          setUser(null);
          setLoading(false);
          return;
        }

        const response = await fetch(API_ENDPOINTS.GET_USER, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Không thể lấy thông tin người dùng');
        }

        const data = await response.json();
        setUser(data.user);
      } catch (error) {
        console.error('Error fetching user info:', error);
        setError(error instanceof Error ? error.message : 'Đã có lỗi xảy ra');
      } finally {
        setLoading(false);
      }
    };

    fetchUserInfo();
  }, []);

  return { user, loading, error };
};

export const login = async (email: string, password: string) => {
  try {
    const response = await fetch(API_ENDPOINTS.LOGIN, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Đăng nhập thất bại!");
    }
    return data;
  } catch (error) {
    console.error("Lỗi đăng nhập:", error);
    return null;
  }
};
