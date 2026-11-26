import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator, SafeAreaView, ScrollView,
    StyleSheet, Text, View,
} from "react-native";
import CustomButton from "../../src/components/ui/CustomButton";
import CustomInput from "../../src/components/ui/CustomInput";
import ScreenHeader from "../../src/components/ui/ScreenHeader";
import { COLORS, RADIUS, SPACING } from "../../src/constants/theme";
import { getProfileApi, updateProfileApi } from "../../src/services/userService";
import CustomAlert from "../../src/components/CustomAlert";

export default function EditProfileScreen() {
  const [domicilioLegal, setDomicilioLegal] = useState("");
  const [paisOrigen, setPaisOrigen] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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

  useEffect(() => {
    (async () => {
      try {
        const data = await getProfileApi();
        setDomicilioLegal(data.domicilioLegal ?? "");
        setPaisOrigen(data.paisOrigen ?? "");
      } catch {
        showAlert(
  "error",
  "Error",
  "No se pudo cargar el perfil."
);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSave = async () => {
    if (!domicilioLegal.trim() || !paisOrigen.trim()) {
      showAlert(
  "warning",
  "Campos incompletos",
  "Todos los campos son obligatorios."
);
      return;
    }
    setSaving(true);
    try {
      await updateProfileApi({ domicilioLegal, paisOrigen });
      showAlert(
  "success",
  "Perfil actualizado",
  "Los cambios se guardaron correctamente."
);

setGoBackAfterAlert(true);
    } catch (err: any) {
      showAlert("error", "Error", err?.message ?? "No se pudo actualizar el perfil");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.gold} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title="Editar perfil" />
      <ScrollView contentContainerStyle={styles.scroll}>

        <View style={styles.notice}>
          <MaterialCommunityIcons name="information-outline" size={16} color={COLORS.muted} />
          <Text style={styles.noticeText}>
            El email y la categoría no pueden modificarse.
          </Text>
        </View>

        <CustomInput
          label="País de origen"
          value={paisOrigen}
          onChangeText={setPaisOrigen}
          placeholder="Ej: Argentina"
          autoCapitalize="words"
        />

        <CustomInput
          label="Domicilio legal"
          value={domicilioLegal}
          onChangeText={setDomicilioLegal}
          placeholder="Ej: Av. Siempre Viva 742"
          autoCapitalize="words"
        />

        <CustomButton
          title={saving ? "Guardando..." : "Guardar cambios"}
          onPress={handleSave}
          disabled={saving}
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
  centered: { flex: 1, backgroundColor: COLORS.background, justifyContent: "center", alignItems: "center" },
  notice: {
    flexDirection: "row", alignItems: "center", gap: SPACING.sm,
    backgroundColor: COLORS.surface, borderRadius: RADIUS.sm,
    padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border,
  },
  noticeText: { color: COLORS.muted, fontSize: 13, flex: 1 },
});
