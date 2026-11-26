import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { COLORS, RADIUS, SPACING } from "../../src/constants/theme";
import {
  Auction,
  getAuctionByIdApi,
  getAuctionCoverUrl,
} from "../../src/services/auctionService";
import { getAuctionPhase } from "../../src/utils/auction";

const CATEGORY_LABEL: Record<string, string> = {
  comun: "Común", especial: "Especial", plata: "Plata", oro: "Oro", platino: "Platino",
};

export default function AuctionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [auction, setAuction] = useState<Auction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [coverError, setCoverError] = useState(false);

  useEffect(() => {
    if (!id) return;
    getAuctionByIdApi(Number(id))
  .then((data) => {
    setAuction(data);
  })
  .catch((err) =>
    setError(err?.message ?? "No se pudo cargar la subasta.")
  )
  .finally(() => setLoading(false));
  }, [id]);

  const phase = getAuctionPhase(auction);
  const isLive = phase === "live";
  const isUpcoming = phase === "upcoming";
  const closedLabel = phase === "unscheduled" ? "Horario pendiente" : "Cerrada";
  const categoryLabel = auction?.category ? CATEGORY_LABEL[auction.category] : null;
  const coverUrl =
  auction && !coverError
    ? getAuctionCoverUrl(auction.id)
    : null;
  const formattedTime = auction?.time ? auction.time.slice(0, 5) : "--:--";
  const formattedDate = auction?.date
    ? new Date(auction.date + "T00:00:00").toLocaleDateString("es-AR", {
        day: "2-digit", month: "long", year: "numeric",
      })
    : "A confirmar";

  const goCatalog = () => {
  if (!auction) return;

  router.push({
    pathname: "/auction/catalog/[id]",
    params: { id: auction.id.toString() },
  });
};

const joinAuction = () => {
  if (!auction) return;

  router.push({
    pathname: "/auction/live/[id]",
    params: { id: auction.id.toString() },
  });
};

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.navbar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.text} />
        </Pressable>
        <Text style={styles.navTitle}>AUCTION DETAIL</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.gold} />
        </View>
      ) : error || !auction ? (
        <View style={styles.centered}>
          <MaterialCommunityIcons name="alert-circle-outline" size={48} color={COLORS.danger} />
          <Text style={styles.mutedText}>{error ?? "Subasta no encontrada."}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Hero */}
          <View style={styles.heroPlaceholder}>
  {coverUrl ? (
    <>
      <Image
        source={{ uri: coverUrl }}
        style={styles.heroImage}
        resizeMode="cover"
        onError={() => setCoverError(true)}
      />
      <View style={styles.heroOverlay} />
    </>
  ) : (
    <MaterialCommunityIcons
      name="gavel"
      size={72}
      color={COLORS.border}
    />
  )}
</View>

          {/* Categoría badge */}
          {categoryLabel && (
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>{categoryLabel.toUpperCase()}</Text>
            </View>
          )}

          {/* Título */}
          <View style={styles.titleBlock}>
            <Text style={styles.auctionTitle}>
              {auction.location ?? `Subasta #${auction.id}`}
            </Text>
            {auction.location && (
              <Text style={styles.auctionSubtitle}>
                Subasta en {auction.location}
              </Text>
            )}
          </View>

          {/* Stats: items (tappable) + hora */}
          <View style={styles.statsRow}>
            <Pressable style={styles.statCard} onPress={goCatalog}>
              <MaterialCommunityIcons name="package-variant-closed" size={22} color={COLORS.gold} />
              <Text style={styles.statValue}>{auction.totalItems}</Text>
              <Text style={styles.statLabel}>ITEM COUNT</Text>
              <MaterialCommunityIcons
                name="chevron-right" size={14} color={COLORS.muted}
                style={styles.statChevron}
              />
            </Pressable>

            <View style={styles.statCard}>
              <MaterialCommunityIcons name="clock-outline" size={22} color={COLORS.gold} />
              <Text style={styles.statValue}>{formattedTime}</Text>
              <Text style={styles.statLabel}>START TIME</Text>
            </View>
          </View>

          {/* Info card */}
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="calendar" size={18} color={COLORS.muted} />
              <Text style={styles.infoLabel}>Fecha</Text>
              <Text style={styles.infoValue}>{formattedDate}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="lightning-bolt" size={18} color={COLORS.muted} />
              <Text style={styles.infoLabel}>Estado</Text>
              <View style={[styles.statusPill,
  isLive
    ? styles.pillLive
    : isUpcoming
      ? styles.pillUpcoming
      : styles.pillClosed
]}>
  <Text
    style={[
      styles.statusPillText,
      isLive
        ? styles.pillTextLive
        : isUpcoming
          ? styles.pillTextUpcoming
          : styles.pillTextClosed
    ]}
  >
    {isLive
      ? "En vivo"
      : isUpcoming
        ? "Próxima"
        : closedLabel}
  </Text>
