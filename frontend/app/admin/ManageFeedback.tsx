import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  TextInput,
  Modal,
  Alert,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { PieChart } from "react-native-chart-kit";
import { getAllReviews, deleteReview } from "@/constants/apiService";

interface Review {
  review_id: number;
  user_id: number;
  field_id: number;
  rating: number;
  comment: string;
  created_at: string;
  user_name: string;
  user_email: string;
  field_name: string;
  sport_type: string;
}

const ManageFeedback = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [filteredReviews, setFilteredReviews] = useState<Review[]>([]);
  const [selectedRating, setSelectedRating] = useState<string>("all");
  const [searchKeyword, setSearchKeyword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showStats, setShowStats] = useState<boolean>(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState<boolean>(false);
  const [reviewToDelete, setReviewToDelete] = useState<number | null>(null);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const data = await getAllReviews();
      setReviews(data);
      filterReviews(data, selectedRating, searchKeyword);
    } catch (err: any) {
      setError(err.message || "Đã xảy ra lỗi khi lấy danh sách phản hồi.");
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReview = (reviewId: number) => {
    console.log("Attempting to delete review with ID:", reviewId);
    setReviewToDelete(reviewId);
    setShowConfirmDialog(true);
  };

  const confirmDelete = async () => {
    if (reviewToDelete === null) return;
    
    try {
      console.log("Before calling deleteReview API for ID:", reviewToDelete);
      const response = await deleteReview(reviewToDelete);
      console.log("Delete API response:", JSON.stringify(response));
      const updatedReviews = reviews.filter((review) => review.review_id !== reviewToDelete);
      console.log("Updated reviews count:", updatedReviews.length);
      setReviews(updatedReviews);
      filterReviews(updatedReviews, selectedRating, searchKeyword);
      Alert.alert("Thành công", "Đánh giá đã được xóa.");
    } catch (err: any) {
      console.error("Delete error:", err.message || err);
      Alert.alert(
        "Lỗi",
        err.message || "Không thể xóa đánh giá. Vui lòng kiểm tra kết nối, quyền admin, hoặc ID đánh giá."
      );
    } finally {
      setShowConfirmDialog(false);
      setReviewToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowConfirmDialog(false);
    setReviewToDelete(null);
  };

  const filterReviews = (data: Review[], rating: string, keyword: string) => {
    let filtered = data;

    if (rating !== "all") {
      filtered = filtered.filter((review) => review.rating.toString() === rating);
    }

    if (keyword.trim() !== "") {
      const lowerKeyword = keyword.toLowerCase();
      filtered = filtered.filter(
        (review) =>
          review.comment.toLowerCase().includes(lowerKeyword) ||
          review.user_name.toLowerCase().includes(lowerKeyword) ||
          review.field_name.toLowerCase().includes(lowerKeyword)
      );
    }

    setFilteredReviews(filtered);
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  useEffect(() => {
    filterReviews(reviews, selectedRating, searchKeyword);
  }, [selectedRating, searchKeyword, reviews]);

  const renderReviewItem = ({ item }: { item: Review }) => (
    <View style={styles.reviewItem}>
      <Text style={styles.userName}>{item.user_name} ({item.user_email})</Text>
      <Text style={styles.fieldName}>{item.field_name} ({item.sport_type})</Text>
      <Text style={styles.rating}>Điểm: {item.rating}/5</Text>
      <Text style={styles.comment}>Bình luận: {item.comment || "Không có bình luận"}</Text>
      <Text style={styles.createdAt}>Thời gian: {new Date(item.created_at).toLocaleString()}</Text>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => {
          console.log("Delete button pressed for review ID:", item.review_id);
          handleDeleteReview(item.review_id);
        }}
        activeOpacity={0.7}
      >
        <Text style={styles.deleteButtonText}>Xóa</Text>
      </TouchableOpacity>
    </View>
  );

  const ratingFilters = [
    { label: "Tất cả", value: "all" },
    { label: "1 sao", value: "1" },
    { label: "2 sao", value: "2" },
    { label: "3 sao", value: "3" },
    { label: "4 sao", value: "4" },
    { label: "5 sao", value: "5" },
  ];

  const getStatistics = () => {
    const totalReviews = reviews.length;
    const averageRating = reviews.length
      ? (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(2)
      : "0.00";
    const ratingCounts = {
      fiveStar: reviews.filter((r) => r.rating === 5).length,
      fourStar: reviews.filter((r) => r.rating === 4).length,
      threeStar: reviews.filter((r) => r.rating === 3).length,
      twoStar: reviews.filter((r) => r.rating === 2).length,
      oneStar: reviews.filter((r) => r.rating === 1).length,
    };

    return { totalReviews, averageRating, ratingCounts };
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
      name: "5 sao",
      population: stats.ratingCounts.fiveStar,
      color: "#4CAF50",
      legendFontColor: "#333",
      legendFontSize: 14,
    },
    {
      name: "4 sao",
      population: stats.ratingCounts.fourStar,
      color: "#FFC107",
      legendFontColor: "#333",
      legendFontSize: 14,
    },
    {
      name: "3 sao",
      population: stats.ratingCounts.threeStar,
      color: "#2196F3",
      legendFontColor: "#333",
      legendFontSize: 14,
    },
    {
      name: "2 sao",
      population: stats.ratingCounts.twoStar,
      color: "#FF9800",
      legendFontColor: "#333",
      legendFontSize: 14,
    },
    {
      name: "1 sao",
      population: stats.ratingCounts.oneStar,
      color: "#F44336",
      legendFontColor: "#333",
      legendFontSize: 14,
    },
  ].filter((item) => item.population > 0); // Remove segments with zero population

  const screenWidth = Dimensions.get("window").width;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Quản lý phản hồi</Text>
        <TouchableOpacity
          style={styles.statsButton}
          onPress={() => setShowStats(true)}
        >
          <Text style={styles.statsButtonText}>Thống kê</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        placeholder="Tìm theo bình luận, tên người dùng, hoặc sân..."
        style={styles.searchInput}
        value={searchKeyword}
        onChangeText={setSearchKeyword}
      />

      <Text style={styles.filterLabel}>Lọc theo số sao:</Text>
      <View style={styles.filterContainer}>
        {ratingFilters.map((rating) => (
          <TouchableOpacity
            key={rating.value}
            style={[
              styles.filterButton,
              selectedRating === rating.value && styles.filterButtonSelected,
            ]}
            onPress={() => setSelectedRating(rating.value)}
          >
            <Text
              style={[
                styles.filterButtonText,
                selectedRating === rating.value && styles.filterButtonTextSelected,
              ]}
            >
              {rating.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredReviews}
        keyExtractor={(item) => item.review_id.toString()}
        renderItem={renderReviewItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Không tìm thấy phản hồi nào.</Text>
        }
      />

      <Modal
        visible={showConfirmDialog}
        transparent={true}
        animationType="fade"
        onRequestClose={cancelDelete}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Xác nhận xóa</Text>
            <Text style={styles.modalText}>Bạn có chắc chắn muốn xóa đánh giá này?</Text>
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={cancelDelete}
              >
                <Text style={styles.buttonText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.deleteButton]}
                onPress={confirmDelete}
              >
                <Text style={styles.buttonText}>Xóa</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showStats}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowStats(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Thống kê phản hồi</Text>
            <View style={styles.statsContainer}>
              <Text style={styles.modalText}>Tổng số đánh giá: {stats.totalReviews}</Text>
              <Text style={styles.modalText}>Điểm đánh giá trung bình: {stats.averageRating}/5</Text>
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
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
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
  reviewItem: {
    padding: 12,
    marginBottom: 10,
    borderRadius: 10,
    backgroundColor: "#F1F1F1",
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  fieldName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#555",
    marginBottom: 4,
  },
  rating: {
    fontSize: 14,
    color: "#888",
    marginBottom: 4,
  },
  comment: {
    fontSize: 14,
    color: "#333",
    marginBottom: 4,
  },
  createdAt: {
    fontSize: 12,
    color: "#888",
    marginBottom: 8,
  },
  deleteButton: {
    backgroundColor: "#FF4444",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: "flex-end",
    zIndex: 1000,
  },
  deleteButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
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
    marginBottom: 8,
    color: "#333",
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
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 20,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: 100,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#ccc",
    marginRight: 10,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },
});

export default ManageFeedback;