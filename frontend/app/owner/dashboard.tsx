import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import OwnerBottomTabs from "./BottomTabs"; // Adjust the import path if needed

export default function OwnerDashboard() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>FIBO</Text>
        <Text style={styles.subtitle}>Chủ sân muốn làm gì?</Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push("/owner/update-field-info")}
        >
          <Ionicons name="cloud-upload-outline" size={24} color="#000" />
          <Text style={styles.buttonText}>Cập nhật thông tin sân</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push("/owner/handle-requests")}
        >
          <Ionicons name="mail-outline" size={24} color="#000" />
          <Text style={styles.buttonText}>Xử lý yêu cầu nại</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push("/owner/revenue")}
        >
          <Ionicons name="camera-outline" size={24} color="#000" />
          <Text style={styles.buttonText}>Doanh thu</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom Tabs */}
      <OwnerBottomTabs />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    alignItems: "center",
    marginTop: 40,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#3F51B5",
  },
  subtitle: {
    fontSize: 18,
    color: "#3F51B5",
    marginTop: 10,
  },
  buttonContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 60, // Add margin to prevent overlap with bottom tabs
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#3F51B5",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginVertical: 10,
    width: "80%",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    marginLeft: 10,
  },
});