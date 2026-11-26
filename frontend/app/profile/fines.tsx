import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Platform,
    Pressable,
    RefreshControl,
    SafeAreaView,
    StyleSheet,
    Text,
    View,
} from "react-native";

import ScreenHeader from "../../src/components/ui/ScreenHeader";
import { COLORS, RADIUS, SPACING } from "../../src/constants/theme";
import { Fine, getMyFinesApi, payFineApi } from "../../src/services/fineService";

export default function FinesScreen() {
  const [fines, setFines] = useState<Fine[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [payingId, setPayingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchFines = useCallback(async () => {
    try {
      setError(null);
      const data = await getMyFinesApi();
      setFines(data);
    } catch (err: any) {
      setError(err?.message ?? "No se pudieron cargar las multas.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchFines(); }, [fetchFines]);

  const handlePay = (fineId: number) => {
    const doPay = async () => {
      setPayingId(fineId);
      try {
        const res = await payFineApi(fineId);
        setFines((prev) =>
          prev.map((f) => (f.id === fineId ? { ...f, status: "pagada" } : f))
        );
        const msg = res.hasPendingFines
          ? "Multa pagada. Todavía tenés multas pendientes."
          : "Multa pagada. Ya podés participar en subastas nuevamente.";
        Platform.OS === "web" ? window.alert(msg) : Alert.alert("¡Listo!", msg);
      } catch (err: any) {
        const msg = err?.message ?? "No se pudo procesar el pago.";
        Platform.OS === "web" ? window.alert(msg) : Alert.alert("Error", msg);
      } finally {
        setPayingId(null);
      }
    };

    if (Platform.OS === "web") {
      if (window.confirm("¿Confirmás el pago de esta multa?")) doPay();
    } else {
      Alert.alert("Pagar multa", "¿Confirmás el pago de esta multa?", [
        { text: "Cancelar", style: "cancel" },
        { text: "Pagar", onPress: doPay },
      ]);
    }
  };

  const pending = fines.filter((f) => f.status === "pendiente");
  const paid = fines.filter((f) => f.status === "pagada");

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title="Multas" />

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.gold} />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <MaterialCommunityIcons name="alert-circle-outline" size={48} color={COLORS.danger} />
          <Text style={styles.mutedText}>{error}</Text>
          <Pressable onPress={fetchFines} style={styles.retryBtn}>
            <Text style={styles.retryText}>Reintentar</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={fines}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchFines(); }}
              tintColor={COLORS.gold}
            />
          }
          ListHeaderComponent={<SummaryBanner pending={pending.length} paid={paid.length} />}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <MaterialCommunityIcons name="check-circle-outline" size={56} color={COLORS.success} />
              <Text style={styles.mutedText}>No tenés multas registradas.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <FineCard fine={item} onPay={handlePay} paying={payingId === item.id} />
          )}
        />
      )}
    </SafeAreaView>
  );
}

function SummaryBanner({ pending, paid }: { pending: number; paid: number }) {
  if (pending === 0 && paid === 0) return null;
  return (
    <View style={styles.bannerWrap}>
      <View style={styles.bannerCard}>
        <MaterialCommunityIcons name="alert-circle-outline" size={20} color={COLORS.danger} />
        <Text style={[styles.bannerValue, { color: COLORS.danger }]}>{pending}</Text>
        <Text style={styles.bannerLabel}>Pendiente{pending !== 1 ? "s" : ""}</Text>
      </View>
      <View style={styles.bannerCard}>
        <MaterialCommunityIcons name="check-circle-outline" size={20} color={COLORS.success} />
        <Text style={[styles.bannerValue, { color: COLORS.success }]}>{paid}</Text>
        <Text style={styles.bannerLabel}>Pagada{paid !== 1 ? "s" : ""}</Text>
      </View>
    </View>
  );
}

