import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import CustomButton from "../../src/components/ui/CustomButton";
import CustomInput from "../../src/components/ui/CustomInput";
import { COLORS, SPACING } from "../../src/constants/theme";
import { resetPasswordApi } from "../../src/services/authService";
import CustomAlert from "../../src/components/CustomAlert";

type ScreenState = "validating" | "form" | "success" | "invalid";

export default function ResetPasswordScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();

  const [screenState, setScreenState] = useState<ScreenState>("validating");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
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

  // Validar token al entrar
  useEffect(() => {
    if (!token) {
      setScreenState("invalid");
      setErrorMsg("El link no contiene un token válido.");
      return;
    }

    // Validamos el token contra el back antes de mostrar el form
    fetch(`${require("../../src/services/api").API_BASE_URL}/auth/reset-password/validate?token=${token}`)
      .then((res) => {
        if (res.ok) {
          setScreenState("form");
        } else {
          return res.json().then((data) => {
            setErrorMsg(data?.error ?? "El link no es válido o ya expiró.");
            setScreenState("invalid");
          });
        }
      })
      .catch(() => {
        // Si no hay red, igual mostramos el form y el back lo validará al enviar
        setScreenState("form");
      });
  }, [token]);

  const handleReset = async () => {
    if (!password || password.length < 6) {
      showAlert(
  "warning",
  "Contraseña inválida",
  "La contraseña debe tener al menos 6 caracteres."
);
      return;
    }
    if (password !== confirm) {
      showAlert(
  "warning",
  "Contraseñas no coinciden",
  "Verificá que ambas contraseñas sean iguales."
);
      return;
    }

    setLoading(true);
    try {
      await resetPasswordApi(token!, password);
      setScreenState("success");
    } catch (err: any) {
      showAlert(
  "error",
  "Error",
  err?.message ?? "No se pudo restablecer la contraseña."
);
    } finally {
      setLoading(false);
    }
  };

  // ─── Estados de la pantalla ───────────────────────────────────────────────

  if (screenState === "validating") {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.gold} />
        <Text style={styles.mutedText}>Verificando link...</Text>
      </View>
    );
  }

  if (screenState === "invalid") {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <View style={[styles.iconWrap, { backgroundColor: "rgba(239,68,68,0.1)" }]}>
            <MaterialCommunityIcons name="link-variant-off" size={48} color={COLORS.danger} />
          </View>
          <Text style={styles.title}>Link inválido</Text>
          <Text style={styles.subtitle}>{errorMsg || "Este link no es válido o ya fue utilizado."}</Text>
          <View style={styles.buttons}>
            <CustomButton
              title="Solicitar nuevo link"
              onPress={() => router.replace("/(auth)/forgot-password")}
            />
            <CustomButton
              title="Ir al inicio de sesión"
              variant="outline"
              onPress={() => router.replace("/(auth)/login")}
            />
          </View>
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

  if (screenState === "success") {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <View style={[styles.iconWrap, { backgroundColor: "rgba(34,197,94,0.1)" }]}>
            <MaterialCommunityIcons name="check-circle-outline" size={56} color={COLORS.success} />
          </View>
          <Text style={styles.title}>¡Contraseña actualizada!</Text>
          <Text style={styles.subtitle}>
            Tu contraseña fue restablecida correctamente.{"\n"}
            Ya podés iniciar sesión con tu nueva contraseña.
          </Text>
          <View style={styles.buttons}>
            <CustomButton
              title="Iniciar sesión"
              onPress={() => router.replace("/(auth)/login")}
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Formulario ───────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.centered}>
        <View style={styles.iconWrap}>
          <MaterialCommunityIcons name="lock-outline" size={48} color={COLORS.gold} />
        </View>

        <Text style={styles.title}>Nueva contraseña</Text>
        <Text style={styles.subtitle}>
          Elegí una contraseña segura de al menos 6 caracteres.
        </Text>

        <View style={styles.form}>
          <CustomInput
            label="Nueva contraseña"
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <CustomInput
            label="Confirmar contraseña"
            placeholder="••••••••"
            value={confirm}
            onChangeText={setConfirm}
            secureTextEntry
          />
          <CustomButton
            title={loading ? "Guardando..." : "Guardar contraseña"}
            onPress={handleReset}
            disabled={loading}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  centered: {
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
    lineHeight: 22,
    textAlign: "center",
  },

  mutedText: { color: COLORS.muted, fontSize: 15 },

  form: { width: "100%", gap: SPACING.md, marginTop: SPACING.sm },

  buttons: { width: "100%", gap: SPACING.sm, marginTop: SPACING.sm },
});
