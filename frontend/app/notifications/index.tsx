import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator, FlatList, Pressable,
  RefreshControl, SafeAreaView, StyleSheet, Text, View,
} from "react-native";

import { COLORS, SPACING } from "../../src/constants/theme";
import {
  Notification, getOthersApi, getRecentApi, markAsReadApi,
} from "../../src/services/notificationService";

// ─── Config por tipo ──────────────────────────────────────────────────────────
const TYPE_CONFIG: Record<string, { icon: string; color: string; label: string }> = {
  PRODUCT_APPROVED: { icon: "check-circle-outline",  color: "#F4C542", label: "Producto aprobado"   },
  PRODUCT_REJECTED: { icon: "close-circle-outline",  color: "#EF4444", label: "Producto rechazado"  },
  BID_OUTBID:       { icon: "trending-up",            color: "#EF4444", label: "Puja superada"       },
  AUCTION_STARTING: { icon: "alarm",                  color: "#F4C542", label: "Subasta por empezar" },
  PAYMENT_SUCCESS:  { icon: "check-decagram-outline", color: "#22C55E", label: "Pago confirmado"     },
  WATCHLIST_ALERT:  { icon: "star-outline",           color: "#60A5FA", label: "Artículo seguido"    },
};

// ─── Tiempo relativo ──────────────────────────────────────────────────────────
function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "ahora";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

type Tab = "recientes" | "otras";

export default function NotificationsScreen() {
  const [tab, setTab]             = useState<Tab>("recientes");
  const [recent, setRecent]       = useState<Notification[]>([]);
  const [others, setOthers]       = useState<Notification[]>([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [r, o] = await Promise.all([getRecentApi(), getOthersApi()]);
      setRecent(r);
      setOthers(o);
    } catch { /* silencioso */ }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const data = tab === "recientes" ? recent : others;
  const unread = [...recent, ...others].filter((n) => !n.read).length;

  const handlePress = async (n: Notification) => {
    if (!n.read) {
      await markAsReadApi(n.id).catch(() => {});
      const upd = (prev: Notification[]) =>
        prev.map((x) => x.id === n.id ? { ...x, read: true } : x);
      setRecent(upd);
      setOthers(upd);
    }
    router.push({ pathname: "/notifications/[id]", params: { id: n.id } } as any);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Notificaciones</Text>
        {unread > 0
          ? <View style={styles.unreadBadge}><Text style={styles.unreadBadgeText}>{unread}</Text></View>
          : <View style={{ width: 32 }} />
        }
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {(["recientes", "otras"] as Tab[]).map((t) => (
          <Pressable key={t} style={[styles.tab, tab === t && styles.tabActive]} onPress={() => setTab(t)}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <View style={styles.centered}><ActivityIndicator size="large" color={COLORS.gold} /></View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor={COLORS.gold} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <MaterialCommunityIcons name="bell-off-outline" size={52} color={COLORS.border} />
              <Text style={styles.emptyText}>Sin notificaciones por acá.</Text>
            </View>
          }
          renderItem={({ item }) => <NotifCard n={item} onPress={() => handlePress(item)} />}
        />
      )}
    </SafeAreaView>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────
function NotifCard({ n, onPress }: { n: Notification; onPress: () => void }) {
  const cfg = TYPE_CONFIG[n.type] ?? { icon: "bell-outline", color: COLORS.muted, label: "Aviso" };
  const isPending = n.type === "PRODUCT_APPROVED" && n.userResponse === "PENDING";

  return (
    <Pressable
      style={({ pressed }) => [styles.card, !n.read && styles.cardUnread, pressed && { opacity: 0.75 }]}
      onPress={onPress}
    >
      {/* Ícono */}
      <View style={[styles.iconCircle, { backgroundColor: cfg.color + "20" }]}>
        <MaterialCommunityIcons name={cfg.icon as any} size={24} color={cfg.color} />
        {!n.read && <View style={styles.unreadDot} />}
      </View>

      {/* Contenido */}
      <View style={styles.cardBody}>
        <View style={styles.cardTopRow}>
          <Text style={styles.cardTitle} numberOfLines={1}>{cfg.label}</Text>
          <View style={styles.cardTopRight}>
            {isPending && (
              <View style={styles.actionChip}>
                <Text style={styles.actionChipText}>
                  {n.minutesToStart ? `En ${n.minutesToStart}m` : "Acción"}
                </Text>
              </View>
            )}
            <Text style={styles.cardTime}>{timeAgo(n.createdAt)}</Text>
          </View>
        </View>
        <Text style={styles.cardMessage} numberOfLines={2}>{n.message}</Text>

        {/* Botones inline para AUCTION_STARTING */}
        {n.type === "AUCTION_STARTING" && n.auctionId && (
          <View style={styles.inlineButtons}>
            <Pressable style={styles.inlineBtnPrimary}
              onPress={() => router.push({ pathname: "/auction/[id]", params: { id: n.auctionId! } })}>
              <Text style={styles.inlineBtnPrimaryText}>Ver subasta</Text>
            </Pressable>
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: SPACING.lg, paddingTop: SPACING.lg, paddingBottom: SPACING.sm },
  backBtn: { padding: 4 },
  headerTitle: { color: COLORS.text, fontSize: 22, fontWeight: "800" },
  unreadBadge: { backgroundColor: COLORS.danger, borderRadius: 10, minWidth: 20, height: 20, justifyContent: "center", alignItems: "center", paddingHorizontal: 4 },
  unreadBadgeText: { color: "#fff", fontSize: 11, fontWeight: "800" },

  tabs: { flexDirection: "row", paddingHorizontal: SPACING.lg, gap: SPACING.sm, marginBottom: SPACING.sm },
  tab: { paddingHorizontal: SPACING.lg, paddingVertical: 8, borderRadius: 20, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
  tabActive: { backgroundColor: COLORS.text, borderColor: COLORS.text },
  tabText: { color: COLORS.muted, fontSize: 14, fontWeight: "600" },
  tabTextActive: { color: COLORS.background },

  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  list: { paddingHorizontal: SPACING.lg, paddingBottom: 80, gap: 2 },

  card: { flexDirection: "row", gap: SPACING.md, paddingVertical: SPACING.md, borderBottomWidth: 1, borderBottomColor: "#111" },
  cardUnread: { },
  iconCircle: { width: 48, height: 48, borderRadius: 24, justifyContent: "center", alignItems: "center", position: "relative", flexShrink: 0 },
  unreadDot: { position: "absolute", top: 2, right: 2, width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.gold, borderWidth: 2, borderColor: COLORS.background },
  cardBody: { flex: 1, gap: 4 },
  cardTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardTitle: { color: COLORS.text, fontSize: 15, fontWeight: "700", flex: 1 },
  cardTopRight: { flexDirection: "row", alignItems: "center", gap: SPACING.xs },
  cardTime: { color: COLORS.muted, fontSize: 12 },
  actionChip: { backgroundColor: COLORS.gold + "25", borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2 },
  actionChipText: { color: COLORS.gold, fontSize: 10, fontWeight: "800" },
  cardMessage: { color: COLORS.muted, fontSize: 13, lineHeight: 19 },

  inlineButtons: { flexDirection: "row", gap: SPACING.sm, marginTop: SPACING.xs },
  inlineBtnPrimary: { backgroundColor: COLORS.gold, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 },
  inlineBtnPrimaryText: { color: "#000", fontSize: 13, fontWeight: "700" },

  empty: { alignItems: "center", gap: SPACING.md, paddingVertical: 60 },
  emptyText: { color: COLORS.muted, fontSize: 15 },
});
