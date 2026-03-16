import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../hooks/useAuth";
import { styles } from "../styles/auth.styles";

type AuthMode = "sign-in" | "sign-up";

function humanizeAuthError(error: unknown): string {
  const code = typeof error === "object" && error !== null && "code" in error
    ? String(error.code)
    : "";

  switch (code) {
    case "auth/invalid-email":
      return "Enter a valid email address.";
    case "auth/invalid-credential":
    case "auth/user-not-found":
    case "auth/wrong-password":
      return "The email or password is incorrect.";
    case "auth/email-already-in-use":
      return "That email address already has an account.";
    case "auth/weak-password":
      return "Use a stronger password with at least 6 characters.";
    case "auth/too-many-requests":
      return "Too many attempts. Wait a moment and try again.";
    default:
      return "Authentication failed. Check your connection and try again.";
  }
}

export default function AuthScreen() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<AuthMode>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    const trimmedEmail = email.trim();

    if (!trimmedEmail || !password) {
      setError("Enter your email and password.");
      return;
    }

    if (mode === "sign-up" && password.length < 6) {
      setError("Use a password with at least 6 characters.");
      return;
    }

    if (mode === "sign-up" && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      if (mode === "sign-in") {
        await signIn(trimmedEmail, password);
      } else {
        await signUp(trimmedEmail, password);
      }
    } catch (submitError) {
      setError(humanizeAuthError(submitError));
    } finally {
      setSubmitting(false);
    }
  }

  function setAuthMode(nextMode: AuthMode) {
    setMode(nextMode);
    setError(null);
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={styles.background}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          <View style={styles.hero}>
            <View style={styles.topPanel}>
              <Text style={styles.eyebrow}>Care Dashboard</Text>
              <Text style={styles.title}>Secure access for patient monitoring</Text>
              <Text style={styles.subtitle}>
                Sign in to open the live dashboard, medicine schedule, alerts, and patient profile.
              </Text>
            </View>

            <View style={styles.card}>
              <View style={styles.modeRow}>
                <TouchableOpacity
                  style={[styles.modeButton, mode === "sign-in" && styles.modeButtonActive]}
                  onPress={() => setAuthMode("sign-in")}
                  disabled={submitting}
                >
                  <Text style={[styles.modeText, mode === "sign-in" && styles.modeTextActive]}>
                    Sign In
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modeButton, mode === "sign-up" && styles.modeButtonActive]}
                  onPress={() => setAuthMode("sign-up")}
                  disabled={submitting}
                >
                  <Text style={[styles.modeText, mode === "sign-up" && styles.modeTextActive]}>
                    Create Account
                  </Text>
                </TouchableOpacity>
              </View>

              {error ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                placeholder="carer@example.com"
                placeholderTextColor="#98A2B3"
                editable={!submitting}
              />

              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholder="Enter password"
                placeholderTextColor="#98A2B3"
                editable={!submitting}
              />

              {mode === "sign-up" ? (
                <>
                  <Text style={styles.label}>Confirm Password</Text>
                  <TextInput
                    style={styles.input}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                    placeholder="Re-enter password"
                    placeholderTextColor="#98A2B3"
                    editable={!submitting}
                  />
                </>
              ) : null}

              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  submitting && styles.primaryButtonDisabled,
                ]}
                onPress={handleSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.primaryButtonText}>
                    {mode === "sign-in" ? "Open Dashboard" : "Create Account"}
                  </Text>
                )}
              </TouchableOpacity>

              <Text style={styles.helperText}>
                {mode === "sign-in"
                  ? "Use your Firebase Auth email and password."
                  : "A new profile document is created automatically for first-time accounts."}
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}