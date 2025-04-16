// app/owner/schedule-details/[id].tsx
import { View, Text } from "react-native";
import { useLocalSearchParams } from "expo-router";

export default function ScheduleDetails() {
  const { id } = useLocalSearchParams();
  return (
    <View>
      <Text>Schedule Details for Field ID: {id}</Text>
    </View>
  );
}