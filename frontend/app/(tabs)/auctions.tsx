import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator, FlatList, Image, Pressable,
  RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View,
} from "react-native";

import { COLORS, RADIUS, SPACING } from "../../src/constants/theme";
import { Auction, getAuctionCoverUrl, getAuctionsApi } from "../../src/services/auctionService";
import { isAuctionLive, isAuctionUpcoming } from "../../src/utils/auction";

const CATEGORY_LABEL: Record<string, string> = {
  comun: "Común", especial: "Especial", plata: "Plata", oro: "Oro", platino: "Platino",
};

type CategoryFilter = "todas" | "comun" | "especial" | "plata" | "oro" | "platino";
type VisualStatusFilter = "todas" | "proximas" | "en-vivo";

const CATEGORY_FILTERS: { value: CategoryFilter; label: string }[] = [
  { value: "todas", label: "Todas" },
  { value: "comun", label: "Común" },
  { value: "especial", label: "Especial" },
  { value: "plata", label: "Plata" },
  { value: "oro", label: "Oro" },
  { value: "platino", label: "Platino" },
];

const VISUAL_STATUS_FILTERS: { value: VisualStatusFilter; label: string }[] = [
  { value: "todas", label: "Todas" },
  { value: "proximas", label: "Próximas" },
  { value: "en-vivo", label: "En Vivo" },
];

const normalizeText = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

