import React, { useState, useEffect } from "react";
import { View, Text, TextInput, Image, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import BottomTabs from "./BottomTabs";
import { useLocalSearchParams } from "expo-router";
import { getFields, formatCurrency } from "@/constants/apiService";
import { FIELD_IMAGE_BASE_URL } from "@/constants/apiConfig";

const PickField: React.FC = () => {
  const router = useRouter();
  const { sport_type } = useLocalSearchParams();
  const [fields, setFields] = useState<any[]>([]);
  const [filteredFields, setFilteredFields] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
    const fetchFields = async () => {
      try {
        console.log("Sport type:", sport_type);
        const fieldsData = await getFields(sport_type as string);
        console.log("Fields data in pickField:", fieldsData);
        if (Array.isArray(fieldsData)) {
          setFields(fieldsData);
          setFilteredFields(fieldsData);
        } else {
          console.error("Fields data is not an array:", fieldsData);
          setFields([]);
          setFilteredFields([]);
        }
      } catch (error) {
        console.error("Error fetching fields:", error);
        setFields([]);
        setFilteredFields([]);
      }
    };
    if (sport_type) fetchFields();
  }, [sport_type]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim() === "") {
      setFilteredFields(fields);
    } else {
      const filtered = fields.filter((field) =>
        field.name.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredFields(filtered);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>FiBO</Text>
        </View>
      </View>

      <View style={styles.searchBar}>
        <FontAwesome name="search" size={20} color="#9CA3AF" />
        <TextInput
          placeholder="Nhập tên sân..."
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={handleSearch}
        />
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.sectionTitle}>Tất cả các sân</Text>
        <View style={styles.fieldsList}>
          {filteredFields.length === 0 ? (
            <Text>Không có sân nào được tìm thấy.</Text>
          ) : (
            filteredFields.map((field) => {
              const imageUrl = field.image_name
                ? `${FIELD_IMAGE_BASE_URL}/${field.image_name}?t=${Date.now()}`
                : "https://via.placeholder.com/150";
              const isAvailable = field.status === "available";

              return (
                <TouchableOpacity
                  key={field.field_id}
                  disabled={!isAvailable}
                  onPress={
                    isAvailable
                      ? () =>
                          router.push({
                            pathname: "/customer/field_detail",
                            params: {
                              field_id: field.field_id,
                              name: field.name,
                              price: field.price_per_hour,
                              location: field.location,
                              image: field.image_name,
                              description: field.description,
                            },
                          })
                      : undefined
                  }
                >
                  <View
                    style={[
                      styles.fieldCard,
                      !isAvailable && styles.unavailableCard,
                    ]}
                  >
                    <View style={styles.imageContainer}>
                      <Image
                        source={{ uri: imageUrl }}
                        style={styles.fieldImage}
                        onError={(error) => {
                          console.log(
                            `Main image load error for field ${field.field_id}:`,
                            error.nativeEvent
                          );
                          console.log(`Failed URL:`, imageUrl);
                        }}
                        onLoad={() =>
                          console.log(`Main image loaded for field ${field.field_id}:`, imageUrl)
                        }
                        onLoadEnd={() =>
                          console.log(`Main image load ended for field ${field.field_id}`)
                        }
                      />
                    </View>
                    <Text style={styles.fieldName}>{field.name}</Text>
                    <Text style={styles.fieldLocation}>{`Loại sân: ${field.sport_type}`}</Text>
                    <Text style={styles.fieldPrice}>
                      {`Giá: ${formatCurrency(field.price_per_hour)}`}
                    </Text>
                    {!isAvailable && (
                      <Text style={styles.unavailableText}>Không khả dụng</Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>

      <View style={styles.bottomTabs}>
        <BottomTabs />
      </View>
    </View>
  );
};

export default PickField;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  logoContainer: {
    backgroundColor: "#16A34A",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 50,
  },
  logoText: {
    color: "white",
    fontWeight: "bold",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
  },
  searchInput: {
    marginLeft: 8,
    flex: 1,
  },
  content: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  fieldsList: {
    paddingBottom: 16,
  },
  fieldCard: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  unavailableCard: {
    opacity: 0.6, // Làm mờ thẻ sân không khả dụng
    backgroundColor: "#F1F1F1", // Màu nền nhạt hơn
  },
  imageContainer: {
    width: "100%",
    height: 150,
    borderRadius: 8,
    backgroundColor: "#E5E7EB",
  },
  fieldImage: {
    width: "100%",
    height: 150,
    borderRadius: 8,
  },
  fieldName: {
    fontWeight: "bold",
    marginTop: 8,
  },
  fieldLocation: {
    color: "#6B7280",
  },
  fieldPrice: {
    color: "#16A34A",
    fontWeight: "bold",
    marginTop: 4,
  },
  unavailableText: {
    color: "#EF4444",
    fontWeight: "bold",
    marginTop: 4,
  },
  bottomTabs: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#ddd",
  },
});