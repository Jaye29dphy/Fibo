import React, { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from "react-native"; // Thêm Alert từ react-native
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import moment from "moment";

const typefield = [
  { typef: "Sân 5" },
  { typef: "Sân 7" },
  { typef: "Sân 11" },
];

const timeSlots = [
  { time: "6:00 - 7:00", price: "100K" },
  { time: "7:00 - 8:00", price: "120K" },
  { time: "8:00 - 9:00", price: "150K" },
  { time: "9:00 - 10:00", price: "180K" },
  { time: "10:00 - 11:00", price: "200K" },
  { time: "11:00 - 12:00", price: "220K" },
  { time: "12:00 - 13:00", price: "250K" },
  { time: "13:00 - 14:00", price: "270K" },
  { time: "14:00 - 15:00", price: "300K" },
  { time: "15:00 - 16:00", price: "320K" },
  { time: "16:00 - 17:00", price: "350K" },
  { time: "17:00 - 18:00", price: "400K" },
];

const extraServices = [
  { name: "Thuê nước", price: "20K" },
  { name: "Thuê bóng", price: "50K" },
  { name: "Thuê phòng tắm", price: "30K" },
  { name: "Thuê áo đấu", price: "80K" },
];

// Lấy danh sách 7 ngày tiếp theo
const getNext7Days = () => {
  return Array.from({ length: 7 }, (_, index) => ({
    date: moment().add(index, "days").format("DD/MM"),
    dayOfWeek: moment().add(index, "days").format("ddd"),
  }));
};

const BookingScreen = () => {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedFieldType, setSelectedFieldType] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  const dates = getNext7Days();

  // Xử lý chọn dịch vụ
  const toggleService = (service: string) => {
    setSelectedServices((prev) =>
      prev.includes(service) ? prev.filter((s) => s !== service) : [...prev, service]
    );
  };

  // Kiểm tra nếu chưa chọn đủ các mục
  const handlePayment = () => {
    if (!selectedFieldType || !selectedDate || !selectedSlot) {
      Alert.alert("Thông báo", "Vui lòng chọn đầy đủ loại sân, ngày và khung giờ trước khi thanh toán.");
      return;
    }
    router.push({
      pathname: "/confirmpay",
      params: {
        orderId: "123456789XYZ",
        date: selectedDate,
        timeSlot: selectedSlot,
        price: timeSlots.find(slot => slot.time === selectedSlot)?.price.replace("K", "000") || "0",
        extraService: selectedServices.join(", "),
        extraPrice: selectedServices.reduce((total, service) => {
          const foundService = extraServices.find(s => s.name === service);
          return total + (foundService ? parseInt(foundService.price.replace("K", "000")) : 0);
        }, 0).toString(),
        fieldType: selectedFieldType,
      },
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.title}>Lựa chọn dịch vụ</Text>
      </View>

      {/* Chọn loại sân */}
      <Text style={styles.sectionTitle}>Chọn loại sân</Text>
      <View style={styles.gridContainer}>
        {typefield.map((field, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.optionItem,
              selectedFieldType === field.typef && styles.selectedOption,
            ]}
            onPress={() => setSelectedFieldType(field.typef)}
          >
            <Text style={styles.optionText}>{field.typef}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Chọn ngày */}
        <Text style={styles.sectionTitle}>Chọn ngày</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
          {dates.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.dateItem,
                selectedDate === item.date && styles.selectedOption,
              ]}
              onPress={() => setSelectedDate(item.date)}
            >
              <Text style={styles.dateText}>{item.dayOfWeek}</Text>
              <Text style={styles.dateText}>{item.date}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Chọn khung giờ */}
        <Text style={styles.sectionTitle}>Chọn khung giờ</Text>
        <View style={styles.gridContainer}>
          {timeSlots.map((slot, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.optionItem,
                selectedSlot === slot.time && styles.selectedOption,
              ]}
              onPress={() => setSelectedSlot(slot.time)}
            >
              <Text style={styles.optionText}>{slot.time}</Text>
              <Text style={styles.slotPrice}>{slot.price}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Chọn dịch vụ thêm */}
        <Text style={styles.sectionTitle}>Chọn dịch vụ thêm</Text>
        <View style={styles.gridContainer}>
          {extraServices.map((service, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.optionItem,
                selectedServices.includes(service.name) && styles.selectedOption,
              ]}
              onPress={() => toggleService(service.name)}
            >
              <Text style={styles.optionText}>
                {selectedServices.includes(service.name) ? "✅ " : ""} 
                {service.name}
              </Text>
              <Text style={styles.slotPrice}>{service.price}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Nút thanh toán */}
      <TouchableOpacity
        style={styles.payButton}
        onPress={handlePayment}
      >
        <Text style={styles.payText}>Thanh toán</Text>
      </TouchableOpacity>

    </View>
  );
};

export default BookingScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    padding: 16,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 8,
    marginBottom: 8,
  },
  horizontalScroll: {
    marginBottom: 16,
  },
  dateItem: {
    width: 80,
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#E5E7EB",
    alignItems: "center",
    marginHorizontal: 5,
  },
  dateText: {
    fontSize: 14,
    fontWeight: "bold",
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  optionItem: {
    width: "48%",
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#E5E7EB",
    alignItems: "center",
    marginBottom: 10,
  },
  selectedOption: {
    backgroundColor: "#16A34A",
  },
  optionText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "black",
  },
  slotPrice: {
    fontSize: 14,
    color: "#6B7280",
  },
  payButton: {
    backgroundColor: "#16A34A",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  payText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});
