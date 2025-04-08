import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { getAllUsers } from "@/constants/apiService";

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

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers(users, selectedRole, searchKeyword);
  }, [selectedRole, searchKeyword]);

  const renderUserItem = ({ item }: { item: User }) => (
    <View style={styles.userItem}>
      <Text style={styles.name}>{item.full_name}</Text>
      <Text style={styles.email}>{item.email}</Text>
      <Text style={styles.info}>SĐT: {item.phone}</Text>
      <Text style={styles.info}>Quyền: {item.role}</Text>
      <Text style={styles.info}>Trạng thái: {item.status}</Text>
      <Text style={styles.info}>Tạo lúc: {new Date(item.created_at).toLocaleString()}</Text>
    </View>
  );

  const roles = [
    { label: "Tất cả", value: "all" },
    { label: "Khách hàng", value: "customer" },
    { label: "Admin", value: "admin" },
    { label: "Owner", value: "owner" },
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
      <Text style={styles.title}>Danh sách người dùng</Text>

      {/* Thanh tìm kiếm */}
      <TextInput
        placeholder="Tìm theo tên hoặc email..."
        style={styles.searchInput}
        value={searchKeyword}
        onChangeText={setSearchKeyword}
      />

      {/* Bộ lọc vai trò */}
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

      {/* Danh sách người dùng */}
      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => item.user_id.toString()}
        renderItem={renderUserItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Không tìm thấy người dùng nào.</Text>
        }
      />
    </View>
  );
};

export default ManageUsers;

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
