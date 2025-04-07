// ManageNotifications.tsx
import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function ManageNotifications() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Quản lý thông báo</Text>
      {/* Nội dung quản lý thông báo tại đây */}
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