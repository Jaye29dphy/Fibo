// ManageFeedback.tsx
import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function ManageFeedback() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Quản lý phản hồi</Text>
      {/* Nội dung quản lý phản hồi tại đây */}
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