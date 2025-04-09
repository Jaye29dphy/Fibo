// app/owner/_layout.tsx
import { Tabs } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import { useEffect } from 'react';
import { usePathname } from 'expo-router';

export default function OwnerLayout() {
  const pathname = usePathname(); // Lấy đường dẫn hiện tại

  // Ẩn bottom tab trên màn hình đăng nhập (/owner)
  const hideTabBar = pathname === '/owner';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#42ba96',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          display: hideTabBar ? 'none' : 'flex', // Ẩn tab bar nếu ở màn hình /owner
        },
      }}
    >
      <Tabs.Screen
        name="schedule"
        options={{
          tabBarLabel: 'Quản lý lịch',
          tabBarIcon: ({ color, size }) => (
            <FontAwesome5 name="calendar-alt" size={size} color={color} />
          ),
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="field-info"
        options={{
          tabBarLabel: 'Thông tin sân',
          tabBarIcon: ({ color, size }) => (
            <FontAwesome5 name="info-circle" size={size} color={color} />
          ),
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          tabBarLabel: 'Thông báo',
          tabBarIcon: ({ color, size }) => (
            <FontAwesome5 name="bell" size={size} color={color} />
          ),
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarLabel: 'Hồ sơ',
          tabBarIcon: ({ color, size }) => (
            <FontAwesome5 name="user" size={size} color={color} />
          ),
          headerShown: false,
        }}
      />
      {/* Ẩn tab bar cho các màn hình không cần hiển thị tab */}
      <Tabs.Screen
        name="index"
        options={{
          href: null, // Ẩn màn hình đăng nhập khỏi tab bar
        }}
      />
      <Tabs.Screen
        name="register"
        options={{
          href: null, // Ẩn màn hình đăng ký khỏi tab bar
        }}
      />
      <Tabs.Screen
        name="forgot-password"
        options={{
          href: null, // Ẩn màn hình quên mật khẩu khỏi tab bar
        }}
      />
      <Tabs.Screen
        name="change-password"
        options={{
          href: null, // Ẩn màn hình đổi mật khẩu khỏi tab bar
        }}
      />
      <Tabs.Screen
        name="confirmdelete"
        options={{
          href: null, // Ẩn màn hình xác nhận xóa tài khoản khỏi tab bar
        }}
      />
      <Tabs.Screen
        name="dashboard"
        options={{
          href: null, // Ẩn màn hình dashboard khỏi tab bar (nếu không cần hiển thị)
        }}
      />
    </Tabs>
  );
}