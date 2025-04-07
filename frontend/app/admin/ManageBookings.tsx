// ManageBookings.tsx
import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function ManageBookings() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Quản lý đơn đặt sân</Text>
      {/* Nội dung quản lý đơn tại đây */}
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
