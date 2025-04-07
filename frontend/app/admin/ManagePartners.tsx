// ManagePartners.tsx
import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function ManagePartners() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Quản lý sân / đối tác</Text>
      {/* Nội dung quản lý đối tác tại đây */}
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