import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons"; // Hoặc từ react-native-vector-icons
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
          label="Pickle ball"
          color="#9C27B0"
          icon="volleyball"
          onPress={() => router.push({ pathname: "/customer/pickfield", params: { sport_type: "volleyball" } })}
        />
        <OptionButton
          label="Tennis"
          color="#CDDC39"
          icon="tennis"
          onPress={() => router.push({ pathname: "/customer/pickfield", params: { sport_type: "tennis" } })}
        />
      </View>

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
    flex: 1,
    alignItems: "center",
    justifyContent: "space-evenly",
  },
  optionButton: {
    width: "80%",
    aspectRatio: 4.5,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    elevation: 2,
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