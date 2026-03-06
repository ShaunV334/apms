import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useRef } from "react";
import { Animated, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StyleSheet } from "react-native-unistyles";
import "../unistyles";

const styles = StyleSheet.create((theme) => ({
  bar: {
    position: "absolute",
    left: 16,
    right: 16,
    flexDirection: "row",
    backgroundColor: theme.colors.tabBar,
    borderRadius: 28,
    paddingHorizontal: 8,
    paddingVertical: 10,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
    elevation: 12,
  },
  item: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
    gap: 3,
    borderRadius: 20,
  },
  itemActive: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
    gap: 3,
    borderRadius: 20,
    backgroundColor: "#FFFFFF18",
  },
  label: {
    fontSize: 10,
    fontWeight: "500",
    color: "#9E9EC8",
  },
  labelActive: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FFFFFF",
  },
}));

type TabKey = "home" | "map" | "logs" | "medicine" | "audio" | "profile";

const TAB_INDEX: Record<TabKey, number> = {
  home: 0,
  map: 1,
  logs: 2,
  medicine: 3,
  audio: 4,
  profile: 5,
};

const TABS: {
  key: TabKey;
  label: string;
  icon: (active: boolean) => React.ReactNode;
}[] = [
  {
    key: "home",
    label: "Home",
    icon: (active) => (
      <Ionicons
        name={active ? "home" : "home-outline"}
        size={22}
        color={active ? "#FFFFFF" : "#9E9EC8"}
      />
    ),
  },
  {
    key: "map",
    label: "Map",
    icon: (active) => (
      <Ionicons
        name={active ? "location" : "location-outline"}
        size={22}
        color={active ? "#FFFFFF" : "#9E9EC8"}
      />
    ),
  },
  {
    key: "logs",
    label: "Logs",
    icon: (active) => (
      <Ionicons
        name={active ? "document-text" : "document-text-outline"}
        size={22}
        color={active ? "#FFFFFF" : "#9E9EC8"}
      />
    ),
  },
  {
    key: "medicine",
    label: "Medicine",
    icon: (active) => (
      <MaterialCommunityIcons
        name="pill"
        size={22}
        color={active ? "#FFFFFF" : "#9E9EC8"}
      />
    ),
  },
  {
    key: "audio",
    label: "Audio",
    icon: (active) => (
      <Ionicons
        name={active ? "mic" : "mic-outline"}
        size={22}
        color={active ? "#FFFFFF" : "#9E9EC8"}
      />
    ),
  },
  {
    key: "profile",
    label: "Profile",
    icon: (active) => (
      <Ionicons
        name={active ? "person-circle" : "person-circle-outline"}
        size={22}
        color={active ? "#FFFFFF" : "#9E9EC8"}
      />
    ),
  },
];

type TabBarProps = {
  activeIndex: number;
  onTabPress: (index: number) => void;
};

export default function TabBar({ activeIndex, onTabPress }: TabBarProps) {
  const insets = useSafeAreaInsets();

  // Per-tab scale animations for a subtle "pop" on activation
  const scaleAnims = useRef(TABS.map(() => new Animated.Value(1))).current;

  useEffect(() => {
    TABS.forEach((_, i) => {
      Animated.spring(scaleAnims[i], {
        toValue: i === activeIndex ? 1.1 : 1,
        useNativeDriver: true,
        speed: 20,
        bounciness: 10,
      }).start();
    });
  }, [activeIndex, scaleAnims]);

  return (
    <View style={[styles.bar, { bottom: insets.bottom + 16 }]}>
      {TABS.map((tab, i) => {
        const tabIdx = TAB_INDEX[tab.key];
        const isActive = i === activeIndex;
        const hasScreen = tabIdx >= 0;

        return (
          <TouchableOpacity
            key={tab.key}
            style={isActive ? styles.itemActive : styles.item}
            onPress={() => hasScreen && onTabPress(tabIdx)}
            activeOpacity={hasScreen ? 0.7 : 1}
          >
            <Animated.View style={{ transform: [{ scale: scaleAnims[i] }] }}>
              {tab.icon(isActive)}
            </Animated.View>
            <Text style={isActive ? styles.labelActive : styles.label}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

