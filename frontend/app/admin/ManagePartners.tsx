import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
} from "react-native";
import { getFields, formatCurrency } from "@/constants/apiService";
import { FIELD_IMAGE_BASE_URL } from "@/constants/apiConfig";

interface SportsField {
  field_id: number;
  name: string;
  location: string;
  sport_type: "football" | "badminton" | "tennis" | "basketball" | "pickleball";
  price_per_hour: number;
  status: "available" | "unavailable";
  created_at: string;
  image_name?: string;
  description: string;
}

const ManageSportsFields = () => {
  const [fields, setFields] = useState<SportsField[]>([]);
  const [filteredFields, setFilteredFields] = useState<SportsField[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedSportType, setSelectedSportType] = useState<string>("all");
  const [searchKeyword, setSearchKeyword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFields = async () => {
    setLoading(true);
    try {
      const sportType = selectedSportType === "all" ? "" : selectedSportType;
      const data = await getFields(sportType);
      console.log("Fetched fields:", data); // Debug log
      setFields(data);
      filterFields(data, selectedStatus, searchKeyword);
    } catch (err: any) {
      setError(err.message || "Đã xảy ra lỗi khi lấy danh sách sân thể thao.");
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const filterFields = (data: SportsField[], status: string, keyword: string) => {
    let filtered = data;

    if (status !== "all") {
      filtered = filtered.filter((field) => field.status === status);
    }

    if (keyword.trim() !== "") {
      const lowerKeyword = keyword.toLowerCase();
      filtered = filtered.filter(
        (field) =>
          field.name.toLowerCase().includes(lowerKeyword) ||
          field.location.toLowerCase().includes(lowerKeyword) ||
          field.description.toLowerCase().includes(lowerKeyword)
      );
    }

    setFilteredFields(filtered);
    console.log("Filtered fields:", filtered); // Debug log
  };

  useEffect(() => {
    fetchFields();
  }, [selectedSportType]);

  useEffect(() => {
    filterFields(fields, selectedStatus, searchKeyword);
  }, [selectedStatus, searchKeyword, fields]);

  const renderFieldItem = ({ item }: { item: SportsField }) => {
    const imageUrl = item.image_name
      ? `${FIELD_IMAGE_BASE_URL}/${item.image_name}?t=${Date.now()}`
      : "https://via.placeholder.com/150";

    return (
      <View style={styles.fieldItem}>
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: imageUrl }}
            style={styles.fieldImage}
            resizeMode="cover"
            onError={(error) => {
              console.log(`Image load error for field ${item.field_id}:`, error.nativeEvent);
            }}
          />
        </View>
        <View style={styles.infoContainer}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.info}>Địa điểm: {item.location}</Text>
          <Text style={styles.info}>Loại sân: {item.sport_type}</Text>
          <Text style={styles.info}>
            Trạng thái: {item.status === "available" ? "Có sẵn" : "Không có sẵn"}
          </Text>
          <Text style={styles.info}>Giá: {formatCurrency(item.price_per_hour)}</Text>
          <Text style={styles.info}>Mô tả: {item.description || "Không có mô tả"}</Text>
        </View>
      </View>
    );
  };

  const statuses = [
    { label: "Tất cả", value: "all" },
    { label: "Có sẵn", value: "available" },
    { label: "Không có sẵn", value: "unavailable" },
  ];

  const sportTypes = [
    { label: "Tất cả", value: "all" },
    { label: "Bóng đá", value: "football" },
    { label: "Cầu lông", value: "badminton" },
    { label: "Quần vợt", value: "tennis" },
    { label: "Bóng rổ", value: "basketball" },
    { label: "Pickleball", value: "pickleball" },
  ];

  if (loading) {
    return <ActivityIndicator size="large" color="#4CAF50" style={styles.loading} />;
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Danh sách sân thể thao</Text>

      {/* Thanh tìm kiếm */}
      <TextInput
        placeholder="Tìm theo tên, địa điểm hoặc mô tả..."
        style={styles.searchInput}
        value={searchKeyword}
        onChangeText={setSearchKeyword}
      />

      {/* Bộ lọc trạng thái */}
      <View style={styles.filterContainer}>
        {statuses.map((status) => (
          <TouchableOpacity
            key={status.value}
            style={[
              styles.filterButton,
              selectedStatus === status.value && styles.filterButtonSelected,
            ]}
            onPress={() => setSelectedStatus(status.value)}
          >
            <Text
              style={[
                styles.filterButtonText,
                selectedStatus === status.value && styles.filterButtonTextSelected,
              ]}
            >
              {status.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Bộ lọc loại sân */}
      <View style={styles.filterContainer}>
        {sportTypes.map((sport) => (
          <TouchableOpacity
            key={sport.value}
            style={[
              styles.filterButton,
              selectedSportType === sport.value && styles.filterButtonSelected,
            ]}
            onPress={() => setSelectedSportType(sport.value)}
          >
            <Text
              style={[
                styles.filterButtonText,
                selectedSportType === sport.value && styles.filterButtonTextSelected,
              ]}
            >
              {sport.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Danh sách sân thể thao */}
      <FlatList
        data={filteredFields}
        keyExtractor={(item) => item.field_id.toString()}
        renderItem={renderFieldItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Không tìm thấy sân thể thao nào.</Text>
        }
      />
    </View>
  );
};

export default ManageSportsFields;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
  },
  searchInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  filterContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
    marginBottom: 16,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: "#E0E0E0",
    marginBottom: 8,
  },
  filterButtonSelected: {
    backgroundColor: "#4CAF50",
  },
  filterButtonText: {
    color: "#000",
    fontWeight: "500",
  },
  filterButtonTextSelected: {
    color: "#fff",
    fontWeight: "700",
  },
  fieldItem: {
    flexDirection: "row",
    padding: 12,
    marginBottom: 10,
    borderRadius: 10,
    backgroundColor: "#F1F1F1",
  },
  imageContainer: {
    width: 140,
    height: 140,
    borderRadius: 8,
    backgroundColor: "#E5E7EB",
    marginRight: 12,
  },
  fieldImage: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
  },
  infoContainer: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  info: {
    fontSize: 14,
    color: "#888",
    marginBottom: 4,
  },
  loading: {
    flex: 1,
    justifyContent: "center",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    color: "red",
    fontSize: 16,
  },
  list: {
    paddingBottom: 16,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 20,
    color: "#999",
    fontSize: 16,
  },
});