import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import BottomTabs from "./BottomTabs"; // Import thanh điều hướng

type OptionButtonProps = {
  label: string;
  color: string;
  icon: keyof typeof Ionicons.glyphMap;
};

export default function Dashboard() {
  return (
    <View style={styles.container}>
      {/* Logo */}
      <View style={styles.logoContainer}>
        <Image source={require("../assets/images/react-logo.png")} style={styles.logo} />
      </View>

      {/* Header Text */}
      <Text style={styles.headerText}>Kết nối đam mê, đặt sân mọi lúc!</Text>

      {/* Option Buttons */}
      <View style={styles.optionsContainer}>
        <OptionButton label="Bóng đá" color="#4CAF50" icon="football-outline" />
        <OptionButton label="Bóng rổ" color="#F44336" icon="basketball-outline" />
        <OptionButton label="Cầu lông" color="#3F51B5" icon="tennisball-outline" />
        <OptionButton label="Pickle ball" color="#9C27B0" icon="ellipse-outline" />
        <OptionButton label="Tennis" color="#CDDC39" icon="tennisball-outline" />
      </View>

      {/* Thanh điều hướng */}
      <BottomTabs />
    </View>
  );
}

function OptionButton({ label, color, icon }: OptionButtonProps) {
  return (
    <TouchableOpacity style={[styles.optionButton, { backgroundColor: color }]}>
      <Ionicons name={icon} size={40} color="white" style={styles.icon} />
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
