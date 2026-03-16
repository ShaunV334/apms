import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import {
  doc,
  getFirestore,
  serverTimestamp,
  setDoc,
} from "@react-native-firebase/firestore";
import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from "expo-av";
import * as FileSystem from "expo-file-system/legacy";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useUnistyles } from "react-native-unistyles";
import { styles } from "../styles/audio.styles";

const USER_DOC = "default";
// Cap at 30 s so the base64-encoded clip stays well under Firestore's 1 MB doc limit
const MAX_RECORDING_MS = 30_000;

const RECORDING_OPTIONS: Audio.RecordingOptions = {
  android: {
    extension: ".m4a",
    outputFormat: Audio.AndroidOutputFormat.MPEG_4,
    audioEncoder: Audio.AndroidAudioEncoder.AAC,
    sampleRate: 16_000,
    numberOfChannels: 1,
    bitRate: 64_000,
  },
  ios: {
    extension: ".m4a",
    outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
    audioQuality: Audio.IOSAudioQuality.MEDIUM,
    sampleRate: 16_000,
    numberOfChannels: 1,
    bitRate: 64_000,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
  web: {
    mimeType: "audio/webm",
    bitsPerSecond: 64_000,
  },
};

type MessageStatus = "sent" | "failed";

type HistoryItem = {
  id: string;
  durationMs: number;
  timestamp: Date;
  status: MessageStatus;
};

function formatTime(date: Date) {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDuration(ms: number | null) {
  if (!ms || ms < 0) return "0:00";
  const totalSeconds = Math.floor(ms / 1000);
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export default function AudioScreen() {
  const { theme } = useUnistyles();
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [recordedUri, setRecordedUri] = useState<string | null>(null);
  const [recordedDurationMs, setRecordedDurationMs] = useState<number | null>(null);
  const [liveDurationMs, setLiveDurationMs] = useState(0);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [watchStatus, setWatchStatus] = useState<"idle" | "queued" | "failed">(
    "idle"
  );

  const recordingRef = useRef<Audio.Recording | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const stopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(() => undefined);
        soundRef.current = null;
      }
    };
  }, []);

  const startRecording = useCallback(async () => {
    if (isRecording || isUploading) return;
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        console.warn("Audio permission denied by user");
        setWatchStatus("failed");
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        interruptionModeIOS: InterruptionModeIOS.DoNotMix,
        interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
        shouldDuckAndroid: true,
        staysActiveInBackground: false,
        playThroughEarpieceAndroid: false,
      });

      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(RECORDING_OPTIONS);
      await recording.startAsync();

      recording.setOnRecordingStatusUpdate((status) => {
        if (status.isRecording) setLiveDurationMs(status.durationMillis ?? 0);
      });
      recording.setProgressUpdateInterval(250);

      recordingRef.current = recording;
      setIsRecording(true);
      setWatchStatus("idle");

      if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
      stopTimerRef.current = setTimeout(() => {
        stopRecording().catch(() => undefined);
      }, MAX_RECORDING_MS);
    } catch (error) {
      console.error("startRecording error:", error);
      setWatchStatus("failed");
    }
  }, [isRecording, isUploading]);

  const stopRecording = useCallback(async () => {
    const recording = recordingRef.current;
    if (!recording) return;

    try {
      await recording.stopAndUnloadAsync();
      const status = await recording.getStatusAsync();
      const uri = recording.getURI();

      setRecordedUri(uri ?? null);
      setRecordedDurationMs(status.durationMillis ?? liveDurationMs);
      setIsRecording(false);
      recordingRef.current = null;
      setLiveDurationMs(0);
    } catch (error) {
      console.error("stopRecording error:", error);
    } finally {
      if (stopTimerRef.current) {
        clearTimeout(stopTimerRef.current);
        stopTimerRef.current = null;
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });
    }
  }, [liveDurationMs]);

  const playPreview = useCallback(async () => {
    if (!recordedUri) return;
    try {
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
      const { sound } = await Audio.Sound.createAsync(
        { uri: recordedUri },
        { shouldPlay: true }
      );
      soundRef.current = sound;
      setIsPlayingPreview(true);

      sound.setOnPlaybackStatusUpdate((status) => {
        if (!status.isLoaded) return;
        if (status.didJustFinish) {
          setIsPlayingPreview(false);
          sound.unloadAsync().catch(() => undefined);
          if (soundRef.current === sound) soundRef.current = null;
        }
      });
    } catch (error) {
      console.error("playPreview error:", error);
    }
  }, [recordedUri]);

  const clearRecording = useCallback(() => {
    setRecordedUri(null);
    setRecordedDurationMs(null);
    setLiveDurationMs(0);
    if (soundRef.current) {
      soundRef.current.unloadAsync().catch(() => undefined);
      soundRef.current = null;
    }
    setIsPlayingPreview(false);
  }, []);

  const uploadVoiceMessage = useCallback(async () => {
    if (!recordedUri || isUploading) return;

    setIsUploading(true);
    setWatchStatus("idle");
    let status: MessageStatus = "failed";

    try {
      const messageId = `msg_${Date.now()}`;

      console.log("Voice upload started", { messageId });

      const audioBase64 = await FileSystem.readAsStringAsync(recordedUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const approxKB = Math.round((audioBase64.length * 3) / 4 / 1024);
      console.log("Audio encoded for upload", {
        messageId,
        approxKB,
        mimeType: "audio/mp4",
      });

      await setDoc(
        doc(getFirestore(), "voiceMessages", USER_DOC),
        {
          messageId,
          patientId: USER_DOC,
          audioBase64,
          audioMimeType: "audio/mp4",
          audioEncoding: "aac",
          sampleRate: 16_000,
          channels: 1,
          bitDepth: 16,
          durationMs: recordedDurationMs ?? 0,
          createdAt: serverTimestamp(),
          status: "pending",
        },
        { merge: true }
      );

      console.log("Voice command document updated", { messageId, patientId: USER_DOC });

      status = "sent";
      setWatchStatus("queued");
      clearRecording();
    } catch (error) {
      console.error("uploadVoiceMessage failed:", error);
      setWatchStatus("failed");
    }

    const item: HistoryItem = {
      id: Date.now().toString(),
      durationMs: recordedDurationMs ?? 0,
      timestamp: new Date(),
      status,
    };

    setHistory((prev) => [item, ...prev]);
    setIsUploading(false);
  }, [clearRecording, isUploading, recordedDurationMs, recordedUri]);

  const clearHistory = useCallback(() => setHistory([]), []);

  const watchLabel =
    watchStatus === "queued"
      ? "Queued for watch"
      : watchStatus === "failed"
      ? "Delivery failed"
      : "Ready";
  const watchColor =
    watchStatus === "queued"
      ? theme.colors.green
      : watchStatus === "failed"
      ? theme.colors.red
      : theme.colors.textSecondary;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Voice Message</Text>
        <View style={styles.connectionBadge}>
          <View style={[styles.connectionDot, { backgroundColor: watchColor }]} />
          <Text style={styles.connectionText}>{watchLabel}</Text>
        </View>
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        <View style={styles.inputSection}>
          <View style={styles.inputCard}>
            <Text style={styles.inputLabel}>Caretaker voice clip</Text>
            <View style={styles.recorderSummaryRow}>
              <Text style={styles.recorderSummaryLabel}>Duration</Text>
              <Text style={styles.recorderSummaryValue}>
                {isRecording
                  ? formatDuration(liveDurationMs)
                  : formatDuration(recordedDurationMs)}
              </Text>
            </View>
            <Text style={styles.inputHint}>
              Record up to 30 seconds and send the clip to the watch.
            </Text>
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.previewButton}
              onPress={isRecording ? stopRecording : startRecording}
              disabled={isUploading}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isRecording ? "stop-circle-outline" : "mic-outline"}
                size={20}
                color={theme.colors.textPrimary}
              />
              <Text style={styles.previewButtonText}>
                {isRecording ? "Stop" : "Record"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.sendButton,
                (!recordedUri || isUploading) && styles.sendButtonDisabled,
              ]}
              onPress={uploadVoiceMessage}
              disabled={!recordedUri || isUploading}
              activeOpacity={0.8}
            >
              {isUploading ? (
                <View style={styles.sendingIndicator}>
                  <ActivityIndicator size="small" color={theme.colors.white} />
                  <Text style={styles.sendButtonText}>Uploading…</Text>
                </View>
              ) : (
                <>
                  <MaterialCommunityIcons name="watch-variant" size={20} color={theme.colors.white} />
                  <Text style={styles.sendButtonText}>Send to Watch</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.secondaryActionRow}>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={playPreview}
              disabled={!recordedUri || isRecording || isPlayingPreview || isUploading}
            >
              <Ionicons name="play-outline" size={18} color={theme.colors.textPrimary} />
              <Text style={styles.secondaryButtonText}>Preview clip</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={clearRecording}
              disabled={!recordedUri || isUploading}
            >
              <Ionicons name="trash-outline" size={18} color={theme.colors.red} />
              <Text style={[styles.secondaryButtonText, { color: theme.colors.red }]}>Discard</Text>
            </TouchableOpacity>
          </View>
        </View>

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
              <Text style={styles.emptyHistoryText}>No voice clips sent yet</Text>
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
                    <Text style={styles.historyText}>Voice clip ({formatDuration(item.durationMs)})</Text>
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
