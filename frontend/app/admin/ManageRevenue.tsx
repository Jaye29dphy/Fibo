import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Dimensions,
} from "react-native";
import { PieChart } from "react-native-chart-kit"; // Thay BarChart bằng PieChart
import { getAllOwnerSubscriptions, formatServicePr } from "@/constants/apiService";
import { API_ENDPOINTS } from "@/constants/apiConfig";

interface Revenue {
  revenue_id: number;
  owner_id: number;
  owner_name: string;
  owner_email: string;
  total_revenue: number | string;
  month: number;
  year: number;
  last_updated: string;
}

const ManageRevenue = () => {
  const [revenues, setRevenues] = useState<Revenue[]>([]);
  const [filteredRevenues, setFilteredRevenues] = useState<Revenue[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [searchKeyword, setSearchKeyword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showStats, setShowStats] = useState<boolean>(false);

  const fetchRevenues = async () => {
    setLoading(true);
    try {
      const data = await getAllOwnerSubscriptions();
      // Chuyển đổi total_revenue thành số
      const formattedData = data.map((revenue: Revenue) => ({
        ...revenue,
        total_revenue: parseFloat(revenue.total_revenue.toString()) || 0,
      }));
      setRevenues(formattedData);
      filterRevenues(formattedData, selectedYear, searchKeyword);
    } catch (err: any) {
      setError(err.message || "Đã xảy ra lỗi khi lấy danh sách doanh thu.");
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const filterRevenues = (data: Revenue[], year: string, keyword: string) => {
    let filtered = data;

    if (year !== "all") {
      filtered = filtered.filter((revenue) => revenue.year.toString() === year);
    }

    if (keyword.trim() !== "") {
      const lowerKeyword = keyword.toLowerCase();
      filtered = filtered.filter(
        (revenue) =>
          revenue.owner_name.toLowerCase().includes(lowerKeyword) ||
          revenue.owner_email.toLowerCase().includes(lowerKeyword) ||
          revenue.revenue_id.toString().includes(lowerKeyword)
      );
    }

    setFilteredRevenues(filtered);
  };

  useEffect(() => {
    fetchRevenues();
  }, []);

  useEffect(() => {
    filterRevenues(revenues, selectedYear, searchKeyword);
  }, [selectedYear, searchKeyword, revenues]);

  const renderRevenueItem = ({ item }: { item: Revenue }) => (
    <View style={styles.revenueItem}>
      <Text style={styles.id}>ID: {item.revenue_id}</Text>
      <Text style={styles.info}>Chủ sân: {item.owner_name}</Text>
      <Text style={styles.info}>Email: {item.owner_email}</Text>
      <Text style={styles.info}>
        Doanh thu: {formatServicePr(item.total_revenue || 0)}
      </Text>
      <Text style={styles.info}>
        Tháng/Năm: {item.month}/{item.year}
      </Text>
      <Text style={styles.info}>
        Cập nhật lần cuối: {new Date(item.last_updated).toLocaleString()}
      </Text>
    </View>
  );

  const years = [
    { label: "Tất cả", value: "all" },
    ...Array.from(new Set(revenues.map((r) => r.year)))
      .sort()
      .map((year) => ({ label: year.toString(), value: year.toString() })),
  ];

  const getStatistics = () => {
    // Lọc các bản ghi hợp lệ
    const validRevenues = revenues.filter(
      (revenue) => revenue.total_revenue != null && revenue.owner_name != null
    );

    const totalRevenues = validRevenues.length;
    const totalRevenueAmount = validRevenues.reduce(
      (sum, revenue) => sum + (parseFloat(revenue.total_revenue.toString()) || 0),
      0
    );

    const revenueByYear = validRevenues.reduce((acc, revenue) => {
      acc[revenue.year] = (acc[revenue.year] || 0) + (parseFloat(revenue.total_revenue.toString()) || 0);
      return acc;
    }, {} as Record<string, number>);
    const topYears = Object.entries(revenueByYear)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([year, total]) => ({ year, total }));

    const revenueByOwner = validRevenues.reduce((acc, revenue) => {
      acc[revenue.owner_name] = (acc[revenue.owner_name] || 0) + (parseFloat(revenue.total_revenue.toString()) || 0);
      return acc;
    }, {} as Record<string, number>);
    const topOwners = Object.entries(revenueByOwner)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name, total]) => ({ name, total }));

    return {
      totalRevenues,
      totalRevenueAmount,
      topYears,
      topOwners,
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

  // Chuẩn bị dữ liệu cho PieChart (phân bổ doanh thu theo top 3 owners)
  const pieChartData = stats.topOwners.map((owner, index) => ({
    name: owner.name,
    population: owner.total, // Sử dụng total_revenue làm giá trị
    color: `rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, 0.6)`, // Màu ngẫu nhiên
    legendFontColor: "#000",
    legendFontSize: 12,
  }));

  const screenWidth = Dimensions.get("window").width;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Quản lý doanh thu</Text>
        <TouchableOpacity
          style={styles.statsButton}
          onPress={() => setShowStats(true)}
        >
          <Text style={styles.statsButtonText}>Thống kê</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        placeholder="Tìm theo ID, tên chủ sân hoặc email..."
        style={styles.searchInput}
        value={searchKeyword}
        onChangeText={setSearchKeyword}
      />

      <View style={styles.yearFilterContainer}>
        {years.map((year) => (
          <TouchableOpacity
            key={year.value}
            style={[
              styles.yearButton,
              selectedYear === year.value && styles.yearButtonSelected,
            ]}
            onPress={() => setSelectedYear(year.value)}
          >
            <Text
              style={[
                styles.yearButtonText,
                selectedYear === year.value && styles.yearButtonTextSelected,
              ]}
            >
              {year.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredRevenues}
        keyExtractor={(item) => item.revenue_id.toString()}
        renderItem={renderRevenueItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Không tìm thấy doanh thu nào.</Text>
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
            <Text style={styles.modalTitle}>Thống kê doanh thu</Text>
            <View style={styles.statsContainer}>
              <Text style={styles.modalText}>
                Tổng số bản ghi doanh thu: {stats.totalRevenues}
              </Text>
              <Text style={styles.modalText}>
                Tổng doanh thu: {formatServicePr(stats.totalRevenueAmount)}
              </Text>
              {pieChartData.length > 0 ? (
                <PieChart
                  data={pieChartData}
                  width={screenWidth * 0.7}
                  height={220}
                  chartConfig={{
                    color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
                    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                    style: {
                      borderRadius: 16,
                    },
                  }}
                  accessor={"population"}
                  backgroundColor={"transparent"}
                  paddingLeft={"15"}
                  absolute // Hiển thị giá trị tuyệt đối
                  style={styles.chart}
                />
              ) : (
                <Text style={styles.noDataText}>
                  Không có dữ liệu để hiển thị biểu đồ.
                </Text>
              )}
              <Text style={styles.modalSubTitle}>
                Top 3 năm có doanh thu cao nhất:
              </Text>
              {stats.topYears.length > 0 ? (
                stats.topYears.map((year, index) => (
                  <Text key={index} style={styles.modalText}>
                    {index + 1}. Năm {year.year}: {formatServicePr(year.total)}
                  </Text>
                ))
              ) : (
                <Text style={styles.modalText}>Chưa có dữ liệu</Text>
              )}
              <Text style={styles.modalSubTitle}>
                Top 3 chủ sân có doanh thu cao nhất:
              </Text>
              {stats.topOwners.length > 0 ? (
                stats.topOwners.map((owner, index) => (
                  <Text key={index} style={styles.modalText}>
                    {index + 1}. {owner.name}: {formatServicePr(owner.total)}
                  </Text>
                ))
              ) : (
                <Text style={styles.modalText}>Chưa có dữ liệu</Text>
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
  yearFilterContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
    marginBottom: 16,
  },
  yearButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: "#E0E0E0",
    marginBottom: 8,
  },
  yearButtonSelected: {
    backgroundColor: "#4CAF50",
  },
  yearButtonText: {
    color: "#000",
    fontWeight: "500",
  },
  yearButtonTextSelected: {
    color: "#fff",
    fontWeight: "700",
  },
  revenueItem: {
    padding: 12,
    marginBottom: 10,
    borderRadius: 10,
    backgroundColor: "#F1F1F1",
  },
  id: {
    fontSize: 18,
    fontWeight: "600",
  },
  info: {
    fontSize: 14,
    color: "#888",
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
  modalSubTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 12,
    marginBottom: 8,
    color: "#333",
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
});

export default ManageRevenue;