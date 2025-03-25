import { View, Text, ScrollView, Image, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import React, { useState, useEffect } from "react";
import BottomTabs from "./BottomTabs";

interface Booking {
  id: number;
  fieldName: string;
  location: string;
  price: string;
  rating: number;
  time: string;
  status: "confirmed" | "cancelled";
  imageUrl: string;
}

const bookings: Booking[] = [
  {
    id: 1,
    fieldName: "Sân bóng đá Hà Đông 1",
    location: "Đâu đó ở Hà Đông",
    price: "400.000VND/h",
    rating: 4.5,
    time: "2025-03-30", // Định dạng YYYY-MM-DD để truyền vào calendar
    status: "confirmed",
    imageUrl: "https://via.placeholder.com/80",
  },
  {
    id: 2,
    fieldName: "Sân bóng đá Hà Đông 2",
    location: "Đâu đó ở Hà Đông",
    price: "400.000VND/h",
    rating: 4.0,
    time: "2025-03-27",
    status: "confirmed",
    imageUrl: "https://via.placeholder.com/80",
    
  },
  {
    id: 3,
    fieldName: "Sân bóng đá Hà Đông 1",
    location: "Đâu đó ở Hà Đông",
    price: "450.000VND/h",
    rating: 4.5,
    time: "2025-03-25",
    status: "cancelled",
    imageUrl: "https://via.placeholder.com/80",
  },
  {
    id: 4,
    fieldName: "Sân bóng rổ Bee Sport",
    location: "184 P.Vọng, Phương Liệt,Thanh Xuân, Hà Nội",
    price: "300.000VND/h",
    rating: 4.0,
    time: "2025-03-15",
    status: "confirmed",
    imageUrl: "https://via.placeholder.com/80",
  },
  {
    id: 5,
    fieldName: "Sân bóng đá Hà Đông 2",
    location: "Đâu đó ở Hà Đông",
    price: "450.000VND/h",
    rating: 4.5,
    time: "2025-02-25",
    status: "confirmed",
    imageUrl: "https://via.placeholder.com/80",
  },
  {
    id: 6,
    fieldName: "Sân cầu lông Sunset",
    location: "Hà Nam",
    price: "400.000VND/h",
    rating: 5.0,
    time: "2025-02-20",
    status: "confirmed",
    imageUrl: "https://via.placeholder.com/80",
  },
  {
    id: 7,
    fieldName: "Sân Pickleball Đỗ Phú Qúy",
    location: "Anh hẹn em pickleball, ta vờn nhau pickelball",
    price: "500.000VND/h",
    rating: 5.0,
    time: "2025-02-20",
    status: "cancelled",
    imageUrl: "https://via.placeholder.com/80",
  },
];

export default function CusCalendar() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        <Text style={styles.title}>Lịch đặt sân của bạn:</Text>
        <Text style={styles.note}>
          Lưu ý: chúng tôi sẽ không hoàn tiền nếu bạn không đến sân
        </Text>

        {bookings.map((booking) => (
          <TouchableOpacity
            key={booking.id}
            onPress={() => {
              const confirmedDates = bookings
                .filter((b) => b.status === "confirmed")
                .map((b) => b.time)
                .join(",");
              const cancelledDates = bookings
                .filter((b) => b.status === "cancelled")
                .map((b) => b.time)
                .join(",");
            
              router.push(
                `/calendar2?selectedDate=${booking.time}&confirmedDates=${confirmedDates}&cancelledDates=${cancelledDates}`
              );
            }}
            
            style={[
              styles.card,
              booking.status === "cancelled" ? styles.cancelled : styles.confirmed,
            ]}
          >
            <Image source={{ uri: booking.imageUrl }} style={styles.image} />
            <View style={styles.info}>
              <Text style={styles.fieldName}>{booking.fieldName}</Text>
              <Text style={styles.location}>{booking.location}</Text>
              <Text style={styles.price}>{booking.price}</Text>
              <Text style={styles.time}>{booking.time}</Text>
              {booking.status === "cancelled" ? (
                <Text style={styles.cancelText}>Vắng</Text>
              ) : (
                <Text style={styles.rating}>⭐ {booking.rating}</Text>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Thanh điều hướng Bottom Tabs */}
      <View style={styles.bottomTabs}>
        <BottomTabs />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "green",
    marginBottom: 10,
  },
  note: {
    fontSize: 14,
    color: "gray",
    marginBottom: 20,
  },
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  cancelled: {
    backgroundColor: "#f8d7da",
  },
  confirmed: {
    backgroundColor: "#d4edda",
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 10,
  },
  info: {
    marginLeft: 10,
    flex: 1,
  },
  fieldName: {
    fontSize: 16,
    fontWeight: "bold",
  },
  location: {
    fontSize: 14,
    color: "gray",
  },
  price: {
    fontSize: 14,
    fontWeight: "bold",
    color: "blue",
  },
  time: {
    fontSize: 12,
    color: "black",
  },
  cancelText: {
    color: "red",
    fontWeight: "bold",
  },
  rating: {
    color: "goldenrod",
    fontWeight: "bold",
  },
  bottomTabs: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#ccc",
  },
});

