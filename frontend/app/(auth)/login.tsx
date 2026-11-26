import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";

import CustomButton from "../../src/components/ui/CustomButton";
import CustomInput from "../../src/components/ui/CustomInput";
import { COLORS, RADIUS, SPACING } from "../../src/constants/theme";
import { useAuth } from "../../src/context/AuthContext";
import { loginApi } from "../../src/services/authService";
import CustomAlert from "../../src/components/CustomAlert";

export default function LoginScreen() {
  const { saveSession } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
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
  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
  showAlert(
  "warning",
  "Campos incompletos",
  "Ingresá tu email y contraseña."
);
  return;
}
    setLoading(true);
    try {
      const data = await loginApi({ email: email.trim(), password });
      await saveSession(data);
      router.replace("/(tabs)");
    } catch (err: any) {
      showAlert(
  "error",
  "Error al iniciar sesión",
  err?.message ?? "Verificá tus datos e intentá de nuevo."
);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Pressable
  style={styles.backButton}
  onPress={() => router.back()}
>
  <MaterialCommunityIcons
    name="arrow-left"
    size={24}
    color={COLORS.text}
  />
</Pressable>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.logoBox}>
            <MaterialCommunityIcons name="gavel" size={32} color="#000" />
          </View>
          <Text style={styles.title}>Bienvenido de nuevo</Text>
          <Text style={styles.subtitle}>Inicia sesión para comenzar a pujar</Text>
        </View>

        <View style={styles.form}>
          <CustomInput
            label="Correo electrónico"
            placeholder="tu@correo.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <CustomInput
            label="Contraseña"
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <View style={styles.optionsRow}>
            <Pressable style={styles.rememberRow} onPress={() => setRemember(!remember)}>
              <View style={[styles.checkbox, remember && styles.checkboxActive]}>
                {remember && <Text style={styles.check}>✓</Text>}
              </View>
              <Text style={styles.optionText}>Recordarme</Text>
            </Pressable>
            <Pressable onPress={() => router.push("/(auth)/forgot-password")}>
              <Text style={styles.linkText}>¿Olvidé mi contraseña?</Text>
            </Pressable>
          </View>

          <CustomButton title={loading ? "Ingresando..." : "Iniciar sesión"} onPress={handleLogin} disabled={loading} />
          <CustomButton title="Crear una cuenta" variant="outline" onPress={() => router.push("/(auth)/register")} disabled={loading} />
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { flex: 1, justifyContent: "center", paddingHorizontal: SPACING.xl },
  header: { alignItems: "center", marginBottom: SPACING.xl },
  logoBox: { width: 72, height: 72, borderRadius: RADIUS.lg, backgroundColor: COLORS.gold, justifyContent: "center", alignItems: "center", marginBottom: SPACING.md },
  title: { color: COLORS.text, fontSize: 28, fontWeight: "700", textAlign: "center" },
  subtitle: { color: COLORS.muted, textAlign: "center", marginTop: SPACING.xs, fontSize: 15 },
  form: { gap: SPACING.md },
  optionsRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  rememberRow: { flexDirection: "row", alignItems: "center", gap: SPACING.sm },
  checkbox: { width: 18, height: 18, borderRadius: 5, borderWidth: 1, borderColor: COLORS.border, alignItems: "center", justifyContent: "center" },
  checkboxActive: { backgroundColor: COLORS.gold, borderColor: COLORS.gold },
  check: { color: "#000", fontSize: 12, fontWeight: "900" },
  optionText: { color: COLORS.muted, fontSize: 14 },
  linkText: { color: COLORS.gold, fontSize: 14, fontWeight: "600" },
  backButton: {
  position: "absolute",
  top: SPACING.lg,
  left: SPACING.lg,
  zIndex: 10,
  width: 42,
  height: 42,
  borderRadius: 21,
  backgroundColor: COLORS.surface,
  borderWidth: 1,
  borderColor: COLORS.border,
  justifyContent: "center",
  alignItems: "center",
},
});