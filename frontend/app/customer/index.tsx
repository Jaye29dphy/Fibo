import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  ImageBackground,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { loginUser } from "../../constants/apiService";

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
        await AsyncStorage.setItem("role", data.user.role);

        Alert.alert("✅ Thành công", "Đăng nhập thành công!");
  
        if (data.user.role === 'admin') {
          router.push("/admin/dashboard");
          router.replace("/admin/dashboard");
        } else if (data.user.role === 'owner') {
          router.push("/owner/dashboard");
          router.replace("/owner/dashboard");
        } else if (data.user.role === 'customer') {
          router.push("/customer/dashboard");
          router.replace("/customer/dashboard");
        } else {
          setError("Vai trò không xác định.");
        }
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
      source={require("../../assets/images/anhbiakhach.png")}
      style={styles.backgroundImage}
    >
      <View style={styles.overlay}>
        {/* Container bao quanh khu vực đăng nhập/đăng ký với lớp phủ trắng trong suốt */}
        <View style={styles.loginContainer}>
          <View style={styles.header}>
            <ImageBackground
              source={require("../../assets/images/doituyencc.png")}
              style={styles.logo}
            />
            <Text style={styles.title}>FIBO</Text>
          </View>

          <Text style={styles.inputLabel}>Tài khoản*</Text>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#888"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.inputLabel}>Mật khẩu*</Text>
          <TextInput
            style={styles.input}
            placeholder="Mật khẩu"
            placeholderTextColor="#888"
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

            <TouchableOpacity onPress={() => router.push("/customer/forgot-password")}>
              <Text style={styles.forgotPasswordText}>Quên mật khẩu?</Text>
            </TouchableOpacity>
          </View>

          {error && <Text style={styles.error}>{error}</Text>}

          <TouchableOpacity onPress={handleLogin} style={styles.loginButton}>
            <Text style={styles.loginButtonText}>Đăng Nhập</Text>
          </TouchableOpacity>

          <View style={styles.orContainer}>
            <View style={styles.line}></View>
            <Text style={styles.orText}>OR</Text>
            <View style={styles.line}></View>
          </View>

          <TouchableOpacity onPress={() => router.push("/customer/register")} style={styles.registerButton}>
            <Text style={styles.registerText}>Đăng ký</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)", // Lớp phủ tối bên ngoài
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  // Container bao quanh khu vực đăng nhập/đăng ký với lớp phủ trắng trong suốt
  loginContainer: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "rgba(255, 255, 255, 0.2)", // Lớp phủ trắng trong suốt (glassmorphism)
    borderRadius: 15,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)", // Viền nhẹ
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
    backdropFilter: "blur(10px)", // Hiệu ứng mờ (lưu ý: không hỗ trợ trực tiếp trong React Native, cần thư viện nếu muốn)
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 15,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#ffffff",
    fontFamily: "Poppins",
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  inputLabel: {
    alignSelf: "flex-start",
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
  },
  input: {
    width: "100%",
    padding: 12,
    backgroundColor: "rgba(255, 255, 255, 0.9)", // Trường nhập liệu hơi trong suốt
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
  rememberMeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginBottom: 20,
  },
  rememberMeText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "500",
  },
  forgotPasswordText: {
    color: "#40c4ff",
    fontSize: 16,
    fontWeight: "500",
    textDecorationLine: "underline",
  },
  error: {
    color: "#ff5252",
    fontSize: 14,
    marginBottom: 20,
    textAlign: "center",
  },
  loginButton: {
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
    marginBottom: 20,
  },
  loginButtonText: {
    fontSize: 18,
    color: "#ffffff",
    fontWeight: "600",
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
    backgroundColor: "rgba(255, 255, 255, 0.5)",
  },
  orText: {
    color: "#ffffff",
    fontSize: 16,
    paddingHorizontal: 15,
    fontWeight: "500",
  },
  registerButton: {
    width: "100%",
    paddingVertical: 15,
    backgroundColor: "#ff0040",
    borderRadius: 8,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  registerText: {
    fontSize: 18,
    color: "#ffffff",
    fontWeight: "600",
  },
});