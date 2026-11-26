import { router } from "expo-router";
import { useState } from "react";
import {
    Alert, SafeAreaView, ScrollView, StyleSheet,
} from "react-native";
import CustomButton from "../../src/components/ui/CustomButton";
import CustomInput from "../../src/components/ui/CustomInput";
import ScreenHeader from "../../src/components/ui/ScreenHeader";
import { COLORS, SPACING } from "../../src/constants/theme";
import { changePasswordApi } from "../../src/services/userService";
import CustomAlert from "../../src/components/CustomAlert";

export default function ChangePasswordScreen() {
  const [passwordActual, setPasswordActual] = useState("");
  const [passwordNueva, setPasswordNueva] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
const [alertTitle, setAlertTitle] = useState("");
const [alertMessage, setAlertMessage] = useState("");
const [alertType, setAlertType] = useState<
  "success" | "error" | "warning"
>("success");

const [goBackAfterAlert, setGoBackAfterAlert] = useState(false);
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

  const handleChange = async () => {
    if (!passwordActual || !passwordNueva || !confirmPassword) {
      showAlert(
  "warning",
  "Campos incompletos",
  "Completá todos los campos."
);
    }
    if (passwordNueva !== confirmPassword) {
      showAlert("error", "Error", "Las contraseñas nuevas no coinciden");
      return;
    }
    if (passwordNueva.length < 8) {
      showAlert("error", "Error", "La nueva contraseña debe tener al menos 8 caracteres");
      return;
    }

    setLoading(true);
    try {
      await changePasswordApi({ passwordActual, passwordNueva, confirmPassword });
      showAlert(
  "success",
  "Contraseña actualizada",
  "La contraseña fue actualizada correctamente."
);

setGoBackAfterAlert(true);
    } catch (err: any) {
      showAlert("error", "Error", err?.message ?? "No se pudo cambiar la contraseña");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title="Cambiar contraseña" />
      <ScrollView contentContainerStyle={styles.scroll}>

        <CustomInput
          label="Contraseña actual"
          value={passwordActual}
          onChangeText={setPasswordActual}
          secureTextEntry
          placeholder="••••••••"
        />
        <CustomInput
          label="Nueva contraseña"
          value={passwordNueva}
          onChangeText={setPasswordNueva}
          secureTextEntry
          placeholder="••••••••"
        />
        <CustomInput
          label="Confirmar nueva contraseña"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          placeholder="••••••••"
        />

        <CustomButton
          title={loading ? "Guardando..." : "Cambiar contraseña"}
          onPress={handleChange}
          disabled={loading}
        />

      </ScrollView>
      <CustomAlert
  visible={alertVisible}
  type={alertType}
  title={alertTitle}
  message={alertMessage}
  onClose={() => {
    setAlertVisible(false);

    if (goBackAfterAlert) {
      setGoBackAfterAlert(false);
      router.back();
    }
  }}
/>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: SPACING.lg, gap: SPACING.md },
});
