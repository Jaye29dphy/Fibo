import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { AVATAR_BASE_URL } from "@/constants/apiConfig";

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

    // If avatar is already a full URL
    if (userInfo.avatar.startsWith("http")) {
      return userInfo.avatar;
    }
    
    // If it's just a filename, prepend the avatar base URL
    return `${AVATAR_BASE_URL}/${userInfo.avatar}?t=${Date.now()}`;
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
