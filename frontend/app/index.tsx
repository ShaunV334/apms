import { Ionicons } from "@expo/vector-icons";
import { useCallback, useRef, useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { LineChart } from "react-native-gifted-charts";
import PagerView from "react-native-pager-view";
import { SafeAreaView } from "react-native-safe-area-context";
import { useUnistyles } from "react-native-unistyles";
import AuthScreen from "../components/AuthScreen";
import TabBar from "../components/TabBar";
import { useAuth } from "../hooks/useAuth";
import { useFallDetection } from "../hooks/useFallDetection";
import { useMedicines, type Medicine } from "../hooks/useMedicines";
import { useNotificationSetup } from "../hooks/useNotificationSetup";
import { useUser } from "../hooks/useUser";
import { useLatestVitals } from "../hooks/useVitals";
import { useVitalAlerts } from "../hooks/useVitalAlerts";
import { useFallAlerts } from "../hooks/useFallAlerts";
import { useMedicineAlerts } from "../hooks/useMedicineAlerts";
import AudioScreen from "../screens/audio";
import LogsScreen from "../screens/logs";
import MapScreen from "../screens/map";
import MedicineScreen from "../screens/medicine";
import ProfileScreen from "../screens/profile";
import { styles } from "../styles/index.styles";

const DAY_KEYS_ORDERED = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

function computeNextMedicine(medicines: Medicine[]): string {
  const now = new Date();
  const todayKey = DAY_KEYS_ORDERED[now.getDay()];
  const currentMins = now.getHours() * 60 + now.getMinutes();

  function toMins(hour: string, minute: string, ampm: string): number {
    let h = parseInt(hour, 10);
    const m = parseInt(minute, 10);
    if (ampm === "PM" && h !== 12) h += 12;
    if (ampm === "AM" && h === 12) h = 0;
    return h * 60 + m;
  }

  const upcoming = medicines
    .filter((m) => m.enabled && m.days.includes(todayKey))
    .map((m) => ({ m, mins: toMins(m.hour, m.minute, m.ampm) }))
    .filter(({ mins }) => mins > currentMins)
    .sort((a, b) => a.mins - b.mins);

  if (upcoming.length === 0) return "No more medicines today";
  const { m } = upcoming[0];
  return `${m.name} (${m.dose}) at ${m.hour}:${m.minute} ${m.ampm}`;
}

function HomeContent() {
  const { theme } = useUnistyles();
  const { readings, currentHeartRate, currentSpo2 } = useLatestVitals(10);
  const user = useUser();
  const { medicines } = useMedicines();
  const latestFall = useFallDetection();

  // Set up medicine notifications
  useNotificationSetup(medicines);

  // Set up vital alerts (heart rate and SpO2)
  useVitalAlerts();

  // Set up fall detection alerts
  useFallAlerts();

  // Set up medicine reminder alerts
  useMedicineAlerts(medicines);

  const heartRateData = readings.map((r) => ({ value: r.heartRate }));
  const spo2Data = readings.map((r) => ({ value: r.spo2 }));
  const nextMedicine = computeNextMedicine(medicines);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {user?.carerName ?? "—"}</Text>
          <Text style={styles.patientStatus}>
            {user?.patientName ?? "—"}: {user?.patientStatus ?? "—"}
          </Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Dashboard Title */}
        <Text style={styles.sectionTitle}>Home Dashboard</Text>

        {/* Fall Detected Alert */}
        {latestFall ? (
          <View style={styles.alertCard}>
            <View style={styles.alertRow}>
              <View>
                <Text style={styles.alertTitle}>FALL DETECTED!</Text>
                <Text style={styles.alertTime}>{latestFall.formattedTime}</Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={[styles.alertCard, { backgroundColor: theme.colors.green }]}>
            <View style={styles.alertRow}>
              <View>
                <Text style={styles.alertTitle}>No Falls Detected</Text>
                <Text style={styles.alertTime}>Patient is safe</Text>
              </View>
              <Ionicons name="shield-checkmark" size={28} color={theme.colors.white} />
            </View>
          </View>
        )}

        {/* Health Metrics Row */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.metricsRow}>
          {/* Heart Rate Card */}
          <View style={styles.heartRateCard}>
            <Text style={styles.metricLabel}>Heart Rate</Text>
            <View style={styles.metricValueRow}>
              <Text style={styles.metricValue}>{currentHeartRate ?? "—"}</Text>
              <Text style={styles.metricUnit}> bpm</Text>
            </View>
            <View style={styles.chartContainer}>
              {heartRateData.length > 0 && (
                <LineChart
                data={heartRateData}
                width={118}
                height={50}
                color={theme.colors.green}
                thickness={2}
                hideDataPoints
                hideYAxisText
                hideAxesAndRules
                areaChart
                startFillColor={theme.colors.green}
                endFillColor="#E8F5E9"
                startOpacity={0.3}
                endOpacity={0.05}
                curved
                initialSpacing={0}
                endSpacing={0}
                noOfSections={3}
              />
              )}
            </View>
          </View>

          {/* SpO2 Card */}
          <View style={styles.spo2Card}>
            <Text style={styles.metricLabel}>SpO₂</Text>
            <View style={styles.metricValueRow}>
              <Text style={styles.metricValue}>{currentSpo2 ?? "—"}</Text>
              <Text style={styles.metricUnit}>%</Text>
            </View>
            <View style={styles.chartContainer}>
              {spo2Data.length > 0 && (
                <LineChart
                data={spo2Data}
                width={118}
                height={50}
                color={theme.colors.blue}
                thickness={2}
                hideDataPoints
                hideYAxisText
                hideAxesAndRules
                areaChart
                startFillColor={theme.colors.blue}
                endFillColor="#E3F2FD"
                startOpacity={0.3}
                endOpacity={0.05}
                curved
                initialSpacing={0}
                endSpacing={0}
                noOfSections={3}
              />
              )}
            </View>
          </View>
          <View style={styles.locationCard}>
            <Text style={styles.metricLabel}>Location</Text>
            <Text style={styles.metricValue2}>Home:</Text>
            <Text style={styles.metricValue2}>Safe Zone</Text>
            <View style={styles.locationIconContainer}>
              <Ionicons name="location" size={28} color={theme.colors.blue} />
            </View>
          </View>
        </ScrollView>

        {/* Next Medicine Card */}
        <View style={[styles.medicineCard, { marginBottom: 100 }]}>
          <View style={styles.medicineContent}>
            <Text style={styles.medicineTitle}>Next Medicine:</Text>
            <Text style={styles.medicineName}>{nextMedicine}</Text>
          </View>
          <Ionicons name="time-outline" size={28} color={theme.colors.textSecondary} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function LoadingPage() {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F0F2F5" }}>
      <ActivityIndicator size="large" color="#1A1A2E" />
    </View>
  );
}

