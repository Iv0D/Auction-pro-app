import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Alert, Platform, StyleSheet, Text, View } from "react-native";

import CustomButton from "../../src/components/ui/CustomButton";
import CustomInput from "../../src/components/ui/CustomInput";
import { COLORS, SPACING } from "../../src/constants/theme";
import { useAuth } from "../../src/context/AuthContext";
import { setPasswordApi } from "../../src/services/authService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import CustomAlert from "../../src/components/CustomAlert";

export default function SetPasswordScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const { saveSession } = useAuth();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
const [alertTitle, setAlertTitle] = useState("");
const [alertMessage, setAlertMessage] = useState("");
const [alertType, setAlertType] = useState<
  "success" | "error" | "warning"
>("success");

const [redirectAfterAlert, setRedirectAfterAlert] = useState(false);

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

  const handleSetPassword = async () => {
    if (!token) {
     if (!token) {
  showAlert(
    "error",
    "Link inválido",
    "El link de activación no es válido."
  );
  return;
}
    }
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
      await AsyncStorage.clear();
      const data = await setPasswordApi({ token, password });
      await saveSession(data);
      showAlert(
  "success",
  "Cuenta activada",
  "Tu cuenta fue activada correctamente."
);

setRedirectAfterAlert(true);
      router.replace("/(tabs)");
    } catch (err: any) {
      showAlert(
  "error",
  "Error",
  err?.message ?? "No se pudo activar la cuenta."
);
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <View style={styles.container}>
        <MaterialCommunityIcons name="link-off" size={64} color={COLORS.muted} />
        <Text style={styles.errorTitle}>Link inválido</Text>
        <Text style={styles.errorText}>Este link de activación no es válido o ya fue usado.</Text>
        <CustomButton title="Ir al login" variant="outline" onPress={() => router.replace("/(auth)/login")} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MaterialCommunityIcons name="lock-plus-outline" size={64} color={COLORS.gold} />
      <Text style={styles.title}>Crear contraseña</Text>
      <Text style={styles.subtitle}>Tu cuenta fue aprobada. Elegí una contraseña para activarla.</Text>

      <View style={styles.form}>
        <CustomInput label="Contraseña" placeholder="••••••••" value={password} onChangeText={setPassword} secureTextEntry />
        <CustomInput label="Confirmar contraseña" placeholder="••••••••" value={confirm} onChangeText={setConfirm} secureTextEntry />
        <CustomButton title={loading ? "Activando cuenta..." : "Activar cuenta"} onPress={handleSetPassword} disabled={loading} />
      </View>
      <CustomAlert
  visible={alertVisible}
  type={alertType}
  title={alertTitle}
  message={alertMessage}
  onClose={() => {
    setAlertVisible(false);

    if (redirectAfterAlert) {
      setRedirectAfterAlert(false);
      router.replace("/(tabs)");
    }
  }}
/>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, justifyContent: "center", alignItems: "center", paddingHorizontal: SPACING.xl, gap: SPACING.md },
  title: { color: COLORS.text, fontSize: 26, fontWeight: "700", textAlign: "center" },
  subtitle: { color: COLORS.muted, fontSize: 15, lineHeight: 22, textAlign: "center" },
  form: { width: "100%", gap: SPACING.md, marginTop: SPACING.sm },
  errorTitle: { color: COLORS.text, fontSize: 22, fontWeight: "700" },
  errorText: { color: COLORS.muted, textAlign: "center", fontSize: 15 },
});