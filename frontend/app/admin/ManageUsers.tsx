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
  Alert,
  Dimensions,
} from "react-native";
import { PieChart } from "react-native-chart-kit";
import { getAllUsers, updateUserStatus } from "@/constants/apiService";

interface User {
  user_id: number;
  full_name: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  created_at: string;
}

const ManageUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [searchKeyword, setSearchKeyword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showStats, setShowStats] = useState<boolean>(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await getAllUsers();
      setUsers(data);
      filterUsers(data, selectedRole, searchKeyword);
    } catch (err: any) {
      setError(err.message || "Đã xảy ra lỗi khi lấy danh sách người dùng.");
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = (data: User[], role: string, keyword: string) => {
    let filtered = data;

    if (role !== "all") {
      filtered = filtered.filter((user) => user.role === role);
    }

    if (keyword.trim() !== "") {
      const lowerKeyword = keyword.toLowerCase();
      filtered = filtered.filter(
        (user) =>
          user.full_name.toLowerCase().includes(lowerKeyword) ||
          user.email.toLowerCase().includes(lowerKeyword)
      );
    }

    setFilteredUsers(filtered);
  };

  const toggleUserStatus = async (user: User) => {
    try {
      let newStatus: 'active' | 'inactive';
      if (user.status === 'active') {
        newStatus = 'inactive';
      } else {
        newStatus = 'active';
      }
  
      await updateUserStatus(user.user_id.toString(), newStatus);
  
      const updatedUsers = users.map((u) =>
        u.user_id === user.user_id ? { ...u, status: newStatus } : u
      );
  
      setUsers(updatedUsers);
  
      filterUsers(updatedUsers, selectedRole, searchKeyword);
  
      Alert.alert("Thành công", `Đã chuyển trạng thái người dùng thành ${newStatus}`);
    } catch (error: any) {
      console.error("Lỗi khi cập nhật trạng thái người dùng:", error);
      Alert.alert("Lỗi", error.message || "Không thể cập nhật trạng thái người dùng");
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers(users, selectedRole, searchKeyword);
  }, [selectedRole, searchKeyword, users]);

  const renderUserItem = ({ item }: { item: User }) => (
    <View style={styles.userItem}>
      <Text style={styles.name}>{item.full_name}</Text>
      <Text style={styles.email}>{item.email}</Text>
      <Text style={styles.info}>SĐT: {item.phone}</Text>
      <Text style={styles.info}>Quyền: {item.role}</Text>
      <Text style={styles.info}>Trạng thái: {item.status}</Text>
      <Text style={styles.info}>Tạo lúc: {new Date(item.created_at).toLocaleString()}</Text>
      <TouchableOpacity
        style={[
          styles.toggleButton,
          item.status === "active" ? styles.toggleButtonActive : styles.toggleButtonInactive,
        ]}
        onPress={() => toggleUserStatus(item)}
      >
        <Text style={styles.toggleButtonText}>
          Chuyển sang {item.status === "active" ? "Không hoạt động" : "Hoạt động"}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const roles = [
    { label: "Tất cả", value: "all" },
    { label: "Khách hàng", value: "customer" },
    { label: "Admin", value: "admin" },
    { label: "Owner", value: "owner" },
  ];

  const getStatistics = () => {
    const totalUsers = users.length;
    const totalCustomers = users.filter((user) => user.role === "customer").length;
    const totalOwners = users.filter((user) => user.role === "owner").length;
    const totalActive = users.filter((user) => user.status === "active").length;
    const totalInactive = users.filter((user) => user.status === "inactive").length;

    return {
      totalUsers,
      totalCustomers,
      totalOwners,
      totalActive,
      totalInactive,
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
      name: "Khách hàng",
      population: stats.totalCustomers,
      color: "#4CAF50",
      legendFontColor: "#333",
      legendFontSize: 14,
    },
    {
      name: "Owner",
      population: stats.totalOwners,
      color: "#FF9800",
      legendFontColor: "#333",
      legendFontSize: 14,
    },
    {
      name: "Active",
      population: stats.totalActive,
      color: "#2196F3",
      legendFontColor: "#333",
      legendFontSize: 14,
    },
    {
      name: "Inactive",
      population: stats.totalInactive,
      color: "#F44336",
      legendFontColor: "#333",
      legendFontSize: 14,
    },
  ];

  const screenWidth = Dimensions.get("window").width;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Danh sách người dùng</Text>
        <TouchableOpacity
          style={styles.statsButton}
          onPress={() => setShowStats(true)}
        >
          <Text style={styles.statsButtonText}>Thống kê</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        placeholder="Tìm theo tên hoặc email..."
        style={styles.searchInput}
        value={searchKeyword}
        onChangeText={setSearchKeyword}
      />

      <View style={styles.roleFilterContainer}>
        {roles.map((role) => (
          <TouchableOpacity
            key={role.value}
            style={[
              styles.roleButton,
              selectedRole === role.value && styles.roleButtonSelected,
            ]}
            onPress={() => setSelectedRole(role.value)}
          >
            <Text
              style={[
                styles.roleButtonText,
                selectedRole === role.value && styles.roleButtonTextSelected,
              ]}
            >
              {role.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => item.user_id.toString()}
        renderItem={renderUserItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Không tìm thấy người dùng nào.</Text>
        }
        nestedScrollEnabled={true}
      />

      <Modal
        visible={showStats}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowStats(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Thống kê người dùng</Text>
            <View style={styles.statsContainer}>
              <Text style={styles.modalText}>Tổng số người dùng: {stats.totalUsers}</Text>
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
  roleFilterContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 16,
  },
  roleButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: "#E0E0E0",
  },
  roleButtonSelected: {
    backgroundColor: "#4CAF50",
  },
  roleButtonText: {
    color: "#000",
    fontWeight: "500",
  },
  roleButtonTextSelected: {
    color: "#fff",
    fontWeight: "700",
  },
  userItem: {
    padding: 12,
    marginBottom: 10,
    borderRadius: 10,
    backgroundColor: "#F1F1F1",
  },
  name: {
    fontSize: 18,
    fontWeight: "600",
  },
  email: {
    fontSize: 16,
    color: "#555",
  },
  info: {
    fontSize: 14,
    color: "#888",
  },
  toggleButton: {
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  toggleButtonActive: {
    backgroundColor: "#FF4D4F",
  },
  toggleButtonInactive: {
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

export default ManageUsers;