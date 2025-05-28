import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="register" />
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="owner" />
      <Stack.Screen name="customer" />
      <Stack.Screen name="admin" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
