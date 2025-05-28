import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import OwnerBottomTabs from "./BottomTabs"; // Adjust the import path if needed

export default function OwnerDashboard() {
  const router = useRouter();

  return (
    <View style={styles.container}>

      <View style={styles.header}>
        <Text style={styles.title}>FIBO</Text>
        <Text style={styles.subtitle}>Bạn muốn làm gì?</Text>
      </View>


      <View style={styles.buttonContainer}>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push("/owner/register-field")}
        >
          <Ionicons name="add-circle-outline" size={24} color="#000" />
          <Text style={styles.buttonText}>Đăng ký sân</Text>
        </TouchableOpacity>


        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push("/owner/field-details")}
        >
          <Ionicons name="cloud-upload-outline" size={24} color="#000" />
          <Text style={styles.buttonText}>Cập nhật thông tin sân</Text>
        </TouchableOpacity>


        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push("/owner/manage-schedule")}
        >
          <Ionicons name="calendar-outline" size={24} color="#000" />
          <Text style={styles.buttonText}>Quản lý lịch</Text>
        </TouchableOpacity>
      </View>


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