// app/owner/index.tsx
import React, { useState, useLayoutEffect } from "react";
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
import { useRouter, useNavigation } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { loginUser } from "../../constants/apiService";

export default function OwnerLoginScreen() {
  const router = useRouter();
  const navigation = useNavigation(); // Sử dụng useNavigation để tùy chỉnh header
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);

  // Ẩn tiêu đề
  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false, // Ẩn header (bao gồm tiêu đề "index")
    });
  }, [navigation]);

  const handleLogin = async () => {
    setError(null);

    try {
      const data = await loginUser(email, password);
      console.log("📥 Response từ server:", data);

      if (!data.token || !data.user || !data.user.role) {
        setError("Dữ liệu trả về từ server không hợp lệ.");
        return;
      }

      await AsyncStorage.setItem("token", data.token);
      await AsyncStorage.setItem("role", data.user.role);
      console.log("Token và role đã được lưu:", { token: data.token, role: data.user.role });

      Alert.alert("✅ Thành công", "Đăng nhập thành công!");

      if (data.user.role === "owner") {
        router.replace("/owner/dashboard" as const);
      } else {
        setError("Tài khoản này không thuộc vai trò owner. Vui lòng đăng nhập bằng tài khoản phù hợp.");
        await AsyncStorage.removeItem("token");
        await AsyncStorage.removeItem("role");
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
        <View style={styles.header}>
          <ImageBackground
            source={require("../../assets/images/doituyencc.png")} // Logo MU
            style={styles.logo}
          />
          <Text style={styles.title}>FIBO - Owner</Text>
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

          <TouchableOpacity onPress={() => router.push("/owner/forgot-password" as const)}>
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

        <TouchableOpacity onPress={() => router.push("/owner/register" as const)} style={styles.registerButton}>
          <Text style={styles.registerText}>Đăng ký</Text>
        </TouchableOpacity>
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
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingBottom: 40,
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
    justifyContent: "space-between",
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
    marginBottom: 10,
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