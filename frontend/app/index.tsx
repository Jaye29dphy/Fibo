// LoginScreen.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  ImageBackground,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { loginUser } from "../constants/apiService";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);

  const handleLogin = async () => {
    setError(null);

    try {
      const data = await loginUser(email, password);
      console.log("📥 Response từ server:", data);

      if (data.token) {
        await AsyncStorage.setItem("token", data.token);
        Alert.alert("✅ Thành công", "Đăng nhập thành công!");
        router.push("/dashboard");
      } else {
        setError("Không nhận được token từ server.");
      }
    } catch (error: any) {
      console.error("🔥 Lỗi đăng nhập:", error.message);
      setError(error.message || "Không thể kết nối đến server!");
    }
  };

  return (
    <ImageBackground
      source={require("../assets/images/anhbiakhach.jpg")}
      style={styles.backgroundImage}
    >
      <View style={styles.overlay}>
        <View style={styles.header}>
          <ImageBackground
            source={require("../assets/images/doituyencc.png")} // Logo MU
            style={styles.logo}
          />
          <Text style={styles.title}>FIBO</Text>
        </View>

        <Text style={styles.inputLabel}>Tài khoản*</Text>
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text style={styles.inputLabel}>Mật khẩu*</Text>
        <TextInput
          style={styles.input}
          placeholder="Mật khẩu"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <View style={styles.rememberMeContainer}>
          <TouchableOpacity onPress={() => setRememberMe(!rememberMe)}>
            <Text style={styles.rememberMeText}>
              {rememberMe ? "☑" : "☐"} Remember me
            </Text>
          </TouchableOpacity>

          {/* Thêm "Quên mật khẩu?" bên phải */}
          <TouchableOpacity onPress={() => router.push("/forgot-password")}>
            <Text style={styles.forgotPasswordText}>Quên mật khẩu?</Text>
          </TouchableOpacity>
        </View>

        {error && <Text style={styles.error}>{error}</Text>}

        <View style={styles.buttonsContainer}>
          <Button title="Đăng Nhập" onPress={handleLogin} color="#ff6200" />
        </View>

        <View style={styles.orContainer}>
          <View style={styles.line}></View>
          <Text style={styles.orText}>OR</Text>
          <View style={styles.line}></View>
        </View>

        <TouchableOpacity onPress={() => router.push("/register")} style={styles.registerButton}>
          <Text style={styles.registerText}>Đăng ký</Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
}

// Phần styles đã cải tiến
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
    justifyContent: "space-between", // Thay đổi để căn chỉnh phần tử xuống dưới
    alignItems: "center",
    padding: 20,
    paddingBottom: 40, // Cung cấp không gian cho các nút ở dưới cùng
  },
  header: {
    alignItems: "center",
    marginBottom: 30,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "white",
  },
  inputLabel: {
    alignSelf: "flex-start",
    color: "white",
    fontSize: 14,
  },
  input: {
    width: "100%",
    padding: 10,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "gray",
    
  },
  rememberMeContainer: {
    flexDirection: "row",
    justifyContent: "space-between", // Căn lề để hai phần nhớ tôi và quên mật khẩu nằm cạnh nhau
    alignItems: "center",
    width: "100%",
    marginBottom: 10,
  },
  rememberMeText: {
    color: "white",
    fontSize: 16,
  },
  forgotPasswordText: {
    color: "lightblue",
    fontSize: 16,
    textDecorationLine: "underline",
  },
  error: {
    color: "red",
    marginBottom: 10,
  },
  buttonsContainer: {
    width: "100%",
    marginBottom: 10, // Thêm khoảng cách dưới nút đăng nhập
  },
  orContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
    width: "100%",
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: "white",
  },
  orText: {
    color: "white",
    fontSize: 16,
    paddingHorizontal: 10,
  },
  registerButton: {
    width: "100%",
    paddingVertical: 15,
    backgroundColor: "#ff0040",
    borderRadius: 5,
    marginTop: 20,
    alignItems: "center",
  },
  registerText: {
    fontSize: 18,
    color: "white",
    fontWeight: "bold",
  },
});
