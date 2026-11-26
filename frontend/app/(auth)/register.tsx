import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";

import CustomButton from "../../src/components/ui/CustomButton";
import CustomCard from "../../src/components/ui/CustomCard";
import CustomInput from "../../src/components/ui/CustomInput";
import ScreenHeader from "../../src/components/ui/ScreenHeader";
import { COLORS, RADIUS, SPACING } from "../../src/constants/theme";
import { registerApi } from "../../src/services/authService";
import CustomAlert from "../../src/components/CustomAlert";

type DniPhoto = { uri: string; base64: string };

export default function RegisterScreen() {
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [document, setDocument] = useState("");
  const [address, setAddress] = useState("");
  const [email, setEmail] = useState("");
  const [dniFrente, setDniFrente] = useState<DniPhoto | null>(null);
  const [dniDorso, setDniDorso] = useState<DniPhoto | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
const [alertTitle, setAlertTitle] = useState("");
const [alertMessage, setAlertMessage] = useState("");
const [alertType, setAlertType] = useState<
  "success" | "error" | "warning"
>("success");
const [redirectAfterAlert, setRedirectAfterAlert] = useState(false);

  const showPhotoOptions = (side: "frente" | "dorso") => {
  
  // WEB
  if (Platform.OS === "web") {
    pickImage(side);
    return;
  }

  // MOBILE
  Alert.alert(
    side === "frente"
      ? "Foto frente del DNI"
      : "Foto dorso del DNI",
    "¿Cómo querés cargar la foto?",
    [
      { text: "Cámara", onPress: () => takePhoto(side) },
      { text: "Galería", onPress: () => pickImage(side) },
      { text: "Cancelar", style: "cancel" },
    ]
  );
};

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

  const pickImage = async (side: "frente" | "dorso") => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      showAlert(
  "warning",
  "Permiso requerido",
  "Necesitamos acceso a tu galería para subir las fotos del DNI."
);
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
      base64: true,
    });
    if (result.canceled || !result.assets[0]) return;
    const photo: DniPhoto = { uri: result.assets[0].uri, base64: result.assets[0].base64 ?? "" };
    if (side === "frente") setDniFrente(photo);
    else setDniDorso(photo);
  };

  const takePhoto = async (side: "frente" | "dorso") => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      showAlert(
  "warning",
  "Permiso requerido",
  "Necesitamos acceso a la cámara."
);
    }
    const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.7, base64: true });
    if (result.canceled || !result.assets[0]) return;
    const photo: DniPhoto = { uri: result.assets[0].uri, base64: result.assets[0].base64 ?? "" };
    if (side === "frente") setDniFrente(photo);
    else setDniDorso(photo);
  };

  const handleSubmit = async () => {
    if (!nombre.trim()) {
  showAlert(
  "warning",
  "Campos incompletos",
  "Ingresá tu nombre."
);
  return;
}

if (!apellido.trim()) {
  showAlert(
  "warning",
  "Campos incompletos",
  "Ingresá tu apellido."
);
  return;
}

if (!document.trim()) {
  showAlert(
  "warning",
  "Campos incompletos",
  "Ingresá tu número de documento."
);
  return;
}

if (!email.trim()) {
  showAlert(
  "warning",
  "Campos incompletos",
  "Ingresá tu correo electrónico."
);
  return;
}

if (!dniFrente) {
  showAlert(
  "warning",
  "Foto requerida",
  "Subí la foto del frente de tu DNI."
);
  return;
}

if (!dniDorso) {
  showAlert(
  "warning",
  "Foto requerida",
  "Subí la foto del dorso de tu DNI."
);
  return;
}

if (!acceptedTerms) {
  showAlert(
  "warning",
  "Términos",
  "Debés aceptar los términos y condiciones."
);
  return;
}

    setLoading(true);
    try {
      await registerApi({
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        document: document.trim(),
        address: address.trim(),
        email: email.trim(),
        dniFrenteBase64: dniFrente.base64,
        dniDorsoBase64: dniDorso.base64,
      });
      showAlert(
  "success",
  "Solicitud enviada",
  "Tu solicitud fue enviada correctamente."
);

setRedirectAfterAlert(true);
    } catch (err: any) {
      showAlert(
  "error",
  "Error al registrarse",
  err?.message ?? "Intentá de nuevo más tarde."
);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="Crear cuenta" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        <View style={styles.row}>
          <View style={styles.half}>
            <CustomInput label="Nombre" placeholder="Juan" value={nombre} onChangeText={setNombre} autoCapitalize="words" />
          </View>
          <View style={styles.half}>
            <CustomInput label="Apellido" placeholder="Pérez" value={apellido} onChangeText={setApellido} autoCapitalize="words" />
          </View>
        </View>

        <CustomInput label="Número de documento" placeholder="12345678" value={document} onChangeText={setDocument} keyboardType="numeric" />
        <CustomInput label="Correo electrónico" placeholder="tu@correo.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
        <CustomInput label="Domicilio legal (opcional)" placeholder="Av. Corrientes 1234, CABA" value={address} onChangeText={setAddress} autoCapitalize="sentences" />

        <Text style={styles.sectionTitle}>Fotos del DNI</Text>
        <Text style={styles.sectionSubtitle}>Necesitamos verificar tu identidad antes de activar tu cuenta.</Text>

        <DniPhotoSlot label="Frente" photo={dniFrente} onPress={() => showPhotoOptions("frente")} />
        <DniPhotoSlot label="Dorso" photo={dniDorso} onPress={() => showPhotoOptions("dorso")} />

        <CustomCard style={styles.infoCard}>
          <Text style={styles.infoText}>
            ℹ️  Una vez que enviés tu solicitud, la empresa revisará tus datos.
            Si todo está en orden, recibirás un mail para crear tu contraseña y activar tu cuenta.
          </Text>
        </CustomCard>

        <View style={styles.termsContainer}>
          <Switch value={acceptedTerms} onValueChange={setAcceptedTerms} thumbColor={acceptedTerms ? COLORS.gold : "#777"} trackColor={{ false: "#333", true: "#665200" }} />
          <Text style={styles.termsText}>
            Acepto los{" "}
            <Text style={styles.termsLink} onPress={() => router.push("/(auth)/terms")}>términos y condiciones</Text>
          </Text>
        </View>

        <CustomButton title={loading ? "Enviando solicitud..." : "Enviar solicitud"} disabled={!acceptedTerms || loading} onPress={handleSubmit} />

      </ScrollView>
      <CustomAlert
  visible={alertVisible}
  type={alertType}
  title={alertTitle}
  message={alertMessage}
  onClose={() => {
    setAlertVisible(false);

    if (redirectAfterAlert) {
      setRedirectAfterAlert(false);
      router.replace("/(auth)/account-confirmation");
    }
  }}
/>
    </View>
  );
}

