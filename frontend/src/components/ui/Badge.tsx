import { StyleSheet, Text, View } from "react-native";
import { COLORS, RADIUS, SPACING } from "../../constants/theme";

type Category = "Common" | "Special" | "Silver" | "Gold" | "Platinum";

type Props = {
  category?: Category;
  live?: boolean;
};

const CATEGORY_LABELS: Record<Category, string> = {
  Common: "Común",
  Special: "Especial",
  Silver: "Plata",
  Gold: "Oro",
  Platinum: "Platino",
};

export default function Badge({ category = "Common", live = false }: Props) {
  if (live) {
    return (
      <View style={[styles.badge, styles.liveBadge]}>
        <View style={styles.liveDot} />
        <Text style={styles.liveText}>LIVE</Text>
      </View>
    );
  }

  return (
    <View style={[styles.badge, styles.categoryBadge]}>
      <Text style={styles.categoryText}>{CATEGORY_LABELS[category]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
  },
  liveBadge: {
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    borderColor: "rgba(239, 68, 68, 0.35)",
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 6,
    backgroundColor: COLORS.danger,
  },
  liveText: {
    color: "#F87171",
    fontSize: 11,
    fontWeight: "700",
  },
  categoryBadge: {
    backgroundColor: "rgba(244, 197, 66, 0.12)",
    borderColor: "rgba(244, 197, 66, 0.35)",
  },
  categoryText: {
    color: COLORS.gold,
    fontSize: 11,
    fontWeight: "700",
  },
});
