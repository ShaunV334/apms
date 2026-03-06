import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useUnistyles } from "react-native-unistyles";
import { type DayKey, type DurationType, useMedicines } from "../hooks/useMedicines";
import { styles } from "../styles/medicine.styles";

const DAYS = ["M", "T", "W", "T", "F", "S", "S"] as const;
const DAY_KEYS: DayKey[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const EMPTY_FORM = {
  name: "",
  dose: "",
  hour: "08",
  minute: "00",
  ampm: "AM" as "AM" | "PM",
  days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as DayKey[],
  durationType: "permanent" as DurationType,
  startDate: "",
  endDate: "",
};

function formatDays(days: DayKey[]) {
  if (days.length === 7) return "Every day";
  if (days.length === 0) return "No days";
  const weekdays: DayKey[] = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  const weekend: DayKey[] = ["Sat", "Sun"];
  if (weekdays.every((d) => days.includes(d)) && !days.includes("Sat") && !days.includes("Sun"))
    return "Weekdays";
  if (weekend.every((d) => days.includes(d)) && days.length === 2) return "Weekends";
  return days.join(", ");
}

export default function Medicine() {
  const { theme } = useUnistyles();
  const { medicines, loading, addMedicine, toggleMedicine } = useMedicines();
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });

  const activeCount = medicines.filter((m) => m.enabled).length;

  function toggleFormDay(day: DayKey) {
    setForm((f) => ({
      ...f,
      days: f.days.includes(day) ? f.days.filter((d) => d !== day) : [...f.days, day],
    }));
  }

  function openModal() {
    setForm({ ...EMPTY_FORM });
    setModalVisible(true);
  }

  async function saveMedicine() {
    if (!form.name.trim()) return;
    await addMedicine({
      name: form.name.trim(),
      dose: form.dose.trim() || "—",
      hour: form.hour,
      minute: form.minute,
      ampm: form.ampm,
      days: form.days,
      durationType: form.durationType,
      startDate: form.startDate,
      endDate: form.endDate,
    });
    setModalVisible(false);
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Medicine</Text>
        <TouchableOpacity style={styles.addButton} onPress={openModal}>
          <Ionicons name="add" size={22} color={theme.colors.white} />
        </TouchableOpacity>
      </View>

      {/* Summary Banner */}
      <View style={{ paddingHorizontal: 20, marginTop: 4 }}>
        <View style={styles.summaryBanner}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{medicines.length}</Text>
            <Text style={styles.summaryLabel}>Total</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{activeCount}</Text>
            <Text style={styles.summaryLabel}>Active</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{medicines.length - activeCount}</Text>
            <Text style={styles.summaryLabel}>Paused</Text>
          </View>
        </View>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={theme.colors.tabBar} />
        </View>
      ) : (
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {medicines.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <MaterialCommunityIcons name="pill" size={36} color={theme.colors.textSecondary} />
              </View>
              <Text style={styles.emptyTitle}>No medicines added</Text>
              <Text style={styles.emptySubtitle}>
                Tap the + button to add{"\n"}a medicine schedule
              </Text>
            </View>
          ) : (
            medicines.map((med) => (
            <View
              key={med.id}
              style={[styles.alarmCard, !med.enabled && styles.alarmCardDisabled]}
            >
              {/* Colour accent bar */}
              <View style={[styles.alarmCardAccent, { backgroundColor: med.color }]} />

              <View style={styles.alarmCardBody}>
                {/* Time + Toggle */}
                <View style={styles.alarmTopRow}>
                  <View style={styles.alarmTimeBlock}>
                    <Text
                      style={[
                        styles.alarmTime,
                        !med.enabled && styles.alarmTimeDisabled,
                      ]}
                    >
                      {med.hour}:{med.minute}
                    </Text>
                    <Text style={styles.alarmAmPm}>{med.ampm}</Text>
                  </View>
                  <Switch
                    value={med.enabled}
                    onValueChange={() => toggleMedicine(med.id, med.enabled)}
                    trackColor={{ false: theme.colors.lightGray, true: med.color + "66" }}
                    thumbColor={med.enabled ? med.color : "#CCCCCC"}
                    ios_backgroundColor={theme.colors.lightGray}
                  />
                </View>

                {/* Name + Dose */}
                <View style={styles.alarmMeta}>
                  <Text style={styles.alarmName}>{med.name}</Text>
                  <Text style={styles.alarmDose}>{med.dose}</Text>
                </View>

                <View style={styles.alarmDivider} />

                {/* Days + Duration */}
                <View style={styles.alarmBottomRow}>
                  <View style={styles.daysRow}>
                    {DAY_KEYS.map((key, i) => {
                      const active = med.days.includes(key);
                      return (
                        <View
                          key={key}
                          style={[
                            active ? styles.dayChipActive : styles.dayChip,
                            active ? { backgroundColor: med.color } : {},
                          ]}
                        >
                          <Text
                            style={active ? styles.dayChipTextActive : styles.dayChipText}
                          >
                            {DAYS[i]}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </View>

                <View style={{ marginTop: 10 }}>
                  <View style={styles.durationBadge}>
                    {med.durationType === "permanent" ? (
                      <>
                        <Ionicons name="infinite" size={13} color={theme.colors.green} />
                        <Text style={styles.durationTextPermanent}>Permanent</Text>
                      </>
                    ) : (
                      <>
                        <Ionicons
                          name="calendar-outline"
                          size={13}
                          color={theme.colors.textSecondary}
                        />
                        <Text style={styles.durationText}>
                          {med.startDate} → {med.endDate}
                        </Text>
                      </>
                    )}
                  </View>
                </View>
              </View>
            </View>
            ))
          )}
          <View style={{ height: 100 }} />
        </ScrollView>
      )}

      {/* Add Medicine Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <TouchableOpacity activeOpacity={1} onPress={() => {}}>
            <View style={styles.modalSheet}>
              <View style={styles.modalHandle} />
              <Text style={styles.modalTitle}>Add Medicine</Text>

              {/* Name */}
              <Text style={styles.fieldLabel}>Medicine Name</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Amlodipine"
                placeholderTextColor={theme.colors.textSecondary}
                value={form.name}
                onChangeText={(v) => setForm((f) => ({ ...f, name: v }))}
              />

              {/* Dose */}
              <Text style={styles.fieldLabel}>Dose</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. 5mg — 1 tablet"
                placeholderTextColor={theme.colors.textSecondary}
                value={form.dose}
                onChangeText={(v) => setForm((f) => ({ ...f, dose: v }))}
              />

              {/* Time */}
              <Text style={styles.fieldLabel}>Time</Text>
              <View style={styles.timePickerRow}>
                <TextInput
                  style={[styles.timePickerBox, { flex: 1 }]}
                  value={form.hour}
                  onChangeText={(v) => setForm((f) => ({ ...f, hour: v.slice(0, 2) }))}
                  keyboardType="number-pad"
                  maxLength={2}
                  textAlign="center"
                  inputMode="numeric"
                />
                <Text style={styles.timePickerSep}>:</Text>
                <TextInput
                  style={[styles.timePickerBox, { flex: 1 }]}
                  value={form.minute}
                  onChangeText={(v) => setForm((f) => ({ ...f, minute: v.slice(0, 2) }))}
                  keyboardType="number-pad"
                  maxLength={2}
                  textAlign="center"
                  inputMode="numeric"
                />
              </View>
              <View style={styles.amPmRow}>
                {(["AM", "PM"] as const).map((ap) => (
                  <TouchableOpacity
                    key={ap}
                    style={[
                      form.ampm === ap ? styles.amPmChipActive : styles.amPmChip,
                      form.ampm === ap ? { backgroundColor: theme.colors.tabBar } : {},
                    ]}
                    onPress={() => setForm((f) => ({ ...f, ampm: ap }))}
                  >
                    <Text style={form.ampm === ap ? styles.amPmTextActive : styles.amPmText}>
                      {ap}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Days */}
              <Text style={styles.fieldLabel}>Repeat</Text>
              <View style={styles.modalDaysRow}>
                {DAY_KEYS.map((key, i) => {
                  const active = form.days.includes(key);
                  return (
                    <TouchableOpacity
                      key={key}
                      style={[
                        active ? styles.modalDayChipActive : styles.modalDayChip,
                        active ? { backgroundColor: theme.colors.tabBar } : {},
                      ]}
                      onPress={() => toggleFormDay(key)}
                    >
                      <Text style={active ? styles.modalDayTextActive : styles.modalDayText}>
                        {DAYS[i]}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Duration */}
              <Text style={styles.fieldLabel}>Duration</Text>
              <View style={styles.durationToggleRow}>
                {(["permanent", "range"] as const).map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      form.durationType === type
                        ? styles.durationToggleChipActive
                        : styles.durationToggleChip,
                      form.durationType === type
                        ? { backgroundColor: theme.colors.tabBar }
                        : {},
                    ]}
                    onPress={() => setForm((f) => ({ ...f, durationType: type }))}
                  >
                    <Ionicons
                      name={type === "permanent" ? "infinite" : "calendar-outline"}
                      size={14}
                      color={
                        form.durationType === type
                          ? theme.colors.white
                          : theme.colors.textSecondary
                      }
                    />
                    <Text
                      style={
                        form.durationType === type
                          ? styles.durationToggleTextActive
                          : styles.durationToggleText
                      }
                    >
                      {type === "permanent" ? "Permanent" : "Date Range"}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {form.durationType === "range" && (
                <View style={styles.dateRangeRow}>
                  <View style={styles.dateBox}>
                    <Text style={styles.dateBoxLabel}>Start</Text>
                    <TextInput
                      style={{ fontSize: 13, fontWeight: "700", color: theme.colors.textPrimary }}
                      placeholder="e.g. Feb 24, 2026"
                      placeholderTextColor={theme.colors.textSecondary}
                      value={form.startDate}
                      onChangeText={(v) => setForm((f) => ({ ...f, startDate: v }))}
                    />
                  </View>
                  <Text style={styles.dateRangeArrow}>→</Text>
                  <View style={styles.dateBox}>
                    <Text style={styles.dateBoxLabel}>End</Text>
                    <TextInput
                      style={{ fontSize: 13, fontWeight: "700", color: theme.colors.textPrimary }}
                      placeholder="e.g. Mar 24, 2026"
                      placeholderTextColor={theme.colors.textSecondary}
                      value={form.endDate}
                      onChangeText={(v) => setForm((f) => ({ ...f, endDate: v }))}
                    />
                  </View>
                </View>
              )}

              {/* Save */}
              <TouchableOpacity
                style={[styles.saveButton, { backgroundColor: theme.colors.tabBar }]}
                onPress={saveMedicine}
              >
                <Text style={styles.saveButtonText}>Save Medicine</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}