function FineCard({ fine, onPay, paying }: { fine: Fine; onPay: (id: number) => void; paying: boolean }) {
  const isPending = fine.status === "pendiente";
  const isOverdue = isPending && new Date(fine.dueDate + "T23:59:59") < new Date();
  const statusColor = isPending ? (isOverdue ? COLORS.danger : COLORS.gold) : COLORS.success;
  const statusLabel = isPending ? (isOverdue ? "Vencida" : "Pendiente") : "Pagada";
  const statusIcon = isPending ? (isOverdue ? "alert-circle" : "clock-outline") : "check-circle";
  const formattedDue = fine.dueDate
    ? new Date(fine.dueDate + "T00:00:00").toLocaleDateString("es-AR", {
        day: "2-digit", month: "short", year: "numeric",
      })
    : "—";

  return (
    <View style={styles.card}>
      <View style={[styles.sideline, { backgroundColor: statusColor }]} />
      <View style={styles.cardBody}>

        <View style={styles.topRow}>
          <View style={styles.productWrap}>
            <MaterialCommunityIcons name="gavel" size={14} color={COLORS.muted} />
            <Text style={styles.productName} numberOfLines={1}>{fine.productName}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: statusColor + "22" }]}>
            <MaterialCommunityIcons name={statusIcon as any} size={12} color={statusColor} />
            <Text style={[styles.badgeText, { color: statusColor }]}>{statusLabel}</Text>
          </View>
        </View>

        <Text style={styles.fineAmount}>
          Multa: <Text style={{ color: COLORS.danger }}>${Number(fine.amount).toLocaleString("es-AR")}</Text>
        </Text>
        <Text style={styles.bidAmount}>
          Oferta original: ${Number(fine.bidAmount).toLocaleString("es-AR")}
        </Text>

        <View style={styles.bottomRow}>
          <View style={styles.dueDateWrap}>
            <MaterialCommunityIcons name="calendar-clock" size={13} color={isOverdue ? COLORS.danger : COLORS.muted} />
            <Text style={[styles.dueText, isOverdue && { color: COLORS.danger }]}>
              Vencimiento: {formattedDue}
            </Text>
          </View>
          <Pressable onPress={() => router.push({ pathname: "/auction/[id]", params: { id: fine.auctionId } })}>
            <Text style={styles.linkText}>Ver subasta</Text>
          </Pressable>
        </View>

        {isPending && (
          <Pressable
            style={({ pressed }) => [styles.payBtn, pressed && { opacity: 0.75 }, paying && styles.payBtnDisabled]}
            onPress={() => onPay(fine.id)}
            disabled={paying}
          >
            {paying ? (
              <ActivityIndicator size="small" color={COLORS.background} />
            ) : (
              <>
                <MaterialCommunityIcons name="cash" size={16} color={COLORS.background} />
                <Text style={styles.payBtnText}>Pagar multa</Text>
              </>
            )}
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", gap: SPACING.md, padding: SPACING.xl },
  mutedText: { color: COLORS.muted, textAlign: "center", fontSize: 15 },
  retryBtn: { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.gold },
  retryText: { color: COLORS.gold, fontWeight: "600" },
  list: { paddingBottom: 80 },

  bannerWrap: { flexDirection: "row", gap: SPACING.sm, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md },
  bannerCard: { flex: 1, backgroundColor: COLORS.surface, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.md, alignItems: "center", gap: 4 },
  bannerValue: { fontSize: 22, fontWeight: "800" },
  bannerLabel: { color: COLORS.muted, fontSize: 12 },

  card: { flexDirection: "row", backgroundColor: COLORS.surface, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, marginHorizontal: SPACING.lg, marginBottom: SPACING.sm, overflow: "hidden" },
  sideline: { width: 4 },
  cardBody: { flex: 1, padding: SPACING.md, gap: SPACING.xs },

  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  productWrap: { flexDirection: "row", alignItems: "center", gap: 5, flex: 1 },
  productName: { color: COLORS.text, fontSize: 14, fontWeight: "700", flex: 1 },
  badge: { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 11, fontWeight: "700" },

  fineAmount: { color: COLORS.text, fontSize: 15, fontWeight: "700", marginTop: 4 },
  bidAmount: { color: COLORS.muted, fontSize: 12 },

  bottomRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4 },
  dueDateWrap: { flexDirection: "row", alignItems: "center", gap: 4 },
  dueText: { color: COLORS.muted, fontSize: 12 },
  linkText: { color: COLORS.gold, fontSize: 12, fontWeight: "600" },

  payBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: COLORS.gold, borderRadius: RADIUS.sm, paddingVertical: 10, marginTop: SPACING.sm },
  payBtnDisabled: { opacity: 0.5 },
  payBtnText: { color: COLORS.background, fontWeight: "700", fontSize: 14 },

  emptyWrap: { alignItems: "center", gap: SPACING.md, paddingVertical: SPACING.xl, paddingHorizontal: SPACING.xl },
});