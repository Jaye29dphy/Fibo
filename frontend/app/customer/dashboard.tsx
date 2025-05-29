import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Platform } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import BottomTabs from "./BottomTabs";

type OptionButtonProps = {
  label: string;
  color: string;
  icon: "soccer" | "basketball" | "badminton" | "volleyball" | "tennis";
  onPress?: () => void;
};

export default function Dashboard() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={Platform.OS === "web"} // Hiển thị thanh cuộn trên web
      >
        <View style={styles.logoContainer}>
          <Image source={require("../../assets/images/react-logo.png")} style={styles.logo} />
        </View>

        <Text style={styles.headerText}>Kết nối đam mê, đặt sân mọi lúc!</Text>

        <View style={styles.optionsContainer}>
          <OptionButton
            label="Bóng đá"
            color="#4CAF50"
            icon="soccer"
            onPress={() => router.push({ pathname: "/customer/pickfield", params: { sport_type: "football" } })}
          />
          <OptionButton
            label="Bóng rổ"
            color="#F44336"
            icon="basketball"
            onPress={() => router.push({ pathname: "/customer/pickfield", params: { sport_type: "basketball" } })}
          />
          <OptionButton
            label="Cầu lông"
            color="#3F51B5"
            icon="badminton"
            onPress={() => router.push({ pathname: "/customer/pickfield", params: { sport_type: "badminton" } })}
          />
          <OptionButton
            label="Tennis"
            color="#CDDC39"
            icon="tennis"
            onPress={() => router.push({ pathname: "/customer/pickfield", params: { sport_type: "tennis" } })}
          />
        </View>
      </ScrollView>

      <BottomTabs />
    </View>
  );
}

function OptionButton({ label, color, icon, onPress }: OptionButtonProps) {
  return (
    <TouchableOpacity style={[styles.optionButton, { backgroundColor: color }]} onPress={onPress}>
      <MaterialCommunityIcons name={icon} size={40} color="white" style={styles.icon} />
      <Text style={styles.optionText}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20, // Đảm bảo nội dung không bị che bởi BottomTabs
    alignItems: "center",
  },
  logoContainer: {
    alignItems: "center",
    marginTop: 30,
  },
  logo: {
    width: 70,
    height: 70,
    resizeMode: "contain",
  },
  headerText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#3F51B5",
    textAlign: "center",
    marginTop: 10,
    marginBottom: 20,
  },
  optionsContainer: {
    width: "100%",
    alignItems: "center",
    justifyContent: "space-evenly",
    paddingVertical: 20,
  },
  optionButton: {
    width: "80%",
    aspectRatio: 4.5,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    elevation: 2,
    marginVertical: 10, // Thêm khoảng cách giữa các nút
  },
  icon: {
    marginRight: 15,
  },
  optionText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
});