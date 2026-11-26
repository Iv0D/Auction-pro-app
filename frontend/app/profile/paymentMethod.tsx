import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator, Alert, FlatList, Platform, Pressable,
    SafeAreaView, StyleSheet, Text, View,
} from "react-native";
import CustomButton from "../../src/components/ui/CustomButton";
import ScreenHeader from "../../src/components/ui/ScreenHeader";
import { COLORS, RADIUS, SPACING } from "../../src/constants/theme";
import {
    deletePaymentMethodApi, getPaymentMethodsApi, PaymentMethod,
} from "../../src/services/paymentService";

const TIPO_LABEL: Record<string, string> = {
  TARJETA_CREDITO: "Tarjeta de crédito",
  CUENTA_BANCARIA: "Cuenta bancaria",
  CHEQUE_CERTIFICADO: "Cheque certificado",
};

const TIPO_ICON: Record<string, string> = {
  TARJETA_CREDITO: "credit-card-outline",
  CUENTA_BANCARIA: "bank-outline",
  CHEQUE_CERTIFICADO: "checkbook",
};

export default function PaymentMethodsScreen() {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMethods = useCallback(async () => {
    try {
      const data = await getPaymentMethodsApi();
      setMethods(data);
    } catch (err: any) {
      Alert.alert("Error", err?.message ?? "No se pudieron cargar los medios de pago");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMethods(); }, [fetchMethods]);

  const doDelete = async (id: number) => {
  try {
    await deletePaymentMethodApi(id);
    setMethods((prev) => prev.filter((m) => m.id !== id));
  } catch (err: any) {
    if (Platform.OS === "web") {
      window.alert(err?.message ?? "No se pudo eliminar");
    } else {
      Alert.alert("Error", err?.message ?? "No se pudo eliminar");
    }
  }
};

const handleDelete = (id: number) => {
  if (Platform.OS === "web") {
    const confirmed = window.confirm(
      "¿Estás seguro que querés eliminar este medio de pago?"
    );

    if (confirmed) doDelete(id);
    return;
  }

  Alert.alert(
    "Eliminar medio de pago",
    "¿Estás seguro que querés eliminarlo?",
    [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: () => doDelete(id),
      },
    ]
  );
};

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title="Medios de pago" />

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.gold} />
        </View>
      ) : (
        <FlatList
          data={methods}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <MaterialCommunityIcons name="credit-card-off-outline" size={48} color={COLORS.border} />
              <Text style={styles.emptyText}>No tenés medios de pago registrados</Text>
            </View>
          }
          ListFooterComponent={
            <CustomButton
              title="Agregar medio de pago"
              onPress={() => router.push("/profile/addPaymentMethod")}
            />
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardLeft}>
                <MaterialCommunityIcons
                  name={TIPO_ICON[item.tipo] as any ?? "credit-card-outline"}
                  size={28} color={COLORS.gold}
                />
                <View>
                  <Text style={styles.cardTipo}>{TIPO_LABEL[item.tipo] ?? item.tipo}</Text>
                  {item.ultimos4 && (
                    <Text style={styles.cardSub}>**** {item.ultimos4}</Text>
                  )}
                  {item.banco && (
                    <Text style={styles.cardSub}>{item.banco}</Text>
                  )}
                  {item.montoGarantizado && (
                    <Text style={styles.cardSub}>
                      Garantía: {item.moneda} {item.montoGarantizado.toLocaleString()}
                    </Text>
                  )}
                  <View style={[styles.badge, item.verificado ? styles.badgeOk : styles.badgePending]}>
                    <Text style={[styles.badgeText, item.verificado ? styles.badgeTextOk : styles.badgeTextPending]}>
                      {item.verificado ? "Verificado" : "Pendiente"}
                    </Text>
                  </View>
                </View>
              </View>
              <Pressable onPress={() => handleDelete(item.id)} hitSlop={8}>
                <MaterialCommunityIcons name="trash-can-outline" size={22} color={COLORS.danger} />
              </Pressable>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  list: { padding: SPACING.lg, gap: SPACING.md, paddingBottom: 80 },
  empty: { alignItems: "center", gap: SPACING.md, paddingVertical: SPACING.xl },
  emptyText: { color: COLORS.muted, fontSize: 15 },

  card: {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.border,
    padding: SPACING.md, flexDirection: "row",
    alignItems: "center", justifyContent: "space-between",
  },
  cardLeft: { flexDirection: "row", alignItems: "flex-start", gap: SPACING.md, flex: 1 },
  cardTipo: { color: COLORS.text, fontSize: 15, fontWeight: "600" },
  cardSub: { color: COLORS.muted, fontSize: 13, marginTop: 2 },

  badge: { marginTop: 6, alignSelf: "flex-start", borderRadius: RADIUS.sm, paddingHorizontal: 8, paddingVertical: 2 },
  badgeOk: { backgroundColor: "rgba(34,197,94,0.15)" },
  badgePending: { backgroundColor: "rgba(244,197,66,0.15)" },
  badgeText: { fontSize: 11, fontWeight: "600" },
  badgeTextOk: { color: COLORS.success },
  badgeTextPending: { color: COLORS.gold },
});
