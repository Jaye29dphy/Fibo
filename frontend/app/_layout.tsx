import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />       {/* Màn hình đăng nhập */}
      <Stack.Screen name="register" />    {/* Màn hình đăng ký */}
      <Stack.Screen name="dashboard" />   {/* Màn hình chính sau đăng nhập */}
    </Stack>
  );
}
