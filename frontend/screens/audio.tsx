import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Speech from "expo-speech";
import { useCallback, useRef, useState } from "react";
import {
    ActivityIndicator,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useUnistyles } from "react-native-unistyles";
import { styles } from "../styles/audio.styles";

// Configure your ESP32's address here
const ESP32_BASE_URL = "http://192.168.1.100";
const ESP32_TTS_ENDPOINT = `${ESP32_BASE_URL}/speak`;

type MessageStatus = "sent" | "failed";

type HistoryItem = {
  id: string;
  text: string;
  timestamp: Date;
  status: MessageStatus;
};

function formatTime(date: Date) {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function AudioScreen() {
  const { theme } = useUnistyles();
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [esp32Connected, setEsp32Connected] = useState<boolean | null>(null);
  const inputRef = useRef<TextInput>(null);

  const MAX_CHARS = 300;

  // --- Local TTS preview ---
  const handlePreview = useCallback(async () => {
    if (!inputText.trim()) return;
    const speaking = await Speech.isSpeakingAsync();
    if (speaking) {
      Speech.stop();
      setIsSpeaking(false);
      return;
    }
    setIsSpeaking(true);
    Speech.speak(inputText.trim(), {
      language: "en-US",
      pitch: 1.0,
      rate: 0.9,
      onDone: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
      onStopped: () => setIsSpeaking(false),
    });
  }, [inputText]);

  // --- Send text to ESP32 ---
  const handleSend = useCallback(async () => {
    const text = inputText.trim();
    if (!text || isSending) return;

    setIsSending(true);
    let status: MessageStatus = "failed";

    try {
      const response = await fetch(ESP32_TTS_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
        signal: AbortSignal.timeout(8000),
      });
      if (response.ok) {
        status = "sent";
        setEsp32Connected(true);
      } else {
        setEsp32Connected(false);
      }
    } catch {
      setEsp32Connected(false);
    }

    const item: HistoryItem = {
      id: Date.now().toString(),
      text,
      timestamp: new Date(),
      status,
    };

    setHistory((prev) => [item, ...prev]);
    if (status === "sent") setInputText("");
    setIsSending(false);
  }, [inputText, isSending]);

  const clearHistory = useCallback(() => setHistory([]), []);

  const connectionLabel =
    esp32Connected === null ? "Not checked" : esp32Connected ? "ESP32 Online" : "ESP32 Offline";
  const connectionColor =
    esp32Connected === null ? theme.colors.textSecondary : esp32Connected ? theme.colors.green : theme.colors.red;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Audio</Text>
        <View style={styles.connectionBadge}>
          <View style={[styles.connectionDot, { backgroundColor: connectionColor }]} />
          <Text style={styles.connectionText}>{connectionLabel}</Text>
        </View>
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Input Card */}
        <View style={styles.inputSection}>
          <View style={styles.inputCard}>
            <Text style={styles.inputLabel}>Message to patient</Text>
            <TextInput
              ref={inputRef}
              style={styles.textInput}
              placeholder="Type a question or message..."
              placeholderTextColor={theme.colors.textSecondary}
              value={inputText}
              onChangeText={(t) => setInputText(t.slice(0, MAX_CHARS))}
              multiline
              returnKeyType="default"
              blurOnSubmit={false}
            />
            <Text style={styles.charCount}>
              {inputText.length}/{MAX_CHARS}
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionRow}>
            {/* Preview (local TTS) */}
            <TouchableOpacity
              style={styles.previewButton}
              onPress={handlePreview}
              disabled={!inputText.trim()}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isSpeaking ? "stop-circle-outline" : "volume-high-outline"}
                size={20}
                color={inputText.trim() ? theme.colors.textPrimary : theme.colors.textSecondary}
              />
              <Text style={styles.previewButtonText}>
                {isSpeaking ? "Stop" : "Preview"}
              </Text>
            </TouchableOpacity>

            {/* Send to ESP32 */}
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!inputText.trim() || isSending) && styles.sendButtonDisabled,
              ]}
              onPress={handleSend}
              disabled={!inputText.trim() || isSending}
              activeOpacity={0.8}
            >
              {isSending ? (
                <View style={styles.sendingIndicator}>
                  <ActivityIndicator size="small" color={theme.colors.white} />
                  <Text style={styles.sendButtonText}>Sending…</Text>
                </View>
              ) : (
                <>
                  <MaterialCommunityIcons name="broadcast" size={20} color={theme.colors.white} />
                  <Text style={styles.sendButtonText}>Send to Device</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* History */}
        <View style={[styles.historySection, { marginTop: 24 }]}>
          <View style={styles.historySectionHeader}>
            <Text style={styles.historySectionTitle}>Sent Messages</Text>
            {history.length > 0 && (
              <TouchableOpacity style={styles.clearButton} onPress={clearHistory}>
                <Text style={styles.clearButtonText}>Clear all</Text>
              </TouchableOpacity>
            )}
          </View>

          {history.length === 0 ? (
            <View style={styles.emptyHistory}>
              <View style={styles.emptyHistoryIcon}>
                <Ionicons name="chatbubble-outline" size={28} color={theme.colors.textSecondary} />
              </View>
              <Text style={styles.emptyHistoryText}>No messages sent yet</Text>
            </View>
          ) : (
            history.map((item) => (
              <View key={item.id} style={styles.historyItem}>
                <View style={styles.historyItemRow}>
                  <View style={styles.historyIconWrap}>
                    <MaterialCommunityIcons
                      name="waveform"
                      size={18}
                      color={theme.colors.tabBar}
                    />
                  </View>
                  <View style={styles.historyContent}>
                    <Text style={styles.historyText}>{item.text}</Text>
                    <View style={styles.historyMeta}>
                      <Text style={styles.historyTime}>{formatTime(item.timestamp)}</Text>
                      <View
                        style={[
                          styles.statusBadge,
                          item.status === "sent"
                            ? styles.statusBadgeSent
                            : styles.statusBadgeFailed,
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusBadgeText,
                            item.status === "sent"
                              ? styles.statusBadgeTextSent
                              : styles.statusBadgeTextFailed,
                          ]}
                        >
                          {item.status === "sent" ? "Delivered" : "Failed"}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
