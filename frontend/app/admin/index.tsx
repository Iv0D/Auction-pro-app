import { Redirect, Stack } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import CustomButton from "../../src/components/ui/CustomButton";
import CustomInput from "../../src/components/ui/CustomInput";
import { COLORS, RADIUS, SPACING } from "../../src/constants/theme";
import { useAuth } from "../../src/context/AuthContext";
import {
  closeAuctionLot, getPendingClients, getPendingPayments, getPendingProducts,
  reviewClient, reviewProduct, verifyPayment,
} from "../../src/services/adminService";
import { getAuctionCatalogApi, getAuctionsApi } from "../../src/services/auctionService";
import { isAuctionLive } from "../../src/utils/auction";
import { formatMoney } from "../../src/utils/format";

async function loadDashboard() {
  const [clients, payments, products, auctions] = await Promise.all([
    getPendingClients(), getPendingPayments(), getPendingProducts(), getAuctionsApi(),
  ]);
  const activeAuctions = auctions.filter(isAuctionLive);
  const lots = await Promise.all(activeAuctions.map(async (auction) => ({
    auction,
    lot: (await getAuctionCatalogApi(auction.id)).find((item) => item.auctioned !== "si"),
  })));
  return { clients, payments, products, lots };
}

const errorMessage = (error: unknown) => error instanceof Error ? error.message : "Ocurrió un error. Intentá de nuevo.";

