import React, { useState } from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";

interface AdminMenuProps {
  onSelect: (tab: string) => void;
  onToggle: (isOpen: boolean) => void; // Callback để thông báo toggle
  isOpen: boolean; // Trạng thái mở/đóng menu
}

export default function AdminMenu({ onSelect, onToggle, isOpen }: AdminMenuProps) {
  return (
    <>
      <TouchableOpacity onPress={() => onToggle(!isOpen)} style={styles.toggleButton}>
        <Text style={styles.toggleText}>☰ Menu</Text>
      </TouchableOpacity>

      {isOpen && (
        <View style={styles.menu}>
          <Text style={styles.menuTitle}>Menu</Text>
          <TouchableOpacity onPress={() => { onSelect("users"); onToggle(false); }} style={styles.button}>
            <Text style={styles.buttonText}>Quản lý người dùng</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { onSelect("partners"); onToggle(false); }} style={styles.button}>
            <Text style={styles.buttonText}>Quản lý sân</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { onSelect("bookings"); onToggle(false); }} style={styles.button}>
            <Text style={styles.buttonText}>Quản lý đơn đặt sân</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { onSelect("revenue"); onToggle(false); }} style={styles.button}>
            <Text style={styles.buttonText}>Quản lý doanh thu</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { onSelect("feedback"); onToggle(false); }} style={styles.button}>
            <Text style={styles.buttonText}>Quản lý phản hồi</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { onSelect("notifications"); onToggle(false); }} style={styles.button}>
            <Text style={styles.buttonText}>Quản lý thông báo</Text>
          </TouchableOpacity>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  toggleButton: {
    position: "absolute",
    top: 60,
    left: 20,
    zIndex: 1000,
    padding: 10,
    backgroundColor: "#4CAF50",
    borderRadius: 5,
  },
  toggleText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
  },
  menu: {
    position: "absolute",
    top: 100,
    left: 20,
    width: 250,
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    zIndex: 999,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  menuTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
    color: "#333",
  },
  button: {
    backgroundColor: "#4CAF50",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginBottom: 10,
    alignItems: "center",
  },
  buttonText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
  },
});