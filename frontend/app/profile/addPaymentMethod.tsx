import { router } from "expo-router";
import { useState } from "react";
import {
    Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View,
} from "react-native";
import CustomButton from "../../src/components/ui/CustomButton";
import CustomInput from "../../src/components/ui/CustomInput";
import ScreenHeader from "../../src/components/ui/ScreenHeader";
import { COLORS, RADIUS, SPACING } from "../../src/constants/theme";
import { addPaymentMethodApi } from "../../src/services/paymentService";
import CustomAlert from "../../src/components/CustomAlert";

type TipoMedio = "TARJETA_CREDITO" | "CUENTA_BANCARIA" | "CHEQUE_CERTIFICADO";

const TIPOS: { value: TipoMedio; label: string }[] = [
  { value: "TARJETA_CREDITO", label: "Tarjeta de crédito" },
  { value: "CUENTA_BANCARIA", label: "Cuenta bancaria" },
  { value: "CHEQUE_CERTIFICADO", label: "Cheque certificado" },
];

export default function AddPaymentMethodScreen() {
  const [tipo, setTipo] = useState<TipoMedio>("TARJETA_CREDITO");
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

const [goBackAfterAlert, setGoBackAfterAlert] = useState(false);

  // Tarjeta
  const [titular, setTitular] = useState("");
  const [numeroTarjeta, setNumeroTarjeta] = useState("");
  const [fechaExpiracion, setFechaExpiracion] = useState("");
  const [cvv, setCvv] = useState("");
  const [marca, setMarca] = useState("");

  // Cuenta bancaria
  const [banco, setBanco] = useState("");
  const [cbu, setCbu] = useState("");

  // Cheque
  const [montoGarantizado, setMontoGarantizado] = useState("");
  const [moneda, setMoneda] = useState("ARS");

  const handleAdd = async () => {
    setLoading(true);
    try {
      const payload: any = { tipo };

      if (tipo === "TARJETA_CREDITO") {
        if (!titular || !numeroTarjeta || !fechaExpiracion || !cvv || !marca) {
          showAlert(
  "warning",
  "Datos incompletos",
  "Completá todos los campos de la tarjeta."
);
return;
        }
        Object.assign(payload, { titular, numeroTarjeta, fechaExpiracion, cvv, marca });
      } else if (tipo === "CUENTA_BANCARIA") {
        if (!banco || !cbu || !titular) {
          showAlert(
  "warning",
  "Datos incompletos",
  "Completá todos los campos de la cuenta."
);
return;
        }
        Object.assign(payload, { banco, cbu, titular, pais: "Argentina" });
      } else {
        if (!montoGarantizado) {
          showAlert(
  "warning",
  "Datos incompletos",
  "Ingresá el monto garantizado."
);
          return;
        }
        Object.assign(payload, {
          banco: banco || undefined,
          montoGarantizado: parseFloat(montoGarantizado),
          moneda,
        });
      }

      await addPaymentMethodApi(payload);
      showAlert(
  "success",
  "Medio registrado",
  "El medio de pago fue registrado correctamente y quedó pendiente de verificación."
);

setGoBackAfterAlert(true);
    } catch (err: any) {
      showAlert(
  "error",
  "Error",
  err?.message ?? "No se pudo agregar el medio de pago"
);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title="Agregar medio de pago" />
      <ScrollView contentContainerStyle={styles.scroll}>

        {/* Selector de tipo */}
        <View style={styles.tipoRow}>
          {TIPOS.map((t) => (
            <Pressable
              key={t.value}
              style={[styles.tipoBtn, tipo === t.value && styles.tipoBtnActive]}
              onPress={() => setTipo(t.value)}
            >
              <Text style={[styles.tipoBtnText, tipo === t.value && styles.tipoBtnTextActive]}>
                {t.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Campos según tipo */}
        {tipo === "TARJETA_CREDITO" && (
          <>
            <CustomInput label="Titular" value={titular} onChangeText={setTitular} placeholder="Juan Perez" autoCapitalize="words" />
            <CustomInput label="Número de tarjeta" value={numeroTarjeta} onChangeText={setNumeroTarjeta} placeholder="4111 1111 1111 1111" keyboardType="numeric" maxLength={19} />
            <CustomInput label="Vencimiento" value={fechaExpiracion} onChangeText={setFechaExpiracion} placeholder="MM/AA" maxLength={5} />
            <CustomInput label="CVV" value={cvv} onChangeText={setCvv} placeholder="123" keyboardType="numeric" maxLength={4} secureTextEntry />
            <CustomInput label="Marca (VISA, MASTERCARD...)" value={marca} onChangeText={setMarca} placeholder="VISA" autoCapitalize="characters" />
          </>
        )}

        {tipo === "CUENTA_BANCARIA" && (
          <>
            <CustomInput label="Banco" value={banco} onChangeText={setBanco} placeholder="Santander" autoCapitalize="words" />
            <CustomInput label="CBU" value={cbu} onChangeText={setCbu} placeholder="0123456789012345678901" keyboardType="numeric" maxLength={22} />
            <CustomInput label="Titular" value={titular} onChangeText={setTitular} placeholder="Juan Perez" autoCapitalize="words" />
          </>
        )}

        {tipo === "CHEQUE_CERTIFICADO" && (
          <>
            <CustomInput label="Banco (opcional)" value={banco} onChangeText={setBanco} placeholder="Galicia" autoCapitalize="words" />
            <CustomInput label="Monto garantizado" value={montoGarantizado} onChangeText={setMontoGarantizado} placeholder="50000" keyboardType="numeric" />
            <View style={styles.monedaRow}>
              {["ARS", "USD"].map((m) => (
                <Pressable
                  key={m}
                  style={[styles.monedaBtn, moneda === m && styles.monedaBtnActive]}
                  onPress={() => setMoneda(m)}
                >
                  <Text style={[styles.monedaBtnText, moneda === m && styles.monedaBtnTextActive]}>{m}</Text>
                </Pressable>
              ))}
            </View>
          </>
        )}

        <CustomButton title={loading ? "Agregando..." : "Agregar medio de pago"} onPress={handleAdd} disabled={loading} />

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

  tipoRow: { gap: SPACING.sm },
  tipoBtn: {
    padding: SPACING.md, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surface,
  },
  tipoBtnActive: { borderColor: COLORS.gold, backgroundColor: "rgba(244,197,66,0.1)" },
  tipoBtnText: { color: COLORS.muted, fontSize: 14, textAlign: "center" },
  tipoBtnTextActive: { color: COLORS.gold, fontWeight: "600" },

  monedaRow: { flexDirection: "row", gap: SPACING.sm },
  monedaBtn: {
    flex: 1, padding: SPACING.md, borderRadius: RADIUS.sm,
    borderWidth: 1, borderColor: COLORS.border, alignItems: "center",
  },
  monedaBtnActive: { borderColor: COLORS.gold, backgroundColor: "rgba(244,197,66,0.1)" },
  monedaBtnText: { color: COLORS.muted, fontWeight: "600" },
  monedaBtnTextActive: { color: COLORS.gold },
});