</View>
            </View>
            {auction.capacity != null && (
              <>
                <View style={styles.divider} />
                <View style={styles.infoRow}>
                  <MaterialCommunityIcons name="account-group-outline" size={18} color={COLORS.muted} />
                  <Text style={styles.infoLabel}>Capacidad</Text>
                  <Text style={styles.infoValue}>{auction.capacity} personas</Text>
                </View>
              </>
            )}
            {categoryLabel && (
              <>
                <View style={styles.divider} />
                <View style={styles.infoRow}>
                  <MaterialCommunityIcons name="gavel" size={18} color={COLORS.muted} />
                  <Text style={styles.infoLabel}>Requiere para pujar</Text>
                  <Text style={styles.infoValue}>{categoryLabel} o superior</Text>
                </View>
              </>
            )}
          </View>

          {/* Rematador */}
          {auction.auctioneerName && (
            <View style={styles.auctioneerSection}>
              <Text style={styles.auctioneerLabel}>LEAD AUCTIONEER</Text>
              <Text style={styles.auctioneerName}>{auction.auctioneerName}</Text>
              {auction.privateSecurity && (
                <View style={styles.auctioneerBadge}>
                  <MaterialCommunityIcons name="shield-check-outline" size={16} color={COLORS.gold} />
                  <Text style={styles.auctioneerBadgeText}>Seguridad propia</Text>
                </View>
              )}
            </View>
          )}

          {/* CTA */}
  <Pressable
  style={(isLive || isUpcoming) ? styles.joinBtn : styles.closedBtn}
  onPress={joinAuction}
  disabled={!isLive}
>
  {isLive && (
    <MaterialCommunityIcons
      name="broadcast"
      size={20}
      color="#000"
    />
  )}

  {isUpcoming && (
    <MaterialCommunityIcons
      name="clock-outline"
      size={20}
      color="#000"
    />
  )}

  <Text
    style={(isLive || isUpcoming)
      ? styles.joinBtnText
      : styles.closedBtnText}
  >
    {isLive
      ? "Unirse a subasta"
      : isUpcoming
        ? "Subasta próxima"
        : phase === "unscheduled" ? closedLabel : "Subasta finalizada"}
  </Text>

  <MaterialCommunityIcons
    name="chevron-right"
    size={20}
    color={(isLive || isUpcoming)
      ? "#000"
      : COLORS.muted}
  />
</Pressable>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  navbar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm },
  backBtn: { padding: SPACING.sm },
  navTitle: { color: COLORS.gold, fontSize: 13, fontWeight: "700", letterSpacing: 1.5 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", gap: SPACING.md },
  mutedText: { color: COLORS.muted, textAlign: "center" },
  content: { paddingBottom: 60 },

  heroPlaceholder: { height: 220, backgroundColor: COLORS.surface, justifyContent: "center", alignItems: "center", marginHorizontal: SPACING.lg, borderRadius: RADIUS.lg, marginBottom: SPACING.md },

  categoryBadge: { alignSelf: "flex-start", marginHorizontal: SPACING.lg, backgroundColor: COLORS.gold, borderRadius: RADIUS.sm, paddingHorizontal: SPACING.sm, paddingVertical: 4, marginBottom: SPACING.sm },
  categoryBadgeText: { color: "#000", fontSize: 11, fontWeight: "800", letterSpacing: 1 },

  titleBlock: { paddingHorizontal: SPACING.lg, marginBottom: SPACING.lg },
  auctionTitle: { color: COLORS.text, fontSize: 28, fontWeight: "800", lineHeight: 34 },
  auctionSubtitle: { color: COLORS.muted, fontSize: 14, marginTop: 6 },

  statsRow: { flexDirection: "row", gap: SPACING.md, paddingHorizontal: SPACING.lg, marginBottom: SPACING.md },
  statCard: { flex: 1, backgroundColor: COLORS.surface, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.md, gap: 4 },
  statValue: { color: COLORS.text, fontSize: 22, fontWeight: "800" },
  statLabel: { color: COLORS.muted, fontSize: 10, fontWeight: "600", letterSpacing: 0.8 },
  statChevron: { position: "absolute", top: SPACING.sm, right: SPACING.sm },

  infoCard: { marginHorizontal: SPACING.lg, backgroundColor: COLORS.surface, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.md, overflow: "hidden" },
  infoRow: { flexDirection: "row", alignItems: "center", gap: SPACING.sm, padding: SPACING.md },
  infoLabel: { color: COLORS.muted, fontSize: 14, flex: 1 },
  infoValue: { color: COLORS.text, fontSize: 14, fontWeight: "600" },
  divider: { height: 1, backgroundColor: COLORS.border },

  statusPill: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  pillLive: { backgroundColor: "rgba(34,197,94,0.15)" },
  pillClosed: { backgroundColor: COLORS.border },
  statusPillText: { fontSize: 12, fontWeight: "700" },
  pillTextLive: { color: COLORS.success },
  pillTextClosed: { color: COLORS.muted },

  auctioneerSection: { marginHorizontal: SPACING.lg, marginBottom: SPACING.md, borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: SPACING.md },
  auctioneerLabel: { color: COLORS.muted, fontSize: 11, fontWeight: "700", letterSpacing: 1, marginBottom: 6 },
  auctioneerName: { color: COLORS.text, fontSize: 20, fontWeight: "700" },
  auctioneerBadge: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8 },
  auctioneerBadgeText: { color: COLORS.muted, fontSize: 13 },

  joinBtn: { marginHorizontal: SPACING.lg, backgroundColor: COLORS.gold, borderRadius: RADIUS.lg, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: SPACING.sm, padding: 16, marginTop: SPACING.sm },
  joinBtnText: { color: "#000", fontWeight: "800", fontSize: 16 },
  closedBtn: { marginHorizontal: SPACING.lg, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.lg, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: SPACING.sm, padding: 16, marginTop: SPACING.sm },
  closedBtnText: { color: COLORS.muted, fontWeight: "600", fontSize: 16 },

  pillUpcoming: {
  backgroundColor: "rgba(245,158,11,0.15)",
},

pillTextUpcoming: {
  color: "#F59E0B",
},

heroImage: {
  position: "absolute",
  width: "100%",
  height: "100%",
},

heroOverlay: {
  position: "absolute",
  width: "100%",
  height: "100%",
  backgroundColor: "rgba(0,0,0,0.25)",
},
});
