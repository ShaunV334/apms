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
  accountActionRow: {
    padding: theme.spacing.lg,
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
  signOutButton: {
    backgroundColor: theme.colors.red,
    borderRadius: theme.radius.md,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: theme.spacing.sm,
  },
  signOutButtonText: {
    color: theme.colors.white,
    fontSize: theme.typography.body,
    fontWeight: "700",
  },
  patientMenuButton: {
    backgroundColor: theme.colors.tabBar,
    borderRadius: theme.radius.md,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  patientMenuButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  patientMenuButtonText: {
    color: theme.colors.white,
    fontSize: theme.typography.body,
    fontWeight: "700",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "#00000055",
    justifyContent: "center",
    paddingHorizontal: theme.spacing.lg,
  },
  modalCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.md,
    padding: theme.spacing.lg,
    maxHeight: "88%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.md,
  },
  modalTitle: {
    fontSize: theme.typography.greeting,
    fontWeight: "700",
    color: theme.colors.textPrimary,
  },
  modalSectionTitle: {
    fontSize: theme.typography.label,
    fontWeight: "700",
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  emptyPatientsText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.body,
    marginBottom: theme.spacing.sm,
  },
  patientsList: {
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  patientRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.lightGray,
    borderRadius: theme.radius.md,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  patientRowInfo: {
    flex: 1,
  },
  patientRowName: {
    fontSize: theme.typography.body,
    fontWeight: "600",
    color: theme.colors.textPrimary,
  },
  patientRowStatus: {
    fontSize: theme.typography.small,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  activeBadge: {
    backgroundColor: theme.colors.green,
    borderRadius: theme.radius.full,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
  },
  activeBadgeText: {
    color: theme.colors.white,
    fontSize: theme.typography.small,
    fontWeight: "700",
  },
  removePatientButton: {
    padding: 6,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: theme.colors.lightGray,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    fontSize: theme.typography.body,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  addPatientButton: {
    backgroundColor: theme.colors.blue,
    borderRadius: theme.radius.md,
    minHeight: 46,
    alignItems: "center",
    justifyContent: "center",
    marginTop: theme.spacing.xs,
  },
  addPatientButtonText: {
    color: theme.colors.white,
    fontSize: theme.typography.body,
    fontWeight: "700",
  },
}));
