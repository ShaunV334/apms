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
    alignItems: "center",
  },
  headerTitle: {
    fontSize: theme.typography.greeting,
    fontWeight: "700",
    color: theme.colors.textPrimary,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.lg,
  },
  // Hero banner
  heroBanner: {
    backgroundColor: theme.colors.tabBar,
    borderRadius: theme.radius.md,
    padding: theme.spacing.xl,
    alignItems: "center",
    marginBottom: theme.spacing.xl,
    gap: theme.spacing.sm,
  },
  heroAvatar: {
    width: 80,
    height: 80,
    borderRadius: theme.radius.full,
    backgroundColor: "#FFFFFF22",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: theme.spacing.sm,
  },
  heroInitials: {
    fontSize: 32,
    fontWeight: "700",
    color: theme.colors.white,
  },
  heroName: {
    fontSize: 22,
    fontWeight: "700",
    color: theme.colors.white,
  },
  heroRole: {
    fontSize: theme.typography.body,
    color: "#9E9EC8",
    fontWeight: "500",
  },
  // Section
  sectionLabel: {
    fontSize: theme.typography.label,
    fontWeight: "700",
    color: theme.colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: theme.spacing.sm,
    marginTop: theme.spacing.xs,
  },
  // Info card
  infoCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.md,
    marginBottom: theme.spacing.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
    overflow: "hidden",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    gap: theme.spacing.lg,
  },
  infoRowDivider: {
    height: 1,
    backgroundColor: theme.colors.background,
    marginHorizontal: theme.spacing.lg,
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.sm,
    justifyContent: "center",
    alignItems: "center",
  },
  infoTextBlock: {
    flex: 1,
    gap: 2,
  },
  infoLabel: {
    fontSize: theme.typography.small,
    color: theme.colors.textSecondary,
    fontWeight: "500",
  },
  infoValue: {
    fontSize: theme.typography.body,
    fontWeight: "600",
    color: theme.colors.textPrimary,
  },
  // Status badge
  statusBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 3,
    borderRadius: theme.radius.full,
    alignSelf: "flex-start",
  },
  statusBadgeText: {
    fontSize: theme.typography.small,
    fontWeight: "700",
    color: theme.colors.white,
  },
  // Patient card with accent
  patientCardAccent: {
    height: 4,
  },
  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: theme.spacing.md,
  },
  loadingText: {
    fontSize: theme.typography.body,
    color: theme.colors.textSecondary,
  },
}));