function DniPhotoSlot({ label, photo, onPress }: { label: string; photo: DniPhoto | null; onPress: () => void }) {
  return (
    <Pressable style={styles.photoSlot} onPress={onPress}>
      {photo ? (
        <>
          <Image source={{ uri: photo.uri }} style={styles.photoPreview} resizeMode="cover" />
          <View style={styles.photoOverlay}>
            <MaterialCommunityIcons name="check-circle" size={20} color={COLORS.success} />
            <Text style={styles.photoOverlayText}>{label} cargado</Text>
          </View>
        </>
      ) : (
        <View style={styles.photoPlaceholder}>
          <MaterialCommunityIcons name="card-account-details-outline" size={32} color={COLORS.muted} />
          <Text style={styles.photoLabel}>{label} del DNI</Text>
          <Text style={styles.photoHint}>Tocá para agregar</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.lg, gap: SPACING.md, paddingBottom: 80 },
  row: { flexDirection: "row", gap: SPACING.md },
  half: { flex: 1 },
  sectionTitle: { color: COLORS.text, fontSize: 15, fontWeight: "600", marginTop: SPACING.sm },
  sectionSubtitle: { color: COLORS.muted, fontSize: 13, marginTop: -SPACING.xs },
  photoSlot: { height: 160, borderRadius: RADIUS.md, overflow: "hidden", borderWidth: 1, borderColor: COLORS.border, borderStyle: "dashed" },
  photoPlaceholder: { flex: 1, backgroundColor: COLORS.surface, alignItems: "center", justifyContent: "center", gap: SPACING.xs },
  photoLabel: { color: COLORS.text, fontWeight: "600", fontSize: 14 },
  photoHint: { color: COLORS.muted, fontSize: 12 },
  photoPreview: { width: "100%", height: "100%" },
  photoOverlay: { position: "absolute", bottom: 0, left: 0, right: 0, flexDirection: "row", alignItems: "center", gap: SPACING.xs, backgroundColor: "rgba(0,0,0,0.6)", padding: SPACING.sm },
  photoOverlayText: { color: COLORS.text, fontSize: 13, fontWeight: "600" },
  infoCard: { borderColor: "rgba(244,197,66,0.2)", backgroundColor: "rgba(244,197,66,0.05)" },
  infoText: { color: COLORS.muted, fontSize: 13, lineHeight: 20 },
  termsContainer: { flexDirection: "row", alignItems: "center", gap: SPACING.sm, marginTop: SPACING.sm },
  termsText: { color: COLORS.text, flex: 1, fontSize: 14 },
  termsLink: { color: COLORS.gold, fontWeight: "700" },
});