export default function AuctionsScreen() {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [search, setSearch]     = useState("");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("todas");
  const [visualStatusFilter, setVisualStatusFilter] = useState<VisualStatusFilter>("todas");

  const fetchAuctions = useCallback(async () => {
    try { setError(null); setAuctions(await getAuctionsApi()); }
    catch (err: any) { setError(err?.message ?? "No se pudieron cargar las subastas."); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

const visibleAuctions = auctions.filter((auction) =>
  isAuctionUpcoming(auction) || isAuctionLive(auction)
);

  const searchedAuctions = visibleAuctions.filter((auction) => {
    const query = normalizeText(search.trim());
    const matchesCategory =
      categoryFilter === "todas" || auction.category === categoryFilter;

    const matchesVisualStatus =
      visualStatusFilter === "todas" ||
      (visualStatusFilter === "proximas" && isAuctionUpcoming(auction)) ||
      (visualStatusFilter === "en-vivo" && isAuctionLive(auction));

    if (!matchesCategory || !matchesVisualStatus) return false;

    if (!query) return true;

    const categoryLabel = auction.category
      ? CATEGORY_LABEL[auction.category] ?? auction.category
      : "";

    const searchableText = [
      auction.location,
      auction.auctioneerName,
      auction.category,
      categoryLabel,
    ]
      .filter(Boolean)
      .join(" ");

    return normalizeText(searchableText).includes(query);
  });

  useEffect(() => { fetchAuctions(); }, [fetchAuctions]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Subastas</Text>
        {!loading && (
      <Text style={styles.count}>
    {searchedAuctions.length} disponible{searchedAuctions.length !== 1 ? "s" : ""}
  </Text>
)}
      </View>

      {!loading && !error && auctions.length > 0 && (
        <>
          <View style={styles.searchWrap}>
            <MaterialCommunityIcons name="magnify" size={20} color={COLORS.muted} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Buscar por ubicación, rematador o categoría"
              placeholderTextColor={COLORS.muted}
              style={styles.searchInput}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {search.length > 0 && (
              <Pressable onPress={() => setSearch("")} hitSlop={8}>
                <MaterialCommunityIcons name="close-circle" size={18} color={COLORS.muted} />
              </Pressable>
            )}
          </View>

          <View style={styles.filtersBlock}>
            <Text style={styles.filterLabel}>Categoría</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
              {CATEGORY_FILTERS.map((filter) => {
                const active = categoryFilter === filter.value;

                return (
                  <Pressable
                    key={filter.value}
                    style={[styles.filterChip, active && styles.filterChipActive]}
                    onPress={() => setCategoryFilter(filter.value)}
                  >
                    <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                      {filter.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <Text style={styles.filterLabel}>Estado</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
              {VISUAL_STATUS_FILTERS.map((filter) => {
                const active = visualStatusFilter === filter.value;

                return (
                  <Pressable
                    key={filter.value}
                    style={[styles.filterChip, active && styles.filterChipActive]}
                    onPress={() => setVisualStatusFilter(filter.value)}
                  >
                    <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                      {filter.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </>
      )}

      {loading ? (
        <View style={styles.centered}><ActivityIndicator size="large" color={COLORS.gold} /></View>
      ) : error ? (
        <View style={styles.centered}>
          <MaterialCommunityIcons name="alert-circle-outline" size={48} color={COLORS.danger} />
          <Text style={styles.mutedText}>{error}</Text>
          <Pressable onPress={fetchAuctions} style={styles.retryBtn}>
            <Text style={styles.retryText}>Reintentar</Text>
          </Pressable>
        </View>
      ) : auctions.length === 0 ? (
        <View style={styles.centered}>
          <MaterialCommunityIcons name="gavel" size={48} color={COLORS.border} />
          <Text style={styles.mutedText}>No hay subastas disponibles por ahora.</Text>
        </View>
      ) : (
        <FlatList
          data={searchedAuctions}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.searchEmpty}>
              <MaterialCommunityIcons name="magnify-close" size={44} color={COLORS.border} />
              <Text style={styles.mutedText}>No se encontraron subastas.</Text>
            </View>
          }
          renderItem={({ item }) => <AuctionCard auction={item} />}
          refreshControl={
            <RefreshControl refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchAuctions(); }}
              tintColor={COLORS.gold} />
          }
        />
      )}
    </SafeAreaView>
  );
}

function AuctionCard({ auction }: { auction: Auction }) {
  const isLive = isAuctionLive(auction);
  const formattedDate = auction.date
    ? new Date(auction.date + "T00:00:00").toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" })
    : "Fecha a confirmar";
  const formattedTime = auction.time ? auction.time.slice(0, 5) + " hs" : "";
  const categoryLabel = auction.category ? CATEGORY_LABEL[auction.category] : null;
  const coverUrl = getAuctionCoverUrl(auction.id);

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.75 }]}
      onPress={() => router.push({ pathname: "/auction/[id]", params: { id: auction.id } })}
    >
      <View style={styles.cardHero}>
        <Image source={{ uri: coverUrl }} style={styles.coverImage} resizeMode="cover" />
        <View style={styles.coverOverlay} />
        {isLive && (
          <View style={styles.livePill}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>EN VIVO</Text>
          </View>
        )}
        {categoryLabel && (
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText}>{categoryLabel.toUpperCase()}</Text>
          </View>
        )}
        <Text style={styles.heroTime}>
          {isLive ? "En curso" : formattedTime ? `Comienza ${formattedTime}` : formattedDate}
        </Text>
      </View>
      <View style={styles.cardBody}>
        <View style={styles.cardBodyLeft}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {auction.location ?? `Subasta #${auction.id}`}
          </Text>
          <Text style={styles.cardSub} numberOfLines={1}>
            {auction.auctioneerName
              ? `Rematador: ${auction.auctioneerName}`
              : `${auction.totalItems} ítem${auction.totalItems !== 1 ? "s" : ""} · ${formattedDate}`}
          </Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.muted} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: SPACING.lg, paddingTop: SPACING.lg, paddingBottom: SPACING.md },
  title: { color: COLORS.text, fontSize: 24, fontWeight: "800" },
  count: { color: COLORS.muted, fontSize: 13 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", gap: SPACING.md, padding: SPACING.xl },
  mutedText: { color: COLORS.muted, textAlign: "center", fontSize: 15 },
  retryBtn: { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.gold },
  retryText: { color: COLORS.gold, fontWeight: "600" },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
  },
  searchInput: { flex: 1, color: COLORS.text, fontSize: 14, paddingVertical: 4, outlineStyle: "none" as any },
  searchEmpty: { alignItems: "center", gap: SPACING.md, paddingVertical: SPACING.xl },
  filtersBlock: { marginBottom: SPACING.sm },
  filterLabel: { color: COLORS.muted, fontSize: 12, fontWeight: "700", marginHorizontal: SPACING.lg, marginBottom: SPACING.xs },
  filterRow: { gap: SPACING.sm, paddingHorizontal: SPACING.lg, paddingBottom: SPACING.sm },
  filterChip: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.md,
    paddingVertical: 7,
  },
  filterChipActive: { backgroundColor: COLORS.gold, borderColor: COLORS.gold },
  filterChipText: { color: COLORS.muted, fontSize: 13, fontWeight: "700" },
  filterChipTextActive: { color: "#000" },
  list: { padding: SPACING.lg, gap: SPACING.md, paddingBottom: 80 },
  card: { backgroundColor: COLORS.surface, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, overflow: "hidden" },
  cardHero: { height: 160, backgroundColor: "#111", justifyContent: "center", alignItems: "center", position: "relative" },
  coverImage: { position: "absolute", width: "100%", height: "100%" },
  coverOverlay: { position: "absolute", width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.3)" },
  livePill: { position: "absolute", top: SPACING.sm, left: SPACING.sm, flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: COLORS.danger, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#fff" },
  liveText: { color: "#fff", fontSize: 11, fontWeight: "800" },
  categoryBadge: { position: "absolute", top: SPACING.sm, right: SPACING.sm, backgroundColor: COLORS.gold, borderRadius: RADIUS.sm, paddingHorizontal: 8, paddingVertical: 3 },
  categoryBadgeText: { color: "#000", fontSize: 10, fontWeight: "800" },
  heroTime: { position: "absolute", bottom: SPACING.sm, right: SPACING.sm, color: "#fff", fontSize: 12, fontWeight: "600", backgroundColor: "rgba(0,0,0,0.6)", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  cardBody: { flexDirection: "row", alignItems: "center", padding: SPACING.md, gap: SPACING.sm },
  cardBodyLeft: { flex: 1 },
  cardTitle: { color: COLORS.text, fontSize: 16, fontWeight: "700" },
  cardSub: { color: COLORS.muted, fontSize: 13, marginTop: 2 },
});
