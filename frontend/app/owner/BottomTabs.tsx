import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, usePathname } from "expo-router";

const BottomTabs = () => {
  const router = useRouter();
  const pathname = usePathname(); // To determine the current route for active tab styling

  const tabs: {
    name: string;
    icon: "calendar-outline" | "information-circle-outline" | "notifications-outline" | "person-outline";
    route: string;
    hasNotification?: boolean;
  }[] = [
    {
      name: "Quản lý lịch",
      icon: "calendar-outline",
      route: "/owner/schedule",
    },
    {
      name: "Thông tin sân",
      icon: "information-circle-outline",
      route: "/owner/field-info",
    },
    {
      name: "Thông báo",
      icon: "notifications-outline",
      route: "/owner/notifications",
      hasNotification: true, // For the red dot
    },
    {
      name: "Hồ sơ",
      icon: "person-outline",
      route: "/owner/profile",
    },
  ];

  return (
    <View style={styles.tabContainer}>
      {tabs.map((tab, index) => {
        const isActive = pathname === tab.route;
        return (
          <TouchableOpacity
            key={index}
            style={styles.tabItem}
            onPress={() => router.push({ pathname: tab.route as typeof pathname })}
          >
            <View style={styles.iconContainer}>
              <Ionicons
                name={tab.icon}
                size={24}
                color={isActive ? "#3F51B5" : "#000"}
              />
              {tab.hasNotification && (
                <View style={styles.notificationDot} />
              )}
            </View>
            <Text
              style={[
                styles.tabText,
                { color: isActive ? "#3F51B5" : "#000" },
              ]}
            >
              {tab.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  tabContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    paddingVertical: 10,
    paddingBottom: 20, // Extra padding for safe area on iOS
  },
  tabItem: {
    alignItems: "center",
    justifyContent: "center",
  },
  iconContainer: {
    position: "relative",
  },
  notificationDot: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 10,
    height: 10,
    backgroundColor: "red",
    borderRadius: 5,
  },
  tabText: {
    fontSize: 12,
    marginTop: 5,
  },
});

export default BottomTabs;