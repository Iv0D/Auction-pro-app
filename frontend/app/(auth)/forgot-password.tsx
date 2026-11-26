import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import CustomButton from "../../src/components/ui/CustomButton";
import CustomInput from "../../src/components/ui/CustomInput";
import ScreenHeader from "../../src/components/ui/ScreenHeader";
import { COLORS, SPACING } from "../../src/constants/theme";
import { forgotPasswordApi } from "../../src/services/authService";
import CustomAlert from "../../src/components/CustomAlert";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
const [alertTitle, setAlertTitle] = useState("");
const [alertMessage, setAlertMessage] = useState("");
const [alertType, setAlertType] = useState<
  "success" | "error" | "warning"
>("success");
const showAlert = (
  type: "success" | "error" | "warning",
  title: string,
  message: string
) => {
  setAlertType(type);
  setAlertTitle(title);
  setAlertMessage(message);
  setAlertVisible(true);
};

  const handleSend = async () => {
    if (!email.trim()) {
      showAlert("warning", "Campo requerido", "Ingresá tu correo electrónico.");
      return;
    }

    setLoading(true);
    try {
      await forgotPasswordApi(email.trim());
      setSent(true);
    } catch {
      // El back siempre devuelve 200 aunque el email no exista
      // Si hay un error real de red, lo mostramos
      showAlert("error", "Error de conexión", "No se pudo conectar con el servidor. Intentá de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  // ─── Pantalla de confirmación ─────────────────────────────────────────────

  if (sent) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <View style={styles.iconWrap}>
            <MaterialCommunityIcons name="email-check-outline" size={56} color={COLORS.gold} />
          </View>

          <Text style={styles.title}>Revisá tu correo</Text>

          <Text style={styles.subtitle}>
            Si <Text style={styles.emailHighlight}>{email}</Text> está registrado,
            vas a recibir un link para restablecer tu contraseña.{"\n\n"}
            El link expira en 1 hora.
          </Text>

          <View style={styles.infoCard}>
            <MaterialCommunityIcons name="information-outline" size={16} color={COLORS.muted} />
            <Text style={styles.infoText}>
              Si no ves el correo, revisá la carpeta de spam.
            </Text>
          </View>

          <View style={styles.buttons}>
            <CustomButton
              title="Volver al inicio de sesión"
              onPress={() => router.replace("/(auth)/login")}
            />
            <Pressable onPress={() => setSent(false)} style={styles.retryLink}>
              <Text style={styles.retryText}>Reintentar con otro correo</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Pantalla de ingreso de email ─────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title="Recuperar contraseña" />

      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <MaterialCommunityIcons name="lock-reset" size={48} color={COLORS.gold} />
        </View>

        <Text style={styles.description}>
          Ingresá el correo con el que te registraste y te enviaremos un link
          para crear una nueva contraseña.
        </Text>

        <CustomInput
          label="Correo electrónico"
          placeholder="tu@correo.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <CustomButton
          title={loading ? "Enviando..." : "Enviar link de recuperación"}
          disabled={!email.trim() || loading}
          onPress={handleSend}
        />

        <Pressable onPress={() => router.back()} style={styles.backLink}>
          <MaterialCommunityIcons name="arrow-left" size={16} color={COLORS.muted} />
          <Text style={styles.backLinkText}>Volver al inicio de sesión</Text>
        </Pressable>
      </View>
      <CustomAlert
  visible={alertVisible}
  type={alertType}
  title={alertTitle}
  message={alertMessage}
  onClose={() => setAlertVisible(false)}
/>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  content: {
    flex: 1,
    padding: SPACING.lg,
    gap: SPACING.md,
  },

  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: SPACING.xl,
    gap: SPACING.md,
  },

  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: COLORS.gold + "15",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SPACING.sm,
  },

  title: {
    color: COLORS.text,
    fontSize: 26,
    fontWeight: "800",
    textAlign: "center",
  },

  subtitle: {
    color: COLORS.muted,
    fontSize: 15,
    lineHeight: 23,
    textAlign: "center",
  },

  emailHighlight: {
    color: COLORS.text,
    fontWeight: "600",
  },

  description: {
    color: COLORS.muted,
    fontSize: 15,
    lineHeight: 22,
  },

  infoCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    width: "100%",
  },
  infoText: {
    color: COLORS.muted,
    fontSize: 13,
    flex: 1,
  },

  buttons: {
    width: "100%",
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },

  retryLink: {
    alignItems: "center",
    paddingVertical: SPACING.sm,
  },
  retryText: {
    color: COLORS.muted,
    fontSize: 14,
  },

  backLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "center",
    marginTop: SPACING.sm,
  },
  backLinkText: {
    color: COLORS.muted,
    fontSize: 14,
  },
});
