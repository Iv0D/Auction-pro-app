import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { COLORS, RADIUS, SPACING } from "../../constants/theme";

type Props = {
  title: string;
  onBack?: () => void;
  right?: React.ReactNode;
};

export default function ScreenHeader({ title, onBack, right }: Props) {
  const handleBack = () => {
  if (onBack) {
    onBack();
    return;
  }

  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace("/");
  }
};

  return (
    <View style={styles.container}>
      <View style={styles.left}>
        <Pressable style={styles.backButton} onPress={handleBack}>
          <MaterialCommunityIcons
            name="chevron-left"
            size={24}
            color={COLORS.text}
          />
        </Pressable>

        <Text style={styles.title}>{title}</Text>
      </View>

      <View>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.md,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: "700",
  },
});
