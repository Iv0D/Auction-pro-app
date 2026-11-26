import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator, Image, Pressable, RefreshControl,
  SafeAreaView, ScrollView, StyleSheet, Text, View,
} from "react-native";

import { COLORS, RADIUS, SPACING } from "../../src/constants/theme";
import { useAuth } from "../../src/context/AuthContext";
import { Auction, getAuctionCoverUrl, getAuctionsApi } from "../../src/services/auctionService";

const CATEGORY_LABEL: Record<string, string> = {
  comun: "Común", especial: "Especial", plata: "Plata", oro: "Oro", platino: "Platino",
};
const CATEGORY_COLOR: Record<string, string> = {
  comun: "#9CA3AF", especial: "#60A5FA", plata: "#CBD5E1", oro: "#F4C542", platino: "#E879F9",
};

export default function HomeScreen() {
  const { user } = useAuth();
  const [auctions, setAuctions]   = useState<Auction[]>([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAuctions = useCallback(async () => {
    try { setAuctions(await getAuctionsApi()); }
    catch { /* silencioso */ }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchAuctions(); }, [fetchAuctions]);

  const isAuctionLive = (auction: Auction) => {
  if (
    auction.status !== "abierta" ||
    !auction.date ||
    !auction.time
  ) {
    return false;
  }

  const now = new Date();
  const start = new Date(`${auction.date}T${auction.time}`);

  return (
    now.toDateString() === start.toDateString() &&
    now >= start
  );
};

const isUpcomingAuction = (auction: Auction) => {
  if (!auction.date || !auction.time) return false;

  const now = new Date();
  const start = new Date(`${auction.date}T${auction.time}`);

  return start > now;
};

  const live = auctions.filter(isAuctionLive);

const upcoming = auctions.filter(
  (a) => !isAuctionLive(a) && isUpcomingAuction(a)
);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchAuctions(); }}
            tintColor={COLORS.gold} />
        }
      >
        {/* Header */}
        <View style={styles.topBar}>
          <View style={styles.logoRow}>
            <MaterialCommunityIcons name="gavel" size={20} color={COLORS.gold} />
            <Text style={styles.logoText}>AUCTIONPRO</Text>
          </View>
          {user ? (
            <View style={styles.topBarRight}>
              <Pressable style={styles.iconBtn} onPress={() => router.push("/notifications" as any)}>
                <MaterialCommunityIcons name="bell-outline" size={22} color={COLORS.text} />
              </Pressable>
              <Pressable style={styles.avatarSmall} onPress={() => router.push("/(tabs)/profile")}>
                <Text style={styles.avatarSmallText}>{user.name?.charAt(0).toUpperCase() ?? "U"}</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable style={styles.loginBtn} onPress={() => router.push("/(auth)/login")}>
              <Text style={styles.loginBtnText}>Iniciar sesión</Text>
            </Pressable>
          )}
        </View>

        {/* Hero text */}
        <View style={styles.heroText}>
          <Text style={styles.heroEyebrow}>EXCELENCIA CURADA</Text>
          <Text style={styles.heroTitle}>Colecciones{"\n"}<Text style={styles.heroTitleGold}>en Vivo</Text></Text>
        </View>

        {loading ? (
          <View style={styles.loadingWrap}><ActivityIndicator color={COLORS.gold} /></View>
        ) : (
          <>
            {/* Subastas en vivo */}
            {live.length > 0 && (
              <View style={styles.section}>
                <View style={styles.livePill}>
                  <View style={styles.liveDot} />
                  <Text style={styles.livePillText}>EN VIVO</Text>
                </View>
                {live.map((a) => <HeroAuctionCard key={a.id} auction={a} />)}
              </View>
            )}

            {/* Próximas */}
            {upcoming.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionTitle}>Próximas subastas</Text>
                  <Pressable onPress={() => router.push("/(tabs)/auctions")}>
                    <Text style={styles.sectionLink}>Ver todas</Text>
                  </Pressable>
                </View>
                {upcoming.map((a) => <UpcomingAuctionCard key={a.id} auction={a} />)}
              </View>
            )}

            {auctions.length === 0 && (
              <View style={styles.emptyWrap}>
                <MaterialCommunityIcons name="gavel" size={56} color={COLORS.border} />
                <Text style={styles.emptyTitle}>Sin subastas por ahora</Text>
                <Text style={styles.emptyText}>Volvé pronto para ver las próximas colecciones.</Text>
              </View>
            )}
          </>
        )}

        <View style={{ height: 80 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function HeroAuctionCard({ auction }: { auction: Auction }) {
  const catColor = auction.category ? CATEGORY_COLOR[auction.category] : COLORS.muted;
  const catLabel = auction.category ? CATEGORY_LABEL[auction.category] : null;
  const formattedTime = auction.time ? auction.time.slice(0, 5) + " hs" : "";
  const coverUrl = getAuctionCoverUrl(auction.id);

  return (
    <Pressable
      style={({ pressed }) => [styles.heroCard, pressed && { opacity: 0.85 }]}
      onPress={() => router.push({ pathname: "/auction/[id]", params: { id: auction.id } })}
    >
      <View style={styles.heroCardImage}>
        <Image source={{ uri: coverUrl }} style={styles.coverImage} resizeMode="cover" />
        <View style={styles.coverOverlay} />
        {catLabel && (
          <View style={[styles.heroCategoryBadge, { backgroundColor: catColor }]}>
            <Text style={styles.heroCategoryText}>{catLabel.toUpperCase()}</Text>
          </View>
        )}
        {formattedTime && (
          <View style={styles.heroTimeBadge}>
            <Text style={styles.heroTimeText}>{formattedTime}</Text>
          </View>
        )}
      </View>
      <View style={styles.heroCardFooter}>
        <View style={styles.heroCardInfo}>
          <Text style={styles.heroCardTitle} numberOfLines={1}>
            {auction.location ?? `Subasta #${auction.id}`}
          </Text>
          <Text style={styles.heroCardSub}>
            {auction.auctioneerName
              ? `Rematador · ${auction.auctioneerName}`
              : `${auction.totalItems} ítem${auction.totalItems !== 1 ? "s" : ""}`}
          </Text>
        </View>
        <View style={styles.heroChevron}>
          <MaterialCommunityIcons name="chevron-right" size={18} color="#000" />
        </View>
      </View>
    </Pressable>
  );
}

function UpcomingAuctionCard({ auction }: { auction: Auction }) {
  const catColor = auction.category ? CATEGORY_COLOR[auction.category] : COLORS.muted;
  const catLabel = auction.category ? CATEGORY_LABEL[auction.category] : null;
  const formattedDate = auction.date
    ? new Date(auction.date + "T00:00:00").toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" })
    : "";
  const formattedTime = auction.time ? auction.time.slice(0, 5) + " hs" : "";
  const coverUrl = getAuctionCoverUrl(auction.id);

  return (
    <Pressable
      style={({ pressed }) => [styles.upcomingCard, pressed && { opacity: 0.75 }]}
      onPress={() => router.push({ pathname: "/auction/[id]", params: { id: auction.id } })}
    >
      <View style={styles.upcomingImage}>
        <Image source={{ uri: coverUrl }} style={styles.coverImageSmall} resizeMode="cover" />
        {catLabel && <View style={[styles.upcomingCategoryDot, { backgroundColor: catColor }]} />}
      </View>
      <View style={styles.upcomingInfo}>
        {catLabel && <Text style={[styles.upcomingCategory, { color: catColor }]}>{catLabel.toUpperCase()}</Text>}
        <Text style={styles.upcomingTitle} numberOfLines={1}>
          {auction.location ?? `Subasta #${auction.id}`}
        </Text>
        <Text style={styles.upcomingSub}>
          {auction.auctioneerName
            ? `Rematador · ${auction.auctioneerName}`
            : `${auction.totalItems} ítem${auction.totalItems !== 1 ? "s" : ""}`}
        </Text>
      </View>
      <View style={styles.upcomingDate}>
        <Text style={styles.upcomingDateText}>{formattedDate}</Text>
        {formattedTime && <Text style={styles.upcomingTimeText}>{formattedTime}</Text>}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  topBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: SPACING.lg, paddingTop: SPACING.md, paddingBottom: SPACING.sm },
  logoRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  logoText: { color: COLORS.gold, fontSize: 16, fontWeight: "900", letterSpacing: 1.5 },
  topBarRight: { flexDirection: "row", alignItems: "center", gap: SPACING.sm },
  iconBtn: { padding: 6 },
  avatarSmall: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.gold + "22", borderWidth: 1.5, borderColor: COLORS.gold, justifyContent: "center", alignItems: "center" },
  avatarSmallText: { color: COLORS.gold, fontSize: 13, fontWeight: "800" },
  loginBtn: { borderWidth: 1, borderColor: COLORS.gold, paddingHorizontal: SPACING.md, paddingVertical: 6, borderRadius: 20 },
  loginBtnText: { color: COLORS.gold, fontSize: 13, fontWeight: "700" },
  heroText: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.sm, paddingBottom: SPACING.lg },
  heroEyebrow: { color: COLORS.muted, fontSize: 11, fontWeight: "700", letterSpacing: 2, marginBottom: 4 },
  heroTitle: { color: COLORS.text, fontSize: 36, fontWeight: "900", lineHeight: 42 },
  heroTitleGold: { color: COLORS.gold },
  section: { paddingHorizontal: SPACING.lg, gap: SPACING.md, marginBottom: SPACING.lg },
  sectionHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sectionTitle: { color: COLORS.text, fontSize: 18, fontWeight: "800" },
  sectionLink: { color: COLORS.gold, fontSize: 13, fontWeight: "600" },
  livePill: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", backgroundColor: "rgba(239,68,68,0.15)", borderWidth: 1, borderColor: "rgba(239,68,68,0.3)", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: COLORS.danger },
  livePillText: { color: COLORS.danger, fontSize: 12, fontWeight: "800" },
  loadingWrap: { height: 200, justifyContent: "center", alignItems: "center" },

  // Hero card
  heroCard: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, overflow: "hidden" },
  heroCardImage: { height: 200, backgroundColor: "#0A0A0A", justifyContent: "center", alignItems: "center" },
  coverImage: { position: "absolute", width: "100%", height: "100%" },
  coverOverlay: { position: "absolute", width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.25)" },
  coverImageSmall: { position: "absolute", width: "100%", height: "100%" },
  heroCategoryBadge: { position: "absolute", top: SPACING.md, left: SPACING.md, borderRadius: RADIUS.sm, paddingHorizontal: 10, paddingVertical: 4 },
  heroCategoryText: { color: "#000", fontSize: 11, fontWeight: "800", letterSpacing: 0.5 },
  heroTimeBadge: { position: "absolute", bottom: SPACING.md, right: SPACING.md, backgroundColor: "rgba(0,0,0,0.7)", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  heroTimeText: { color: COLORS.text, fontSize: 12, fontWeight: "600" },
  heroCardFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: SPACING.md, gap: SPACING.sm },
  heroCardInfo: { flex: 1 },
  heroCardTitle: { color: COLORS.text, fontSize: 18, fontWeight: "800" },
  heroCardSub: { color: COLORS.muted, fontSize: 13, marginTop: 3 },
  heroChevron: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.gold, justifyContent: "center", alignItems: "center" },

  // Upcoming card
  upcomingCard: { flexDirection: "row", alignItems: "center", gap: SPACING.md, backgroundColor: COLORS.surface, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.sm, overflow: "hidden" },
  upcomingImage: { width: 72, height: 72, backgroundColor: "#0A0A0A", borderRadius: RADIUS.sm, overflow: "hidden", justifyContent: "center", alignItems: "center" },
  upcomingCategoryDot: { position: "absolute", top: 4, right: 4, width: 8, height: 8, borderRadius: 4 },
  upcomingInfo: { flex: 1, gap: 2 },
  upcomingCategory: { fontSize: 10, fontWeight: "700", letterSpacing: 0.8 },
  upcomingTitle: { color: COLORS.text, fontSize: 15, fontWeight: "700" },
  upcomingSub: { color: COLORS.muted, fontSize: 12 },
  upcomingDate: { alignItems: "flex-end", gap: 2 },
  upcomingDateText: { color: COLORS.muted, fontSize: 12 },
  upcomingTimeText: { color: COLORS.gold, fontSize: 12, fontWeight: "600" },

  emptyWrap: { alignItems: "center", gap: SPACING.md, paddingVertical: SPACING.xl, paddingHorizontal: SPACING.xl },
  emptyTitle: { color: COLORS.text, fontSize: 18, fontWeight: "700" },
  emptyText: { color: COLORS.muted, fontSize: 14, textAlign: "center" },
});
