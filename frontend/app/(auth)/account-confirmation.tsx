import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import CustomButton from "../../src/components/ui/CustomButton";
import { COLORS, SPACING } from "../../src/constants/theme";

export default function AccountConfirmationScreen() {
  return (
    <View style={styles.container}>
      <MaterialCommunityIcons name="email-check-outline" size={78} color={COLORS.gold} />

      <Text style={styles.title}>¡Solicitud enviada!</Text>

      <Text style={styles.subtitle}>
        Recibimos tus datos. La empresa los revisará y, si todo está en orden,
        te enviaremos un mail con un link para crear tu contraseña y activar tu cuenta.
      </Text>

      <View style={styles.stepsCard}>
        <Step number="1" text="La empresa verifica tu identidad" done />
        <Step number="2" text="Recibís un mail con tu link de activación" />
        <Step number="3" text="Creás tu contraseña y empezás a pujar" />
      </View>

      <View style={styles.buttons}>
        <CustomButton
          title="Volver al inicio"
          variant="outline"
          onPress={() => router.replace("/(auth)/login")}
        />
      </View>
    </View>
  );
}

function Step({ number, text, done }: { number: string; text: string; done?: boolean }) {
  return (
    <View style={styles.step}>
      <View style={[styles.stepBadge, done && styles.stepBadgeDone]}>
        {done
          ? <MaterialCommunityIcons name="check" size={14} color="#000" />
          : <Text style={styles.stepNumber}>{number}</Text>
        }
      </View>
      <Text style={styles.stepText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, justifyContent: "center", alignItems: "center", paddingHorizontal: SPACING.xl },
  title: { color: COLORS.text, fontSize: 26, fontWeight: "700", marginTop: SPACING.md, textAlign: "center" },
  subtitle: { color: COLORS.muted, fontSize: 15, lineHeight: 22, textAlign: "center", marginTop: SPACING.sm },
  stepsCard: { marginTop: SPACING.lg, backgroundColor: "#111", borderWidth: 1, borderColor: "#2A2A2A", borderRadius: 14, padding: SPACING.md, width: "100%", gap: SPACING.md },
  step: { flexDirection: "row", alignItems: "center", gap: SPACING.md },
  stepBadge: { width: 28, height: 28, borderRadius: 14, backgroundColor: "#2A2A2A", alignItems: "center", justifyContent: "center" },
  stepBadgeDone: { backgroundColor: COLORS.gold },
  stepNumber: { color: COLORS.muted, fontSize: 13, fontWeight: "700" },
  stepText: { color: COLORS.text, fontSize: 14, flex: 1 },
  buttons: { width: "100%", marginTop: SPACING.xl },
});