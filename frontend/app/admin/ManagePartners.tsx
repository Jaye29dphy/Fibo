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
  Dimensions,
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
  image_name?: string; // Tên ảnh chính từ Field_Images
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
      setFields(data);
      filterFields(data, selectedStatus, searchKeyword);
    } catch (err: any) {
      setError(err.message || "Đã xảy ra lỗi khi lấy danh sách sân thể thao.");
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
          field.location.toLowerCase().includes(lowerKeyword)
      );
    }

    setFilteredFields(filtered);
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
              console.log(`Failed URL:`, imageUrl);
            }}
            onLoad={() => console.log(`Image loaded for field ${item.field_id}:`, imageUrl)}
            onLoadEnd={() => console.log(`Image load ended for field ${item.field_id}`)}
          />
        </View>
        <Text style={styles.name} numberOfLines={1} ellipsizeMode="tail">
          {item.name}
        </Text>
        <Text style={styles.info} numberOfLines={1} ellipsizeMode="tail">
          {item.location}
        </Text>
        <Text style={styles.info}>Loại: {item.sport_type}</Text>
        <Text style={styles.info}>
          {item.status === "available" ? "Có sẵn" : "Không có sẵn"}
        </Text>
        <Text style={styles.info}>{formatCurrency(item.price_per_hour)}</Text>
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
        placeholder="Tìm theo tên hoặc địa điểm..."
        style={styles.searchInput}
        value={searchKeyword}
        onChangeText={setSearchKeyword}
      />

      {/* Bộ lọc trạng thái */}
      <View style={styles.filterContainer}>
        <Text style={styles.filterLabel}>Trạng thái:</Text>
        <View style={styles.statusFilterContainer}>
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
      </View>

      {/* Bộ lọc loại sân */}
      <View style={styles.filterContainer}>
        <Text style={styles.filterLabel}>Loại sân:</Text>
        <View style={styles.sportTypeFilterContainer}>
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
      </View>

      {/* Danh sách sân thể thao dạng lưới */}
      <FlatList
        data={filteredFields}
        keyExtractor={(item) => item.field_id.toString()}
        renderItem={renderFieldItem}
        numColumns={2}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Không tìm thấy sân thể thao nào.</Text>
        }
      />
    </View>
  );
};

export default ManageSportsFields;

const { width } = Dimensions.get("window");
const itemWidth = (width - 48) / 3; // 48 = padding trái/phải (16 * 2) + khoảng cách giữa các item (8 * 2)

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
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  statusFilterContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
  },
  sportTypeFilterContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: "#E0E0E0",
    marginRight: 8,
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
    width: itemWidth,
    margin: 45, // Khoảng cách giữa các item
    backgroundColor: "#F1F1F1",
    borderRadius: 8,
    padding: 8,
  },
  imageContainer: {
    width: "100%",
    height: itemWidth * 0.75, // Tỷ lệ ảnh 4:3
    borderRadius: 8,
    backgroundColor: "#E5E7EB",
    marginBottom: 4,
  },
  fieldImage: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
  },
  name: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },
  info: {
    fontSize: 12,
    color: "#555",
    marginBottom: 2,
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