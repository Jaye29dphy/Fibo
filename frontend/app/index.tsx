import { useState } from "react";
import { View, Text, TextInput, Button, StyleSheet, Alert } from "react-native";
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
  const [error, setError] = useState<string | null>(null); // ✅ Lưu lỗi đăng nhập

  const handleLogin = async () => {
    setError(null); // Xóa lỗi cũ trước khi gửi request

    try {
      const response = await fetch("http://localhost:5000/api/auth/login", {
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
    <View style={styles.container}>
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

      {error && <Text style={styles.error}>{error}</Text>} {/* ✅ Hiển thị lỗi */}

      <Button title="Đăng Nhập" onPress={handleLogin} />

      <Text onPress={() => router.push("/register")} style={styles.link}>
        Chưa có tài khoản? Đăng ký
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  input: {
    width: "100%",
    padding: 10,
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
    color: "blue",
    textDecorationLine: "underline",
  },
});
