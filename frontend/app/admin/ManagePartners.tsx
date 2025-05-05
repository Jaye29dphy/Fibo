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
  Modal,
  Alert,
  Dimensions,
} from "react-native";
import { PieChart } from "react-native-chart-kit";
import { getFields, formatCurrency, updateFieldStatus } from "@/constants/apiService";
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
  const [showStats, setShowStats] = useState<boolean>(false);

  const fetchFields = async () => {
    setLoading(true);
    try {
      const sportType = selectedSportType === "all" ? "" : selectedSportType;
      const data = await getFields(sportType);
      console.log("Fetched fields:", data);
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
    console.log("Filtered fields:", filtered);
  };

  const toggleFieldStatus = async (field: SportsField) => {
    try {
      const newStatus = field.status === "available" ? "unavailable" : "available";
      await updateFieldStatus(field.field_id.toString(), newStatus);
      
      // Cập nhật danh sách sân
      setFields((prevFields) =>
        prevFields.map((f) =>
          f.field_id === field.field_id ? { ...f, status: newStatus } : f
        )
      );
      filterFields(fields, selectedStatus, searchKeyword);
      Alert.alert("Thành công", `Đã chuyển trạng thái sân thành ${newStatus === "available" ? "Có sẵn" : "Không có sẵn"}`);
    } catch (error: any) {
      console.error("Lỗi khi cập nhật trạng thái sân:", error);
      Alert.alert("Lỗi", error.message || "Không thể cập nhật trạng thái sân");
    }
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
          <TouchableOpacity
            style={[
              styles.toggleButton,
              item.status === "available" ? styles.toggleButtonAvailable : styles.toggleButtonUnavailable,
            ]}
            onPress={() => toggleFieldStatus(item)}
          >
            <Text style={styles.toggleButtonText}>
              Chuyển sang {item.status === "available" ? "Không có sẵn" : "Có sẵn"}
            </Text>
          </TouchableOpacity>
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

  const getStatistics = () => {
    const totalFields = fields.length;
    const totalFootball = fields.filter((field) => field.sport_type === "football").length;
    const totalBadminton = fields.filter((field) => field.sport_type === "badminton").length;
    const totalTennis = fields.filter((field) => field.sport_type === "tennis").length;
    const totalBasketball = fields.filter((field) => field.sport_type === "basketball").length;
    const totalPickleball = fields.filter((field) => field.sport_type === "pickleball").length;
    const totalAvailable = fields.filter((field) => field.status === "available").length;
    const totalUnavailable = fields.filter((field) => field.status === "unavailable").length;

    return {
      totalFields,
      totalFootball,
      totalBadminton,
      totalTennis,
      totalBasketball,
      totalPickleball,
      totalAvailable,
      totalUnavailable,
    };
  };

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

  const stats = getStatistics();

  const chartData = [
    {
      name: "Bóng đá",
      population: stats.totalFootball,
      color: "#4CAF50",
      legendFontColor: "#333",
      legendFontSize: 14,
    },
    {
      name: "Cầu lông",
      population: stats.totalBadminton,
      color: "#FF9800",
      legendFontColor: "#333",
      legendFontSize: 14,
    },
    {
      name: "Quần vợt",
      population: stats.totalTennis,
      color: "#2196F3",
      legendFontColor: "#333",
      legendFontSize: 14,
    },
    {
      name: "Bóng rổ",
      population: stats.totalBasketball,
      color: "#F44336",
      legendFontColor: "#333",
      legendFontSize: 14,
    },
    {
      name: "Pickleball",
      population: stats.totalPickleball,
      color: "#9C27B0",
      legendFontColor: "#333",
      legendFontSize: 14,
    },
    {
      name: "Có sẵn",
      population: stats.totalAvailable,
      color: "#FFC107",
      legendFontColor: "#333",
      legendFontSize: 14,
    },
    {
      name: "Không có sẵn",
      population: stats.totalUnavailable,
      color: "#607D8B",
      legendFontColor: "#333",
      legendFontSize: 14,
    },
  ].filter((item) => item.population > 0); // Remove segments with zero population

  const screenWidth = Dimensions.get("window").width;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Danh sách sân thể thao</Text>
        <TouchableOpacity
          style={styles.statsButton}
          onPress={() => setShowStats(true)}
        >
          <Text style={styles.statsButtonText}>Thống kê</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        placeholder="Tìm theo tên, địa điểm hoặc mô tả..."
        style={styles.searchInput}
        value={searchKeyword}
        onChangeText={setSearchKeyword}
      />

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

      <FlatList
        data={filteredFields}
        keyExtractor={(item) => item.field_id.toString()}
        renderItem={renderFieldItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Không tìm thấy sân thể thao nào.</Text>
        }
      />

      <Modal
        visible={showStats}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowStats(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Thống kê sân thể thao</Text>
            <View style={styles.statsContainer}>
              <Text style={styles.modalText}>Tổng số sân đã đăng ký: {stats.totalFields}</Text>
              {chartData.length > 0 ? (
                <PieChart
                  data={chartData}
                  width={screenWidth * 0.7} // Responsive width
                  height={220}
                  chartConfig={{
                    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  }}
                  accessor="population"
                  backgroundColor="transparent"
                  paddingLeft="15"
                  absolute
                  style={styles.chart}
                />
              ) : (
                <Text style={styles.noDataText}>Không có dữ liệu để hiển thị biểu đồ.</Text>
              )}
            </View>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowStats(false)}
            >
              <Text style={styles.closeButtonText}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
  },
  statsButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  statsButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  searchInput: {
    flex: 1,
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
  toggleButton: {
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  toggleButtonAvailable: {
    backgroundColor: "#FF4D4F",
  },
  toggleButtonUnavailable: {
    backgroundColor: "#4CAF50",
  },
  toggleButtonText: {
    color: "#fff",
    fontWeight: "600",
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
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    width: "95%",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
  },
  statsContainer: {
    marginBottom: 20,
    alignItems: "center",
    width: "100%",
  },
  modalText: {
    fontSize: 16,
    marginBottom: 12,
    color: "#333",
    fontWeight: "600",
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  noDataText: {
    fontSize: 16,
    color: "#999",
    textAlign: "center",
    marginVertical: 20,
  },
  closeButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  closeButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});

export default ManageSportsFields;