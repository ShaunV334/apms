import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useUnistyles } from "react-native-unistyles";
import { useUser } from "../hooks/useUser";
import { styles } from "../styles/profile.styles";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function statusColor(status: string, colors: Record<string, string>): string {
  const s = status.toLowerCase();
  if (s.includes("stable") || s.includes("good") || s.includes("well")) return colors.green;
  if (s.includes("critical") || s.includes("bad") || s.includes("danger")) return colors.red;
  if (s.includes("monitor") || s.includes("watch")) return colors.orange;
  return colors.blue;
}

export default function ProfileScreen() {
  const { theme } = useUnistyles();
  const user = useUser();

  if (!user) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.tabBar} />
          <Text style={styles.loadingText}>Loading profile…</Text>
        </View>
      </SafeAreaView>
    );
  }

  const carerInitials = getInitials(user.carerName || "C");
  const patientInitials = getInitials(user.patientName || "P");
  const badgeColor = statusColor(user.patientStatus || "", theme.colors as Record<string, string>);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Carer Hero Banner */}
        <View style={styles.heroBanner}>
          <View style={styles.heroAvatar}>
            <Text style={styles.heroInitials}>{carerInitials}</Text>
          </View>
          <Text style={styles.heroName}>{user.carerName}</Text>
          <Text style={styles.heroRole}>Carer</Text>
        </View>

        {/* Carer Info */}
        <Text style={styles.sectionLabel}>Carer Details</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View
              style={[
                styles.infoIconContainer,
                { backgroundColor: theme.colors.tabBar + "18" },
              ]}
            >
              <Ionicons name="person" size={20} color={theme.colors.tabBar} />
            </View>
            <View style={styles.infoTextBlock}>
              <Text style={styles.infoLabel}>Full Name</Text>
              <Text style={styles.infoValue}>{user.carerName}</Text>
            </View>
          </View>

          <View style={styles.infoRowDivider} />

          <View style={styles.infoRow}>
            <View
              style={[
                styles.infoIconContainer,
                { backgroundColor: theme.colors.blue + "18" },
              ]}
            >
              <MaterialCommunityIcons
                name="hand-heart-outline"
                size={20}
                color={theme.colors.blue}
              />
            </View>
            <View style={styles.infoTextBlock}>
              <Text style={styles.infoLabel}>Role</Text>
              <Text style={styles.infoValue}>Carer</Text>
            </View>
          </View>
        </View>

        {/* Patient Info */}
        <Text style={styles.sectionLabel}>Patient Details</Text>
        <View style={styles.infoCard}>
          {/* Accent bar */}
          <View
            style={[styles.patientCardAccent, { backgroundColor: badgeColor }]}
          />

          <View style={styles.infoRow}>
            <View
              style={[
                styles.infoIconContainer,
                { backgroundColor: badgeColor + "22" },
              ]}
            >
              <Ionicons name="person-circle-outline" size={22} color={badgeColor} />
            </View>
            <View style={styles.infoTextBlock}>
              <Text style={styles.infoLabel}>Full Name</Text>
              <Text style={styles.infoValue}>{user.patientName}</Text>
            </View>
          </View>

          <View style={styles.infoRowDivider} />

          <View style={styles.infoRow}>
            <View
              style={[
                styles.infoIconContainer,
                { backgroundColor: badgeColor + "22" },
              ]}
            >
              <MaterialCommunityIcons
                name="heart-pulse"
                size={20}
                color={badgeColor}
              />
            </View>
            <View style={styles.infoTextBlock}>
              <Text style={styles.infoLabel}>Current Status</Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 2 }}>
                <View
                  style={[styles.statusBadge, { backgroundColor: badgeColor }]}
                >
                  <Text style={styles.statusBadgeText}>
                    {user.patientStatus}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.infoRowDivider} />

          <View style={styles.infoRow}>
            <View
              style={[
                styles.infoIconContainer,
                { backgroundColor: theme.colors.orange + "22" },
              ]}
            >
              <Ionicons name="people-outline" size={20} color={theme.colors.orange} />
            </View>
            <View style={styles.infoTextBlock}>
              <Text style={styles.infoLabel}>Assigned Carer</Text>
              <Text style={styles.infoValue}>{user.carerName}</Text>
            </View>
          </View>
        </View>

        {/* Patient Avatar Card */}
        <Text style={styles.sectionLabel}>Patient Overview</Text>
        <View
          style={[
            styles.heroBanner,
            { backgroundColor: badgeColor, marginBottom: 0 },
          ]}
        >
          <View style={styles.heroAvatar}>
            <Text style={styles.heroInitials}>{patientInitials}</Text>
          </View>
          <Text style={styles.heroName}>{user.patientName}</Text>
          <View style={[styles.statusBadge, { backgroundColor: "#FFFFFF33", marginTop: 4 }]}>
            <Text style={[styles.statusBadgeText, { fontSize: 13 }]}>
              {user.patientStatus}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
