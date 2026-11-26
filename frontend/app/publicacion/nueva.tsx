import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Image,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { COLORS, RADIUS, SPACING } from "../../src/constants/theme";
import { ProductType, crearProductoApi } from "../../src/services/publicacionService";
import CustomAlert from "../../src/components/CustomAlert";

const MIN_PHOTOS = 6;

type PhotoAsset = { uri: string; base64: string };

export default function NuevoProductoScreen() {
  const [type, setType] = useState<ProductType>("normal");

  // Campos comunes
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [catalogDescription, setCatalogDescription] = useState("");
  const [fullDescription, setFullDescription] = useState("");

  // Solo art
  const [year, setYear] = useState("");
  const [history, setHistory] = useState("");

  // Fotos y propiedad
  const [photos, setPhotos] = useState<PhotoAsset[]>([]);
  const [ownerConfirmed, setOwnerConfirmed] = useState(false);
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
  // ─── Fotos ────────────────────────────────────────────────────────────────

  const pickPhoto = async () => {

  // WEB
  if (Platform.OS === "web") {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.multiple = true;

    input.onchange = async (e: any) => {
      const files: FileList | null = e.target.files;

      if (!files || files.length === 0) return;

      const fileArray = Array.from(files);

      const converted = await Promise.all(
        fileArray.map(
          (file) =>
            new Promise<PhotoAsset>((resolve, reject) => {
              const reader = new FileReader();

              reader.onload = () => {
                const result = reader.result as string;

                resolve({
                  uri: result,
                  base64: result.split(",")[1] ?? "",
                });
              };

              reader.onerror = reject;
              reader.readAsDataURL(file);
            })
        )
      );

      setPhotos((prev) => [...prev, ...converted].slice(0, 10));
    };

    input.click();
    return;
  }

  // MOBILE
  const { status } =
    await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (status !== "granted") {
    showAlert(
  "warning",
  "Permiso requerido",
  "Necesitamos acceso a tu galería."
);
    return;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsMultipleSelection: true,
    quality: 0.7,
    base64: true,
    selectionLimit: 10,
  });

  if (result.canceled) return;

  const newPhotos: PhotoAsset[] = result.assets.map((a) => ({
    uri: a.uri,
    base64: a.base64 ?? "",
  }));

  setPhotos((prev) => [...prev, ...newPhotos].slice(0, 10));
};

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      showAlert(
  "warning",
  "Permiso requerido",
  "Necesitamos acceso a la cámara."
);
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.7,
      base64: true,
    });
    if (result.canceled || !result.assets[0]) return;
    setPhotos((prev) =>
      [...prev, { uri: result.assets[0].uri, base64: result.assets[0].base64 ?? "" }].slice(0, 10)
    );
  };

  const showPhotoOptions = () => {
  if (Platform.OS === "web") {
    pickPhoto();
    return;
  }

  Alert.alert("Agregar foto", "¿Cómo querés agregar la foto?", [
    { text: "Cámara", onPress: takePhoto },
    { text: "Galería", onPress: pickPhoto },
    { text: "Cancelar", style: "cancel" },
  ]);
};

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  // ─── Submit ───────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!name.trim()) { showAlert(
  "warning",
  "Datos incompletos",
  "Ingresá el nombre del artículo."
);
return; }
    if (!catalogDescription.trim()) { showAlert(
  "warning",
  "Datos incompletos",
  "Ingresá una descripción para el catálogo."
);
return; }
    if (photos.length < MIN_PHOTOS) {
      showAlert(
  "warning",
  "Fotos insuficientes",
  `Necesitás al menos ${MIN_PHOTOS} fotos del artículo.`
);
      return;
    }
    if (!ownerConfirmed) {
      showAlert(
  "warning",
  "Declaración requerida",
  "Debés confirmar que sos el propietario legítimo."
);
      return;
    }

    setLoading(true);
    try {
      await crearProductoApi({
        type,
        name: name.trim(),
        brand: brand.trim(),
        quantity: parseInt(quantity) || 1,
        catalogDescription: catalogDescription.trim(),
        fullDescription: fullDescription.trim() || catalogDescription.trim(),
        year: type === "art" && year ? parseInt(year) : undefined,
        history: type === "art" ? history.trim() : undefined,
        ownerConfirmed,
        photosBase64: photos.map((p) => p.base64),
      });
      showAlert(
  "success",
  "Artículo enviado",
  "Recibimos tu artículo. Un empleado lo revisará y te informaremos el resultado."
);

setGoBackAfterAlert(true);
    } catch (err: any) {
      showAlert(
  "error",
  "Error",
  err?.message ?? "No se pudo enviar el artículo."
);
    } finally {
      setLoading(false);
    }
  };

  // ─── UI ───────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container}>
      {/* Navbar */}
      <View style={styles.navbar}>
        <Pressable onPress={() => router.back()} style={styles.navBtn}>
          <MaterialCommunityIcons name="close" size={22} color={COLORS.text} />
        </Pressable>
        <Text style={styles.navTitle}>Nuevo artículo</Text>
        <Pressable
          onPress={handleSubmit}
          disabled={loading}
          style={styles.navBtn}
        >
          <Text style={[styles.navSubmit, loading && { opacity: 0.4 }]}>
            {loading ? "Enviando" : "Enviar"}
          </Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Tabs de tipo */}
        <View style={styles.typeTabs}>
          <Pressable
            style={[styles.typeTab, type === "normal" && styles.typeTabActive]}
            onPress={() => setType("normal")}
          >
            <Text style={[styles.typeTabText, type === "normal" && styles.typeTabTextActive]}>
              Producto
            </Text>
          </Pressable>
          <Pressable
            style={[styles.typeTab, type === "art" && styles.typeTabActive]}
            onPress={() => setType("art")}
          >
            <Text style={[styles.typeTabText, type === "art" && styles.typeTabTextActive]}>
              Obra de Arte / Producto Diseñado
            </Text>
          </Pressable>
        </View>

        {/* Upload de fotos */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>FOTOS DEL ARTÍCULO</Text>
          <Text style={styles.sectionSub}>Mínimo {MIN_PHOTOS} fotos · JPG, PNG · hasta 20MB</Text>

          {/* Grid de fotos */}
          <View style={styles.photoGrid}>
            {photos.map((photo, index) => (
              <View key={index} style={styles.photoThumb}>
                <Image source={{ uri: photo.uri }} style={styles.photoImg} resizeMode="cover" />
                <Pressable style={styles.photoRemove} onPress={() => removePhoto(index)}>
                  <MaterialCommunityIcons name="close-circle" size={18} color="#fff" />
                </Pressable>
              </View>
            ))}

            {/* Botón agregar */}
            {photos.length < 10 && (
              <Pressable style={styles.photoAdd} onPress={showPhotoOptions}>
                <MaterialCommunityIcons name="camera-plus-outline" size={28} color={COLORS.gold} />
                <Text style={styles.photoAddText}>
                  {photos.length === 0 ? "Toca para agregar" : "Agregar más"}
                </Text>
              </Pressable>
            )}
          </View>

          {/* Progreso de fotos */}
          <View style={styles.photoProgress}>
            <View style={[
              styles.photoProgressBar,
              { width: `${Math.min((photos.length / MIN_PHOTOS) * 100, 100)}%` }
            ]} />
          </View>
          <Text style={styles.photoCount}>
            {photos.length}/{MIN_PHOTOS} fotos requeridas
            {photos.length >= MIN_PHOTOS && " ✓"}
          </Text>
        </View>

        {/* LOT IDENTITY */}
        <View style={styles.section}>
          <Text style={styles.fieldLabel}>IDENTIDAD DEL LOTE</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder={type === "art"
              ? "e.g. Rolex Cosmograph Daytona"
              : "e.g. Rare Eames Shell Chair"}
            placeholderTextColor={COLORS.border}
          />
        </View>

        {/* Item count + origen */}
        <View style={styles.row}>
          <View style={[styles.section, { flex: 1 }]}>
            <Text style={styles.fieldLabel}>CANTIDAD DE ÍTEMS</Text>
            <TextInput
              style={styles.input}
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="numeric"
              placeholder="1"
              placeholderTextColor={COLORS.border}
            />
          </View>
          {type === "art" && (
            <View style={[styles.section, { flex: 1 }]}>
              <Text style={styles.fieldLabel}>AÑO</Text>
              <TextInput
                style={styles.input}
                value={year}
                onChangeText={setYear}
                keyboardType="numeric"
                placeholder="1963"
                placeholderTextColor={COLORS.border}
                maxLength={4}
              />
            </View>
          )}
        </View>

        {/* Origen / Marca */}
        <View style={styles.section}>
          <Text style={styles.fieldLabel}>ORIGEN / CREADOR</Text>
          <TextInput
            style={styles.input}
            value={brand}
            onChangeText={setBrand}
            placeholder={type === "art" ? "Swiss Heritage Workshop" : "Herman Miller"}
            placeholderTextColor={COLORS.border}
            autoCapitalize="words"
          />
        </View>

        {/* Historia (solo art) */}
        {type === "art" && (
          <View style={styles.section}>
            <Text style={styles.fieldLabel}>HISTORIA</Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              value={history}
              onChangeText={setHistory}
              placeholder="Describe la historia del artículo."
              placeholderTextColor={COLORS.border}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
        )}

        {/* Provenance & Narrative */}
        <View style={styles.section}>
          <Text style={styles.fieldLabel}>ORIGEN Y HISTORIA</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            value={catalogDescription}
            onChangeText={(t) => {
              setCatalogDescription(t);
              setFullDescription(t);
            }}
            placeholder="Describe el origen del artículo, su historia, y cualquier detalle relevante para los compradores."
            placeholderTextColor={COLORS.border}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Declaración de propiedad */}
        <Pressable
          style={styles.ownerRow}
          onPress={() => setOwnerConfirmed((v) => !v)}
        >
          <View style={[styles.checkbox, ownerConfirmed && styles.checkboxActive]}>
            {ownerConfirmed && (
              <MaterialCommunityIcons name="check" size={14} color="#000" />
            )}
          </View>
          <View style={styles.ownerTextWrap}>
            <Text style={styles.ownerTitle}>Verifico la propiedad legal</Text>
            <Text style={styles.ownerSub}>
              Al marcar esto, confirmas que el artículo es tuyo y es auténtico.
            </Text>
          </View>
        </Pressable>

        {/* Submit */}
        <Pressable
          style={[styles.submitBtn, loading && { opacity: 0.6 }]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.submitBtnText}>
            {loading ? "Enviando artículo..." : "Iniciar revisión"}
          </Text>
        </Pressable>

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
  container: { flex: 1, backgroundColor: "#0D0D0D" },

  // Navbar
  navbar: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md,
    borderBottomWidth: 1, borderBottomColor: "#1A1A1A",
  },
  navBtn: { padding: 4, minWidth: 60 },
  navTitle: { color: COLORS.text, fontSize: 16, fontWeight: "700" },
  navSubmit: { color: COLORS.gold, fontSize: 15, fontWeight: "700", textAlign: "right" },

  scroll: { padding: SPACING.lg, gap: SPACING.lg, paddingBottom: 80 },

  // Tabs de tipo
  typeTabs: {
    flexDirection: "row",
    backgroundColor: "#1A1A1A",
    borderRadius: RADIUS.md,
    padding: 3,
  },
  typeTab: {
    flex: 1, paddingVertical: 10, paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.sm - 2, alignItems: "center",
  },
  typeTabActive: { backgroundColor: COLORS.gold },
  typeTabText: { color: COLORS.muted, fontSize: 12, fontWeight: "600", textAlign: "center" },
  typeTabTextActive: { color: "#000", fontSize: 12, fontWeight: "700" },

  // Secciones
  section: { gap: 8 },
  sectionLabel: {
    color: COLORS.muted, fontSize: 11, fontWeight: "700", letterSpacing: 1.5,
  },
  sectionSub: { color: COLORS.border, fontSize: 11 },

  // Fotos
  photoGrid: { flexDirection: "row", flexWrap: "wrap", gap: SPACING.sm },
  photoThumb: { width: 80, height: 80, borderRadius: RADIUS.sm, overflow: "hidden" },
  photoImg: { width: "100%", height: "100%" },
  photoRemove: { position: "absolute", top: 3, right: 3 },
  photoAdd: {
    width: 80, height: 80, borderRadius: RADIUS.sm,
    backgroundColor: "#1A1A1A", borderWidth: 1, borderColor: "#333",
    borderStyle: "dashed", justifyContent: "center", alignItems: "center", gap: 4,
  },
  photoAddText: { color: COLORS.muted, fontSize: 10, textAlign: "center" },
  photoProgress: {
    height: 3, backgroundColor: "#1A1A1A", borderRadius: 2, marginTop: 4,
  },
  photoProgressBar: {
    height: 3, backgroundColor: COLORS.gold, borderRadius: 2,
  },
  photoCount: { color: COLORS.muted, fontSize: 12 },

  // Inputs
  fieldLabel: {
    color: COLORS.muted, fontSize: 10, fontWeight: "700", letterSpacing: 1.5, marginBottom: 2,
  },
  input: {
    backgroundColor: "#1A1A1A",
    borderWidth: 1, borderColor: "#2A2A2A",
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.md, paddingVertical: 12,
    color: COLORS.text, fontSize: 15,
  },
  textarea: { height: 90, paddingTop: 12 },

  row: { flexDirection: "row", gap: SPACING.md },

  // Propiedad
  ownerRow: {
    flexDirection: "row", alignItems: "flex-start", gap: SPACING.md,
    backgroundColor: "#1A1A1A", borderRadius: RADIUS.sm,
    padding: SPACING.md, borderWidth: 1, borderColor: "#2A2A2A",
  },
  checkbox: {
    width: 20, height: 20, borderRadius: 4,
    borderWidth: 2, borderColor: "#444",
    justifyContent: "center", alignItems: "center", marginTop: 2,
  },
  checkboxActive: { backgroundColor: COLORS.gold, borderColor: COLORS.gold },
  ownerTextWrap: { flex: 1 },
  ownerTitle: { color: COLORS.text, fontSize: 13, fontWeight: "600" },
  ownerSub: { color: COLORS.muted, fontSize: 12, lineHeight: 18, marginTop: 2 },

  // Submit
  submitBtn: {
    backgroundColor: COLORS.gold, borderRadius: RADIUS.lg,
    padding: 16, alignItems: "center",
  },
  submitBtnText: { color: "#000", fontSize: 16, fontWeight: "800" },
});