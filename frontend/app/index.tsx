import React, { useState } from "react";
import { View, Text, TextInput, Button, StyleSheet, Alert, ImageBackground } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

type User = {
  id: number;
  full_name: string;
  email: string;
  role: string;
  phone: string;
};

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setError(null);

    try {
      const response = await fetch("http://192.168.47.204:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      console.log("📥 Response từ server:", data);

      if (response.ok) {
        if (data.token) {
          await AsyncStorage.setItem("token", data.token);
          setUser(data.user);
          Alert.alert("✅ Thành công", "Đăng nhập thành công!");
          router.push("/dashboard");
        } else {
          setError("Không nhận được token từ server.");
        }
      } else {
        console.log("❌ Lỗi đăng nhập:", data.error);
        setError(data.error || "Email hoặc mật khẩu không đúng!");
      }
    } catch (error) {
      console.error("🔥 Lỗi đăng nhập:", error);
      setError("Không thể kết nối đến server!");
    }
  };

  return (
    <ImageBackground
      source={require("../assets/images/anhbiakhach.jpg")}
      style={styles.backgroundImage}
    >
      <View style={styles.overlay}>
        <Text style={styles.title}>Đăng Nhập</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Mật khẩu"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        {error && <Text style={styles.error}>{error}</Text>}

        <Button title="Đăng Nhập" onPress={handleLogin} />

        <Text onPress={() => router.push("/register")} style={styles.link}>
          Chưa có tài khoản? Đăng ký
        </Text>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: "100%",
    height: "100%",
    resizeMode: "cover", // Ảnh sẽ tự động phóng to để lấp kín màn hình
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)", // Tạo lớp phủ mờ
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white", // Đổi chữ thành màu trắng để nổi bật trên nền tối
    marginBottom: 20,
  },
  input: {
    width: "100%",
    padding: 10,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "gray",
    borderRadius: 5,
    marginBottom: 10,
  },
  error: {
    color: "red",
    marginBottom: 10,
  },
  link: {
    marginTop: 10,
    color: "lightblue",
    textDecorationLine: "underline",
  },
});