function TabsRoot() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [loadedPages, setLoadedPages] = useState([true, false, false, false, false, false]);
  const pagerRef = useRef<PagerView>(null);

  const onPageSelected = useCallback((e: any) => {
    const idx: number = e.nativeEvent.position;
    setActiveIndex(idx);
    setLoadedPages((prev) => {
      if (prev[idx]) return prev;
      const next = [...prev];
      next[idx] = true;
      return next;
    });
  }, []);

  const onTabPress = useCallback((index: number) => {
    pagerRef.current?.setPage(index);
    setLoadedPages((prev) => {
      if (prev[index]) return prev;
      const next = [...prev];
      next[index] = true;
      return next;
    });
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: "#1A1A2E" }}>
      <PagerView
        ref={pagerRef}
        style={{ flex: 1 }}
        initialPage={0}
        overdrag
        pageMargin={10}
        offscreenPageLimit={1}
        onPageSelected={onPageSelected}
      >
        <View key="0" style={{ flex: 1 }}>
          <HomeContent />
        </View>
        <View key="1" style={{ flex: 1 }}>
          {loadedPages[1] ? <MapScreen /> : <LoadingPage />}
        </View>
        <View key="2" style={{ flex: 1 }}>
          {loadedPages[2] ? <LogsScreen /> : <LoadingPage />}
        </View>
        <View key="3" style={{ flex: 1 }}>
          {loadedPages[3] ? <MedicineScreen /> : <LoadingPage />}
        </View>
        <View key="4" style={{ flex: 1 }}>
          {loadedPages[4] ? <AudioScreen /> : <LoadingPage />}
        </View>
        <View key="5" style={{ flex: 1 }}>
          {loadedPages[5] ? <ProfileScreen /> : <LoadingPage />}
        </View>
      </PagerView>
      <TabBar activeIndex={activeIndex} onTabPress={onTabPress} />
    </View>
  );
}

export default function IndexRoute() {
  const { authUser, initializing } = useAuth();

  if (initializing) {
    return <LoadingPage />;
  }

  if (!authUser) {
    return <AuthScreen />;
  }

  return <TabsRoot />;
}
