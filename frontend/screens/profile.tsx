import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { doc, getDoc, getFirestore, updateDoc } from "@react-native-firebase/firestore";
import { SafeAreaView } from "react-native-safe-area-context";
import { useUnistyles } from "react-native-unistyles";
import { useAuth } from "../hooks/useAuth";
import { type PatientProfile, useUser } from "../hooks/useUser";
import { LEGACY_USER_DOC } from "../services/userScope";
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
  const { authUser, signOut } = useAuth();
  const user = useUser();
  const [signingOut, setSigningOut] = useState(false);
  const [patientMenuOpen, setPatientMenuOpen] = useState(false);
  const [newPatientName, setNewPatientName] = useState("");
  const [newPatientStatus, setNewPatientStatus] = useState("Monitoring");
  const [savingPatient, setSavingPatient] = useState(false);

  const patients: PatientProfile[] = Array.isArray(user?.patients)
    ? user.patients
    : [];

  const hasLegacyActivePatient =
    !!user?.patientName &&
    user.patientName !== "No patient assigned" &&
    user.patientName !== "Add patient";

  const managedPatients =
    patients.length > 0
      ? patients
      : hasLegacyActivePatient && user
        ? [
            {
              id: "legacy-active",
              name: user.patientName,
              status: user.patientStatus,
            },
          ]
        : [];

  async function resolveProfileDocId(): Promise<string | null> {
    if (!authUser) {
      return null;
    }

    const primaryRef = doc(getFirestore(), "users", authUser.uid);
    const primarySnapshot = await getDoc(primaryRef);

    return primarySnapshot.exists() ? authUser.uid : LEGACY_USER_DOC;
  }

  async function setActivePatient(patient: PatientProfile) {
    const profileDocId = await resolveProfileDocId();
    if (!profileDocId) return;

    setSavingPatient(true);
    try {
      await updateDoc(doc(getFirestore(), "users", profileDocId), {
        patientName: patient.name,
        patientStatus: patient.status,
      });
    } finally {
      setSavingPatient(false);
    }
  }

  async function addPatient() {
    const name = newPatientName.trim();
    const status = newPatientStatus.trim() || "Monitoring";

    if (!name || !user) {
      return;
    }

    const profileDocId = await resolveProfileDocId();
    if (!profileDocId) return;

    const nextPatient: PatientProfile = {
      id: `patient-${Date.now()}`,
      name,
      status,
    };

    const nextPatients =
      patients.length > 0
        ? [...patients, nextPatient]
        : [...managedPatients, nextPatient];

    setSavingPatient(true);
    try {
      await updateDoc(doc(getFirestore(), "users", profileDocId), {
        patients: nextPatients,
        patientName: name,
        patientStatus: status,
      });
      setNewPatientName("");
      setNewPatientStatus("Monitoring");
    } finally {
      setSavingPatient(false);
    }
  }

  async function removePatient(patientId: string) {
    if (!user) {
      return;
    }

    const profileDocId = await resolveProfileDocId();
    if (!profileDocId) return;

    const nextPatients = managedPatients.filter((p) => p.id !== patientId);
    const nextActive = nextPatients[0] ?? null;

    setSavingPatient(true);
    try {
      await updateDoc(doc(getFirestore(), "users", profileDocId), {
        patients: nextPatients,
        patientName: nextActive?.name ?? "No patient assigned",
        patientStatus: nextActive?.status ?? "Setup needed",
      });
    } finally {
      setSavingPatient(false);
    }
  }

  async function handleSignOut() {
    setSigningOut(true);

    try {
      await signOut();
    } finally {
      setSigningOut(false);
    }
  }

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

        <Text style={styles.sectionLabel}>Patient Menu</Text>
        <View style={styles.infoCard}>
          <View style={styles.accountActionRow}>
            <TouchableOpacity
              style={styles.patientMenuButton}
              onPress={() => setPatientMenuOpen(true)}
            >
              <View style={styles.patientMenuButtonContent}>
                <Ionicons name="people" size={18} color={theme.colors.white} />
                <Text style={styles.patientMenuButtonText}>Manage Patients</Text>
              </View>
            </TouchableOpacity>
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

        <Text style={styles.sectionLabel}>Account</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View
              style={[
                styles.infoIconContainer,
                { backgroundColor: theme.colors.blue + "18" },
              ]}
            >
              <Ionicons name="mail-outline" size={20} color={theme.colors.blue} />
            </View>
            <View style={styles.infoTextBlock}>
              <Text style={styles.infoLabel}>Signed In As</Text>
              <Text style={styles.infoValue}>{authUser?.email ?? "No email available"}</Text>
            </View>
          </View>

          <View style={styles.infoRowDivider} />

          <View style={styles.accountActionRow}>
            <TouchableOpacity
              style={styles.signOutButton}
              onPress={handleSignOut}
              disabled={signingOut}
            >
              {signingOut ? (
                <ActivityIndicator color={theme.colors.white} />
              ) : (
                <>
                  <Ionicons name="log-out-outline" size={18} color={theme.colors.white} />
                  <Text style={styles.signOutButtonText}>Sign Out</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={patientMenuOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setPatientMenuOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Patient Manager</Text>
              <TouchableOpacity onPress={() => setPatientMenuOpen(false)}>
                <Ionicons name="close" size={20} color={theme.colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSectionTitle}>Current Patients</Text>
            {managedPatients.length === 0 ? (
              <Text style={styles.emptyPatientsText}>No patients added yet.</Text>
            ) : (
              <View style={styles.patientsList}>
                {managedPatients.map((patient) => {
                  const isActive =
                    patient.name === user?.patientName &&
                    patient.status === user?.patientStatus;

                  return (
                    <View key={patient.id} style={styles.patientRow}>
                      <TouchableOpacity
                        style={styles.patientRowInfo}
                        onPress={() => setActivePatient(patient)}
                        disabled={savingPatient}
                      >
                        <Text style={styles.patientRowName}>{patient.name}</Text>
                        <Text style={styles.patientRowStatus}>{patient.status}</Text>
                      </TouchableOpacity>

                      {isActive ? (
                        <View style={styles.activeBadge}>
                          <Text style={styles.activeBadgeText}>Active</Text>
                        </View>
                      ) : null}

                      <TouchableOpacity
                        onPress={() => removePatient(patient.id)}
                        disabled={savingPatient}
                        style={styles.removePatientButton}
                      >
                        <Ionicons name="trash-outline" size={18} color={theme.colors.red} />
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            )}

            <Text style={styles.modalSectionTitle}>Add Patient</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Patient name"
              placeholderTextColor={theme.colors.textSecondary}
              value={newPatientName}
              onChangeText={setNewPatientName}
              editable={!savingPatient}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Status (e.g., Stable, Monitoring)"
              placeholderTextColor={theme.colors.textSecondary}
              value={newPatientStatus}
              onChangeText={setNewPatientStatus}
              editable={!savingPatient}
            />

            <TouchableOpacity
              style={[styles.addPatientButton, savingPatient && { opacity: 0.7 }]}
              onPress={addPatient}
              disabled={savingPatient}
            >
              {savingPatient ? (
                <ActivityIndicator color={theme.colors.white} />
              ) : (
                <Text style={styles.addPatientButtonText}>Add Patient</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
