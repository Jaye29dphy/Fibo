import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import moment from "moment";
import { getSubFields, getTimeSlots, getServices, formatCurrency, getStringParam, formatServicePr } from "@/constants/apiService";

const BookingScreen = () => {
  const router = useRouter();
  const { field_id, name, price, location, image } = useLocalSearchParams();
  const [subFields, setSubFields] = useState<any[]>([]);
  const [timeSlots, setTimeSlots] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedFieldType, setSelectedFieldType] = useState<string | null>(null);
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [selectedServices, setSelectedServices] = useState<{ name: string; id: number }[]>([]);

  const getNext7Days = () => {
    return Array.from({ length: 7 }, (_, index) => ({
      date: moment().add(index, "days").format("DD/MM"),
      dayOfWeek: moment().add(index, "days").format("ddd"),
    }));
  };

  const dates = getNext7Days();

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!field_id) {
          Alert.alert("Lỗi", "Không tìm thấy thông tin sân.");
          return;
        }

        const subFieldsData = await getSubFields(field_id as string);
        setSubFields(subFieldsData);

        const timeSlotsData = await getTimeSlots(field_id as string);
        setTimeSlots(timeSlotsData);

        const servicesData = await getServices(field_id as string);
        setServices(servicesData);
      } catch (error) {
        console.error("Error fetching booking data:", error);
        Alert.alert("Lỗi", "Không thể tải dữ liệu. Vui lòng thử lại.");
      }
    };

    fetchData();
  }, [field_id]);

  const toggleService = (service: { name: string; id: number }) => {
    setSelectedServices((prev) =>
      prev.some((s) => s.id === service.id)
        ? prev.filter((s) => s.id !== service.id)
        : [...prev, service]
    );
  };

  const toggleSlot = (slot: string) => {
    setSelectedSlots((prev) =>
      prev.includes(slot) ? prev.filter((s) => s !== slot) : [...prev, slot]
    );
  };

  const handlePayment = () => {
    if (!selectedFieldType || !selectedDate || selectedSlots.length === 0) {
      Alert.alert("Thông báo", "Vui lòng chọn đầy đủ loại sân, ngày và ít nhất một khung giờ.");
      return;
    }

    const selectedSlotsData = timeSlots.filter((slot) =>
      selectedSlots.includes(`${slot.start_time} - ${slot.end_time}`)
    );
    const totalSlotPrice = selectedSlotsData.reduce(
      (total, slot) => total + parseFloat(slot.price || "0"),
      0
    );
    const totalServicePrice = selectedServices.reduce((total, service) => {
      const serviceData = services.find((s) => s.service_id === service.id);
      return total + (serviceData ? parseFloat(serviceData.price) : 0);
    }, 0);

    router.push({
      pathname: "/customer/confirmpay",
      params: {
        booking_code: `BOOK${Date.now()}`,
        fieldId: field_id,
        fieldName: name,
        fieldType: selectedFieldType,
        date: selectedDate,
        timeSlots: JSON.stringify(selectedSlots),
        price: totalSlotPrice.toString(),
        extraService: selectedServices.map((s) => `${s.name}-${s.id}`).join(", "),
        extraPrice: totalServicePrice.toString(),
      },
    });
  };

  const priceString = getStringParam(price);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.title}>Lựa chọn dịch vụ - {name}</Text>
      </View>

      <Text style={styles.fieldPrice}>Giá sân: {priceString ? formatCurrency(priceString) : "Giá không khả dụng"}</Text>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 120 }}>
        <Text style={styles.sectionTitle}>Chọn loại sân</Text>
        <View style={styles.gridContainer}>
          {subFields.map((field) => (
            <TouchableOpacity
              key={field.sub_field_id}
              style={[
                styles.optionItem,
                selectedFieldType === field.name && styles.selectedOption,
              ]}
              onPress={() => setSelectedFieldType(field.name)}
            >
              <Text style={styles.optionText}>{field.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

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

        <Text style={styles.sectionTitle}>Chọn khung giờ</Text>
        <View style={styles.gridContainer}>
          {timeSlots.map((slot) => {
            const slotString = `${slot.start_time} - ${slot.end_time}`;
            return (
              <TouchableOpacity
                key={slot.slot_id}
                style={[
                  styles.optionItem,
                  selectedSlots.includes(slotString) && styles.selectedOption,
                ]}
                onPress={() => toggleSlot(slotString)}
              >
                <Text style={styles.optionText}>{slotString}</Text>
                <Text style={styles.slotPrice}>{formatCurrency(slot.price)}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.sectionTitle}>Chọn dịch vụ thêm</Text>
        <View style={styles.gridContainer}>
          {services.map((service) => (
            <TouchableOpacity
              key={service.service_id}
              style={[
                styles.optionItem,
                selectedServices.some((s) => s.id === service.service_id) && styles.selectedOption,
              ]}
              onPress={() => toggleService({ name: service.name, id: service.service_id })}
            >
              <Text style={styles.optionText}>
                {selectedServices.some((s) => s.id === service.service_id) ? "✅ " : ""} {service.name}
              </Text>
              <Text style={styles.slotPrice}>{formatServicePr(service.price)}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <TouchableOpacity style={styles.payButton} onPress={handlePayment}>
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
  fieldPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#16A34A",
    marginBottom: 8,
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