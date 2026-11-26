import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { COLORS, RADIUS, SPACING } from "../../src/constants/theme";
import { BidHistory, BidMetrics, getBidHistoryApi, getBidMetricsApi } from "../../src/services/bidService";

export default function HistoryScreen() {
  const [history, setHistory] = useState<BidHistory[]>([]);
  const [metrics, setMetrics] = useState<BidMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const [h, m] = await Promise.all([getBidHistoryApi(), getBidMetricsApi()]);
      setHistory(h);
      setMetrics(m);
    } catch (err: any) {
      setError(err?.message ?? "No se pudo cargar el historial.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Historial de pujas</Text>
        {!loading && metrics && (
          <Text style={styles.subtitle}>
            {metrics.totalBids} puja{metrics.totalBids !== 1 ? "s" : ""} en total
          </Text>
        )}
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.gold} />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <MaterialCommunityIcons name="alert-circle-outline" size={48} color={COLORS.danger} />
          <Text style={styles.mutedText}>{error}</Text>
          <Pressable onPress={fetchData} style={styles.retryBtn}>
            <Text style={styles.retryText}>Reintentar</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => item.bidId.toString()}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchData(); }}
              tintColor={COLORS.gold}
            />
          }
          ListHeaderComponent={
            metrics ? <MetricsPanel metrics={metrics} /> : null
          }
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <MaterialCommunityIcons name="gavel" size={56} color={COLORS.border} />
              <Text style={styles.mutedText}>Todavía no participaste en ninguna subasta.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <BidCard bid={item} />
          )}
        />
      )}
    </SafeAreaView>
  );
}

// ─── Panel de métricas ────────────────────────────────────────────────────────

function MetricsPanel({ metrics }: { metrics: BidMetrics }) {
  const fmt = (n: number) =>
    "$" + n.toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  return (
    <View style={styles.metricsWrap}>
      {/* Fila 1: asistidas / ganadas / perdidas */}
      <View style={styles.metricsRow}>
        <MetricCard
          icon="gavel"
          label="Participadas"
          value={metrics.auctionsAttended.toString()}
          color={COLORS.gold}
        />
        <MetricCard
          icon="trophy-outline"
          label="Ganadas"
          value={metrics.auctionsWon.toString()}
          color={COLORS.success}
        />
        <MetricCard
          icon="close-circle-outline"
          label="Perdidas"
          value={metrics.auctionsLost.toString()}
          color={COLORS.danger}
        />
      </View>

      {/* Fila 2: importes */}
      <View style={styles.metricsRow}>
        <MetricCard
          icon="cash-multiple"
          label="Total ofertado"
          value={fmt(metrics.totalBid)}
          color={COLORS.muted}
          wide
        />
        <MetricCard
          icon="cash-check"
          label="Total pagado"
          value={fmt(metrics.totalSpent)}
          color={COLORS.gold}
          wide
        />
      </View>

      <Text style={styles.sectionLabel}>Detalle de pujas</Text>
    </View>
  );
}

