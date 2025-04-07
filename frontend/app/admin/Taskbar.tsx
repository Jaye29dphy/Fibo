import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";

interface UserInfo {
  name: string;
  email: string;
  avatar?: string;
}

interface TaskbarProps {
  userInfo: UserInfo | null;
  onAvatarPress: () => void;
}

export default function Taskbar({ userInfo, onAvatarPress }: TaskbarProps) {
  const defaultAvatar = "https://www.w3schools.com/howto/img_avatar.png";

  const getAvatarUri = () => {
    if (!userInfo?.avatar) return defaultAvatar;

    // Nếu đường dẫn có localhost thì thay bằng IP hoặc trả về ảnh mặc định
    if (userInfo.avatar.includes("localhost")) {
      return defaultAvatar;
    }

    return userInfo.avatar;
  };

  return (
    <View style={styles.taskbar}>
      <Text style={styles.title}>Admin Dashboard</Text>
      <TouchableOpacity onPress={onAvatarPress}>
        <Image
          source={{ uri: getAvatarUri() }}
          style={styles.avatar}
          onError={() => console.log("Lỗi load avatar")}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  taskbar: {
    height: 60,
    backgroundColor: "#2c3e50",
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
});
