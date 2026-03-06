import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useState } from "react";
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useUnistyles } from "react-native-unistyles";
import { useLogs, type MedicineLog } from "../hooks/useLogs";
import { styles } from "../styles/logs.styles";

const FILTERS = ["Today", "This Week", "This Month"] as const;
type Filter = (typeof FILTERS)[number];

function getFilteredLogs(logs: ReturnType<typeof useLogs>["logs"], filter: Filter) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split("T")[0];

  if (filter === "Today") return logs.filter((l) => l.date === todayStr);

  if (filter === "This Week") {
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 6);
    const weekAgoStr = weekAgo.toISOString().split("T")[0];
    return logs.filter((l) => l.date >= weekAgoStr);
  }

  // This Month
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    .toISOString()
    .split("T")[0];
  return logs.filter((l) => l.date >= firstOfMonth);
}

function statusColor(status: MedicineLog["status"], colors: { green: string; red: string; orange: string }) {
  if (status === "taken") return colors.green;
  if (status === "missed") return colors.red;
  return colors.orange;
}

function statusLabel(status: MedicineLog["status"]) {
  if (status === "taken") return "Taken";
  if (status === "missed") return "Missed";
  return "Pending";
}

function heartRateFill(avg: number) {
  // Normal resting HR ~60-100; map 40-120 to 0-1
  return Math.min(Math.max((avg - 40) / 80, 0), 1);
}

function spo2Fill(avg: number) {
  // SpO2 normal 95-100; map 90-100 to 0-1
  return Math.min(Math.max((avg - 90) / 10, 0), 1);
}

export default function Logs() {
  const { theme } = useUnistyles();
  const { logs, loading } = useLogs(30);
  const [activeFilter, setActiveFilter] = useState<Filter>("This Week");

  const filteredData = getFilteredLogs(logs, activeFilter);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Patient Logs</Text>
        </View>
      </View>

      {/* Filter Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
        style={{ paddingHorizontal: 20, flexGrow: 0 }}
      >
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f}
            style={activeFilter === f ? styles.filterChipActive : styles.filterChip}
            onPress={() => setActiveFilter(f)}
          >
            <Text style={activeFilter === f ? styles.filterChipTextActive : styles.filterChipText}>{f}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={{ flex: 1, paddingTop: 60, alignItems: "center" }}>
            <ActivityIndicator size="large" color={theme.colors.tabBar} />
          </View>
        ) : filteredData.length === 0 ? (
          <View style={{ paddingTop: 60, alignItems: "center" }}>
            <Text style={{ color: theme.colors.textSecondary, fontSize: 15 }}>No logs for this period</Text>
          </View>
        ) : (
          filteredData.map((day) => {
          const takenCount = day.medicines.filter((m) => m.status === "taken").length;
          const totalCount = day.medicines.length;

          return (
            <View key={day.date}>
              {/* Day Label */}
              <Text style={styles.daySectionLabel}>{day.label}</Text>

              {/* Vitals Row */}
              <View style={styles.vitalsRow}>
                {/* Heart Rate Card */}
                <View style={[styles.vitalCard, styles.vitalCardBorderGreen]}>
                  <View style={styles.vitalIconRow}>
                    <Ionicons name="heart" size={14} color={theme.colors.green} />
                    <Text style={styles.vitalLabel}>Avg Heart Rate</Text>
                  </View>
                  <View style={styles.vitalValueRow}>
                    <Text style={styles.vitalValue}>{day.avgHeartRate}</Text>
                    <Text style={styles.vitalUnit}>bpm</Text>
                  </View>
                  <Text style={styles.vitalSubtext}>
                    {day.avgHeartRateMin}–{day.avgHeartRateMax} bpm range
                  </Text>
                  <View style={styles.rangeBarContainer}>
                    <View
                      style={[
                        styles.rangeBarFill,
                        { width: `${heartRateFill(day.avgHeartRate) * 100}%`, backgroundColor: theme.colors.green },
                      ]}
                    />
                  </View>
                </View>

                {/* SpO2 Card */}
                <View style={[styles.vitalCard, styles.vitalCardBorderBlue]}>
                  <View style={styles.vitalIconRow}>
                    <MaterialCommunityIcons name="water" size={14} color={theme.colors.blue} />
                    <Text style={styles.vitalLabel}>Avg SpO₂</Text>
                  </View>
                  <View style={styles.vitalValueRow}>
                    <Text style={styles.vitalValue}>{day.avgSpo2}</Text>
                    <Text style={styles.vitalUnit}>%</Text>
                  </View>
                  <Text style={styles.vitalSubtext}>
                    {day.avgSpo2Min}–{day.avgSpo2Max}% range
                  </Text>
                  <View style={styles.rangeBarContainer}>
                    <View
                      style={[
                        styles.rangeBarFill,
                        { width: `${spo2Fill(day.avgSpo2) * 100}%`, backgroundColor: theme.colors.blue },
                      ]}
                    />
                  </View>
                </View>
              </View>

              {/* Medicines Card */}
              <View style={styles.medicinesCard}>
                <View style={styles.medicinesCardHeader}>
                  <MaterialCommunityIcons name="pill" size={18} color={theme.colors.textSecondary} />
                  <Text style={styles.medicinesCardTitle}>Medicines</Text>
                  <View style={styles.medicinesBadge}>
                    <Text style={styles.medicinesBadgeText}>
                      {takenCount}/{totalCount} taken
                    </Text>
                  </View>
                </View>
                <View style={styles.divider} />
                {day.medicines.map((med, idx) => (
                  <View
                    key={med.name + idx}
                    style={[styles.medicineItem, idx === day.medicines.length - 1 && styles.medicineItemLast]}
                  >
                    <View
                      style={[styles.medicineStatusDot, { backgroundColor: statusColor(med.status, theme.colors) }]}
                    />
                    <View style={styles.medicineItemContent}>
                      <Text style={styles.medicineItemName}>{med.name}</Text>
                      <Text style={styles.medicineItemDose}>{med.dose}</Text>
                    </View>
                    <View style={{ alignItems: "flex-end" }}>
                      <Text style={styles.medicineItemTime}>
                        {med.takenTime ?? med.scheduledTime}
                      </Text>
                      <Text
                        style={[
                          styles.medicineItemStatus,
                          { color: statusColor(med.status, theme.colors) },
                        ]}
                      >
                        {statusLabel(med.status)}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          );
        })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
