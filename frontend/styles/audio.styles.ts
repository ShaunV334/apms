import { StyleSheet } from "react-native-unistyles";
import "../unistyles";

export const styles = StyleSheet.create((theme) => ({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xs,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: theme.typography.greeting,
    fontWeight: "700",
    color: theme.colors.textPrimary,
  },
  connectionBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.white,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  connectionText: {
    fontSize: theme.typography.small,
    fontWeight: "600",
    color: theme.colors.textSecondary,
  },
  // Input section
  inputSection: {
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  inputCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.md,
    padding: theme.spacing.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  inputLabel: {
    fontSize: theme.typography.label,
    fontWeight: "700",
    color: theme.colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: theme.spacing.sm,
  },
  textInput: {
    fontSize: theme.typography.body,
    color: theme.colors.textPrimary,
    minHeight: 80,
    textAlignVertical: "top",
    lineHeight: 22,
  },
  charCount: {
    fontSize: theme.typography.small,
    color: theme.colors.textSecondary,
    textAlign: "right",
    marginTop: theme.spacing.sm,
  },
  // Action row
  actionRow: {
    flexDirection: "row",
    gap: theme.spacing.sm,
  },
  previewButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.sm,
    paddingVertical: 14,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.white,
    borderWidth: 1.5,
    borderColor: theme.colors.lightGray,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  previewButtonText: {
    fontSize: theme.typography.body,
    fontWeight: "600",
    color: theme.colors.textPrimary,
  },
  sendButton: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.sm,
    paddingVertical: 14,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.tabBar,
    shadowColor: theme.colors.tabBar,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
  sendButtonText: {
    fontSize: theme.typography.body,
    fontWeight: "700",
    color: theme.colors.white,
  },
  sendingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  // History
  historySection: {
    paddingHorizontal: theme.spacing.xl,
    flex: 1,
  },
  historySectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.md,
  },
  historySectionTitle: {
    fontSize: theme.typography.label,
    fontWeight: "700",
    color: theme.colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  clearButton: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
  },
  clearButtonText: {
    fontSize: theme.typography.small,
    fontWeight: "600",
    color: theme.colors.red,
  },
  historyList: {
    flex: 1,
  },
  // History item
  historyItem: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.md,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  historyItemRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: theme.spacing.md,
  },
  historyIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.tabBar + "18",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  historyContent: {
    flex: 1,
  },
  historyText: {
    fontSize: theme.typography.body,
    color: theme.colors.textPrimary,
    lineHeight: 22,
    marginBottom: 4,
  },
  historyMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  historyTime: {
    fontSize: theme.typography.small,
    color: theme.colors.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: theme.radius.full,
  },
  statusBadgeSent: {
    backgroundColor: "#E8F5E9",
  },
  statusBadgeFailed: {
    backgroundColor: "#FFEBEE",
  },
  statusBadgeText: {
    fontSize: theme.typography.small,
    fontWeight: "600",
  },
  statusBadgeTextSent: {
    color: "#2E7D32",
  },
  statusBadgeTextFailed: {
    color: "#C62828",
  },
  // Empty state
  emptyHistory: {
    alignItems: "center",
    paddingVertical: 40,
    gap: theme.spacing.md,
  },
  emptyHistoryIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.lightGray,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyHistoryText: {
    fontSize: theme.typography.body,
    color: theme.colors.textSecondary,
    fontWeight: "500",
  },
}));
