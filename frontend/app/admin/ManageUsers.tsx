// ManageUsers.tsx
import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function ManageUsers() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Quản lý người dùng</Text>
      {/* Nội dung quản lý người dùng tại đây */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
});
