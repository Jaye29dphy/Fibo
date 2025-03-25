// BottomTabs.tsx
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export default function BottomTabs() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <TabButton icon="football-outline" label="Đặt sân" onPress={() => router.push("/dashboard")} />
      <TabButton icon="calendar-outline" label="Lịch của tôi" onPress={() => router.push("/calendar1")} />
      <TabButton icon="notifications-outline" label="Thông báo" onPress={() => router.push("/notifications")} />
      <TabButton icon="person-outline" label="Hồ sơ" onPress={() => router.push("/profile")} />
    </View>
  );
}

type TabButtonProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
};

function TabButton({ icon, label, onPress }: TabButtonProps) {
  return (
    <TouchableOpacity style={styles.tabButton} onPress={onPress}>
      <Ionicons name={icon} size={24} color="#3F51B5" />
      <Text style={styles.tabLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#ccc",
    paddingVertical: 10,
  },
  tabButton: {
    alignItems: "center",
  },
  tabLabel: {
    fontSize: 12,
    color: "#3F51B5",
    marginTop: 4,
  },
});
