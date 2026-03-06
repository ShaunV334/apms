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
    gap: theme.spacing.md,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.white,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTitle: {
    fontSize: theme.typography.greeting,
    fontWeight: "700",
    color: theme.colors.textPrimary,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: theme.spacing.xl,
  },
  // Filter Row
  filterRow: {
    flexDirection: "row",
    gap: theme.spacing.sm,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  filterChip: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.white,
    borderWidth: 1.5,
    borderColor: theme.colors.lightGray,
  },
  filterChipActive: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.tabBar,
    borderWidth: 1.5,
    borderColor: theme.colors.tabBar,
  },
  filterChipText: {
    fontSize: theme.typography.label,
    fontWeight: "600",
    color: theme.colors.textSecondary,
  },
  filterChipTextActive: {
    fontSize: theme.typography.label,
    fontWeight: "600",
    color: theme.colors.white,
  },
  // Day Section
  daySectionLabel: {
    fontSize: theme.typography.label,
    fontWeight: "700",
    color: theme.colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  // Vitals Row
  vitalsRow: {
    flexDirection: "row",
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  vitalCard: {
    flex: 1,
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.md,
    padding: theme.spacing.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  vitalCardBorderGreen: {
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.green,
  },
  vitalCardBorderBlue: {
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.blue,
  },
  vitalIconRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: theme.spacing.xs,
  },
  vitalLabel: {
    fontSize: theme.typography.label,
    color: theme.colors.textSecondary,
    fontWeight: "500",
  },
  vitalValueRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
  },
  vitalValue: {
    fontSize: 28,
    fontWeight: "700",
    color: theme.colors.textPrimary,
  },
  vitalUnit: {
    fontSize: theme.typography.unit,
    color: theme.colors.textSecondary,
    fontWeight: "500",
  },
  vitalSubtext: {
    fontSize: theme.typography.small,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  // Range bar
  rangeBarContainer: {
    marginTop: theme.spacing.sm,
    height: 6,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.lightGray,
    overflow: "hidden",
  },
  rangeBarFill: {
    height: "100%",
    borderRadius: theme.radius.full,
  },
  // Medicines Section
  medicinesCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.md,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  medicinesCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  medicinesCardTitle: {
    fontSize: theme.typography.body,
    fontWeight: "700",
    color: theme.colors.textPrimary,
    flex: 1,
  },
  medicinesBadge: {
    backgroundColor: theme.colors.green,
    borderRadius: theme.radius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  medicinesBadgeText: {
    fontSize: theme.typography.small,
    color: theme.colors.white,
    fontWeight: "600",
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.lightGray,
    marginBottom: theme.spacing.md,
  },
  medicineItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.background,
  },
  medicineItemLast: {
    borderBottomWidth: 0,
  },
  medicineStatusDot: {
    width: 10,
    height: 10,
    borderRadius: theme.radius.full,
    marginRight: theme.spacing.md,
  },
  medicineItemContent: {
    flex: 1,
  },
  medicineItemName: {
    fontSize: theme.typography.body,
    fontWeight: "600",
    color: theme.colors.textPrimary,
  },
  medicineItemDose: {
    fontSize: theme.typography.label,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  medicineItemTime: {
    fontSize: theme.typography.label,
    color: theme.colors.textSecondary,
    fontWeight: "500",
  },
  medicineItemStatus: {
    fontSize: theme.typography.small,
    fontWeight: "600",
    marginTop: 2,
    textAlign: "right",
  },
  // Tab Bar
  tabBar: {
    flexDirection: "row",
    backgroundColor: theme.colors.tabBar,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.sm,
    justifyContent: "space-around",
  },
  tabItem: {
    alignItems: "center",
    flex: 1,
    gap: theme.spacing.xs,
  },
  tabLabel: {
    fontSize: 11,
    color: theme.colors.white,
    fontWeight: "500",
  },
  tabLabelInactive: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    fontWeight: "500",
  },
}));
