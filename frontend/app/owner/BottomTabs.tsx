// BottomTabs.tsx
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export default function BottomTabs() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <TabButton
        icon="soccer-field"
        iconType="MaterialCommunity"
        label="Quản lý sân"
        onPress={() => router.push("/owner/dashboard")}
      />
      <TabButton
        icon="notifications-outline"
        iconType="Ionicons"
        label="Thông báo"
        onPress={() => router.push("/owner/notifications")}
      />
      <TabButton
        icon="person-outline"
        iconType="Ionicons"
        label="Hồ sơ"
        onPress={() => router.push("/owner/profile")}
      />
    </View>
  );
}

type TabButtonProps = {
  icon: string;
  iconType: "Ionicons" | "MaterialCommunity";
  label: string;
  onPress: () => void;
};

function TabButton({ icon, iconType, label, onPress }: TabButtonProps) {
  return (
    <TouchableOpacity style={styles.tabButton} onPress={onPress}>
      {iconType === "Ionicons" ? (
        <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={24} color="#3F51B5" />
      ) : (
        <MaterialCommunityIcons name={icon as keyof typeof MaterialCommunityIcons.glyphMap} size={24} color="#3F51B5" />
      )}
      <Text style={styles.tabLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#ccc",
    paddingVertical: 10,
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 5,
  },
  tabLabel: {
    fontSize: 12,
    color: "#3F51B5",
    marginTop: 4,
  },
});