function MetricCard({
  icon, label, value, color, wide,
}: {
  icon: string; label: string; value: string; color: string; wide?: boolean;
}) {
  return (
    <View style={[styles.metricCard, wide && styles.metricCardWide]}>
      <MaterialCommunityIcons name={icon as any} size={20} color={color} />
      <Text style={[styles.metricValue, { color }]}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

// ─── Card de puja ─────────────────────────────────────────────────────────────

function BidCard({ bid }: { bid: BidHistory }) {
  const won = bid.winner === true;
  const lost = bid.winner === false;
  const pending = bid.winner === null;

  const formattedDate = bid.auctionDate
    ? new Date(bid.auctionDate + "T00:00:00").toLocaleDateString("es-AR", {
        day: "2-digit", month: "short", year: "numeric",
      })
    : "Fecha desconocida";

  const resultColor = won ? COLORS.success : lost ? COLORS.danger : COLORS.muted;
  const resultIcon = won ? "trophy" : lost ? "close-circle" : "clock-outline";
  const resultLabel = won ? "Ganada" : lost ? "Perdida" : "En curso";

  return (
    <Pressable
      style={({ pressed }) => [styles.bidCard, pressed && { opacity: 0.75 }]}
      onPress={() =>
        router.push({ pathname: "/auction/[id]", params: { id: bid.auctionId } })
      }
    >
      {/* Línea de color lateral */}
      <View style={[styles.bidSideline, { backgroundColor: resultColor }]} />

      <View style={styles.bidContent}>
        {/* Fila superior: nombre + resultado */}
        <View style={styles.bidTopRow}>
          <View style={styles.bidNameWrap}>
            <MaterialCommunityIcons
              name={bid.productType === "art" ? "palette-outline" : "cube-outline"}
              size={15}
              color={COLORS.muted}
            />
            <Text style={styles.bidProductName} numberOfLines={1}>
              {bid.productName}
            </Text>
          </View>
          <View style={[styles.resultPill, { backgroundColor: resultColor + "22" }]}>
            <MaterialCommunityIcons name={resultIcon as any} size={13} color={resultColor} />
            <Text style={[styles.resultText, { color: resultColor }]}>{resultLabel}</Text>
          </View>
        </View>

        {/* Marca si hay */}
        {bid.productBrand && (
          <Text style={styles.bidBrand}>{bid.productBrand}</Text>
        )}

        {/* Fila inferior: subasta + monto */}
        <View style={styles.bidBottomRow}>
          <View style={styles.bidAuctionInfo}>
            <MaterialCommunityIcons name="calendar-outline" size={13} color={COLORS.muted} />
            <Text style={styles.bidAuctionText}>{formattedDate}</Text>
            {bid.auctionLocation && (
              <>
                <Text style={styles.bidDot}>·</Text>
                <Text style={styles.bidAuctionText} numberOfLines={1}>
                  {bid.auctionLocation}
                </Text>
              </>
            )}
          </View>
          <Text style={[styles.bidAmount, won && styles.bidAmountWon]}>
            ${Number(bid.amount).toLocaleString("es-AR")}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.sm,
  },
  title: { color: COLORS.text, fontSize: 24, fontWeight: "800" },
  subtitle: { color: COLORS.muted, fontSize: 13, marginTop: 4 },

  centered: { flex: 1, justifyContent: "center", alignItems: "center", gap: SPACING.md, padding: SPACING.xl },
  mutedText: { color: COLORS.muted, textAlign: "center", fontSize: 15 },
  retryBtn: { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.gold },
  retryText: { color: COLORS.gold, fontWeight: "600" },

  list: { paddingBottom: 80 },

  // Métricas
  metricsWrap: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.sm },
  metricsRow: { flexDirection: "row", gap: SPACING.sm, marginBottom: SPACING.sm },
  metricCard: {
    flex: 1, backgroundColor: COLORS.surface, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.border,
    padding: SPACING.md, alignItems: "center", gap: 4,
  },
  metricCardWide: { flex: 1 },
  metricValue: { fontSize: 18, fontWeight: "800" },
  metricLabel: { color: COLORS.muted, fontSize: 11, textAlign: "center" },
  sectionLabel: {
    color: COLORS.muted, fontSize: 12, fontWeight: "700",
    textTransform: "uppercase", letterSpacing: 1,
    marginTop: SPACING.sm, marginBottom: SPACING.sm,
  },

  // Bid card
  bidCard: {
    flexDirection: "row",
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
    overflow: "hidden",
  },
  bidSideline: { width: 4 },
  bidContent: { flex: 1, padding: SPACING.md, gap: SPACING.xs },

  bidTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  bidNameWrap: { flexDirection: "row", alignItems: "center", gap: 6, flex: 1 },
  bidProductName: { color: COLORS.text, fontSize: 14, fontWeight: "700", flex: 1 },
  bidBrand: { color: COLORS.muted, fontSize: 12 },

  resultPill: { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  resultText: { fontSize: 11, fontWeight: "700" },

  bidBottomRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4 },
  bidAuctionInfo: { flexDirection: "row", alignItems: "center", gap: 4, flex: 1 },
  bidAuctionText: { color: COLORS.muted, fontSize: 12, flexShrink: 1 },
  bidDot: { color: COLORS.border, fontSize: 12 },

  bidAmount: { color: COLORS.text, fontSize: 15, fontWeight: "800" },
  bidAmountWon: { color: COLORS.gold },

  emptyWrap: { alignItems: "center", gap: SPACING.md, paddingVertical: SPACING.xl, paddingHorizontal: SPACING.xl },
});