export default function AdminScreen() {
  const { user, isLoading } = useAuth();
  const [dashboard, setDashboard] = useState<Awaited<ReturnType<typeof loadDashboard>>>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [productId, setProductId] = useState<number>();
  const [price, setPrice] = useState("");
  const [commission, setCommission] = useState("10");
  const [pendingClose, setPendingClose] = useState<number>();

  const refresh = useCallback(async () => {
    try {
      setDashboard(await loadDashboard());
    } catch (failure) {
      setError(errorMessage(failure));
    }
  }, []);

  useEffect(() => {
    if (user?.administrator) void refresh();
  }, [user?.administrator, refresh]);

  async function run(action: () => Promise<unknown>, message: string) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await action();
      setNotice(message);
      setPendingClose(undefined);
      setProductId(undefined);
      await refresh();
    } catch (failure) {
      setError(errorMessage(failure));
    } finally {
      setBusy(false);
    }
  }

  if (isLoading) return <ActivityIndicator color={COLORS.gold} />;
  if (!user?.administrator) return <Redirect href="/profile" />;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ headerShown: true, title: "Administración", headerTintColor: COLORS.gold,
        headerStyle: { backgroundColor: COLORS.surface } }} />
      <View style={styles.header}>
        <Text accessibilityRole="header" style={styles.title}>Operaciones</Text>
        <CustomButton title="Actualizar" variant="ghost" disabled={busy}
          onPress={() => { setError(""); void refresh(); }} />
      </View>
      {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
      {notice ? <Text accessibilityLiveRegion="polite" style={styles.notice}>{notice}</Text> : null}
      {!dashboard && !error ? <ActivityIndicator color={COLORS.gold} /> : null}
      {dashboard && <>
        <View style={styles.section}>
          <Text accessibilityRole="header" style={styles.sectionTitle}>Altas pendientes</Text>
          {dashboard.clients.length === 0 && <Text style={styles.muted}>No hay solicitudes pendientes.</Text>}
          {dashboard.clients.map((client) => (
            <View key={client.clientId} style={styles.card}>
              <Text style={styles.name}>{client.name}</Text>
              <Text style={styles.muted}>{client.email}</Text>
              <View style={styles.actions}>
                <CustomButton title="Aprobar alta" disabled={busy}
                  onPress={() => void run(() => reviewClient(client.clientId, true), "Alta aprobada. Se envió la activación.")} />
                <CustomButton title="Rechazar" variant="ghost" disabled={busy}
                  onPress={() => void run(() => reviewClient(client.clientId, false), "Alta rechazada.")} />
              </View>
            </View>
          ))}
        </View>
        <View style={styles.section}>
          <Text accessibilityRole="header" style={styles.sectionTitle}>Medios de pago pendientes</Text>
          {dashboard.payments.length === 0 && <Text style={styles.muted}>No hay medios de pago pendientes.</Text>}
          {dashboard.payments.map(({ email, method: payment }) => (
            <View key={payment.id} style={styles.card}>
              <Text style={styles.name}>{payment.tipo.replaceAll("_", " ").toLowerCase()} #{payment.id}</Text>
              <Text style={styles.muted}>{email}</Text>
              <Text style={styles.muted}>
                {payment.montoGarantizado != null
                  ? `${payment.moneda ?? "ARS"} ${payment.montoGarantizado.toLocaleString("es-AR")}`
                  : [payment.titular, payment.banco, payment.ultimos4 ?? payment.cbu].filter(Boolean).join(" · ")}
              </Text>
              <CustomButton title="Marcar verificado" disabled={busy}
                onPress={() => void run(() => verifyPayment(payment.id), "Medio de pago verificado.")} />
            </View>
          ))}
        </View>
        <View style={styles.section}>
          <Text accessibilityRole="header" style={styles.sectionTitle}>Publicaciones pendientes</Text>
          {dashboard.products.length === 0 && <Text style={styles.muted}>No hay publicaciones para revisar.</Text>}
          {dashboard.products.map((product) => (
            <View key={product.id} style={styles.card}>
              <Text style={styles.name}>{product.name}</Text>
              <Text style={styles.muted}>{product.catalogDescription}</Text>
              {productId === product.id ? (
                <>
                  <CustomInput label="Precio base (ARS)" value={price} onChangeText={setPrice} keyboardType="decimal-pad" />
                  <CustomInput label="Comisión (%)" value={commission} onChangeText={setCommission} keyboardType="decimal-pad" />
                  <CustomButton title="Confirmar aprobación" disabled={busy} onPress={() => {
                    const basePrice = Number(price.replace(",", "."));
                    const commissionRate = Number(commission.replace(",", "."));
                    if (!price.trim() || !commission.trim() || !Number.isFinite(basePrice)
                        || !Number.isFinite(commissionRate) || basePrice <= 0 || commissionRate < 0 || commissionRate > 100) {
                      setError("Ingresá un precio positivo y una comisión entre 0 y 100.");
                      return;
                    }
                    void run(() => reviewProduct(product.id, { basePrice, commissionRate }), "Publicación aprobada.");
                  }} />
                </>
              ) : (
                <View style={styles.actions}>
                  <CustomButton title="Aprobar publicación" disabled={busy} onPress={() => {
                    setProductId(product.id);
                    setPrice("");
                    setCommission("10");
                  }} />
                  <CustomButton title="Rechazar" variant="ghost" disabled={busy}
                    onPress={() => void run(() => reviewProduct(product.id), "Publicación rechazada.")} />
                </View>
              )}
            </View>
          ))}
        </View>
        <View style={styles.section}>
          <Text accessibilityRole="header" style={styles.sectionTitle}>Subastas abiertas</Text>
          {dashboard.lots.length === 0 && <Text style={styles.muted}>No hay subastas abiertas.</Text>}
          {dashboard.lots.map(({ auction, lot }) => (
            <View key={auction.id} style={styles.card}>
              <Text style={styles.name}>{auction.location ?? `Subasta #${auction.id}`}</Text>
              <Text style={styles.muted}>{lot
                ? `${lot.productName} · Base ${formatMoney(lot.basePrice ?? 0)}`
                : "Sin lotes pendientes"}</Text>
              {lot && (pendingClose === lot.id ? (
                <View style={styles.actions}>
                  <CustomButton title="Confirmar cierre" disabled={busy}
                    onPress={() => void run(() => closeAuctionLot(auction.id, lot.id), "Lote cerrado.")} />
                  <CustomButton title="Cancelar" variant="ghost" onPress={() => setPendingClose(undefined)} />
                </View>
              ) : (
                <CustomButton title="Cerrar lote actual" variant="outline" disabled={busy}
                  onPress={() => setPendingClose(lot.id)} />
              ))}
            </View>
          ))}
        </View>
      </>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  content: { width: "100%", maxWidth: 720, alignSelf: "center", padding: SPACING.md, gap: SPACING.lg },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { fontSize: 30, color: COLORS.text, fontWeight: "800" },
  section: { gap: SPACING.sm },
  sectionTitle: { fontSize: 20, color: COLORS.text, fontWeight: "700" },
  card: { backgroundColor: COLORS.surface, borderColor: COLORS.border, borderWidth: 1,
    borderRadius: RADIUS.md, padding: SPACING.md, gap: SPACING.sm },
  name: { color: COLORS.text, fontWeight: "700" },
  muted: { color: "#A9A9A9" },
  actions: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: SPACING.md },
  error: { color: "#FF8888" },
  notice: { color: COLORS.success },
});
