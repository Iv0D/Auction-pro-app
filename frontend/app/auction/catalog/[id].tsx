import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator, FlatList, Image, Pressable,
  SafeAreaView, StyleSheet, Text, View,
} from "react-native";

import { COLORS, RADIUS, SPACING } from "../../../src/constants/theme";
import { useAuth } from "../../../src/context/AuthContext";
import {
  Auction,
  CatalogItem,
  getAuctionByIdApi,
  getAuctionCatalogApi,
  getItemPhotoUrl,
  getAuctionCoverUrl,
} from "../../../src/services/auctionService";

export default function CatalogScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const isLoggedIn = !!user;

  const [auction, setAuction] = useState<Auction | null>(null);
  const [items, setItems]     = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    Promise.all([getAuctionByIdApi(Number(id)), getAuctionCatalogApi(Number(id))])
      .then(([a, c]) => { setAuction(a); setItems(c); })
      .catch((err) => setError(err?.message ?? "No se pudo cargar el catálogo."))
      .finally(() => setLoading(false));
  }, [id]);

  const isLive = (() => {
  if (
    !auction ||
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
})();;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.navbar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.text} />
        </Pressable>
        <Text style={styles.navTitle} numberOfLines={1}>Catálogo</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.centered}><ActivityIndicator size="large" color={COLORS.gold} /></View>
      ) : error ? (
        <View style={styles.centered}>
          <MaterialCommunityIcons name="alert-circle-outline" size={48} color={COLORS.danger} />
          <Text style={styles.mutedText}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <Header auction={auction} itemCount={items.length} isLive={isLive} isLoggedIn={isLoggedIn} />
          }
          renderItem={({ item }) => <CatalogCard item={item} isLoggedIn={isLoggedIn} />}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <MaterialCommunityIcons name="package-variant" size={48} color={COLORS.border} />
              <Text style={styles.mutedText}>No hay ítems en este catálogo aún.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

function Header({ auction, itemCount, isLive, isLoggedIn }: {
  auction: Auction | null; itemCount: number; isLive: boolean; isLoggedIn: boolean;
}) {

  const coverUrl = auction
    ? getAuctionCoverUrl(auction.id)
    : null;

  const [imgError, setImgError] = useState(false);

  return (
    <View style={styles.headerWrap}>
      <View style={styles.heroPlaceholder}>

        {coverUrl && !imgError ? (
          <>
            <Image
              source={{ uri: coverUrl }}
              style={styles.heroImage}
              resizeMode="cover"
              onError={() => setImgError(true)}
            />
            <View style={styles.heroOverlay} />
          </>
        ) : (
          <MaterialCommunityIcons
            name="gavel"
            size={56}
            color={COLORS.border}
          />
        )}

        {isLive && (
          <View style={styles.livePill}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>EN VIVO</Text>
          </View>
        )}
      </View>
      <Text style={styles.auctionTitle}>{auction?.location ?? `Subasta #${auction?.id}`}</Text>
      <View style={styles.metaRow}>
        {isLive && (
          <View style={styles.metaChip}>
            <MaterialCommunityIcons name="clock-outline" size={13} color={COLORS.muted} />
            <Text style={styles.metaChipText}>En vivo</Text>
          </View>
        )}
        <View style={styles.metaChip}>
          <MaterialCommunityIcons name="package-variant-closed" size={13} color={COLORS.muted} />
          <Text style={styles.metaChipText}>{itemCount} ítems</Text>
        </View>
      </View>
      {!isLoggedIn && (
        <Pressable style={styles.priceBanner} onPress={() => router.push("/(auth)/login")}>
          <MaterialCommunityIcons name="lock-outline" size={16} color={COLORS.gold} />
          <Text style={styles.priceBannerText}>Iniciá sesión para ver los precios base</Text>
          <MaterialCommunityIcons name="chevron-right" size={16} color={COLORS.gold} />
        </Pressable>
      )}
      <Text style={styles.sectionTitle}>Ítems del catálogo</Text>
    </View>
  );
}

function CatalogCard({ item, isLoggedIn }: { item: CatalogItem; isLoggedIn: boolean }) {
  const isAuctioned = item.auctioned === "si";
  const photoUrl = getItemPhotoUrl(item.id);
  const [imgError, setImgError] = useState(false);

  return (
    <Pressable
      style={({ pressed }) => [styles.itemCard, isAuctioned && styles.itemCardAuctioned, pressed && { opacity: 0.75 }]}
      onPress={() => router.push({ pathname: "/auction/item/[itemId]", params: { itemId: item.id } } as any)}
    >
      {/* Imagen */}
      <View style={styles.itemImageWrap}>
        {!imgError ? (
          <Image
            source={{ uri: photoUrl }}
            style={styles.itemImage}
            resizeMode="cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <MaterialCommunityIcons
            name={item.productType === "art" ? "palette-outline" : "cube-outline"}
            size={36} color={COLORS.muted}
          />
        )}
        {isAuctioned && (
          <View style={styles.auctionedBadge}>
            <Text style={styles.auctionedText}>VENDIDO</Text>
          </View>
        )}
      </View>

      {/* Info */}
      <View style={styles.itemInfo}>
        <Text style={styles.itemName} numberOfLines={2}>{item.productName}</Text>
        {item.productBrand && <Text style={styles.itemBrand} numberOfLines={1}>{item.productBrand}</Text>}
        {item.productDescription && <Text style={styles.itemDesc} numberOfLines={2}>{item.productDescription}</Text>}

        <View style={styles.priceBlock}>
          <Text style={styles.priceLabel}>Precio base</Text>
          {isLoggedIn ? (
            item.basePrice != null
              ? <Text style={styles.priceValue}>${Number(item.basePrice).toLocaleString("es-AR")}</Text>
              : <Text style={styles.priceMuted}>—</Text>
          ) : (
            <View style={styles.priceLocked}>
              <MaterialCommunityIcons name="lock-outline" size={12} color={COLORS.muted} />
              <Text style={styles.priceMuted}>Ver precio</Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  navbar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm },
  backBtn: { padding: SPACING.sm },
  navTitle: { color: COLORS.text, fontSize: 17, fontWeight: "700", flex: 1, textAlign: "center" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", gap: SPACING.md },
  mutedText: { color: COLORS.muted, textAlign: "center", fontSize: 15 },
  list: { paddingBottom: 80 },
  row: { paddingHorizontal: SPACING.lg, gap: SPACING.md, marginBottom: SPACING.md },

  headerWrap: { paddingBottom: SPACING.md },
  heroPlaceholder: { height: 200, backgroundColor: COLORS.surface, justifyContent: "center", alignItems: "center", marginBottom: SPACING.md },
  livePill: { position: "absolute", top: SPACING.sm, right: SPACING.sm, flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: COLORS.danger, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#fff" },
  liveText: { color: "#fff", fontSize: 11, fontWeight: "800" },
  auctionTitle: { color: COLORS.text, fontSize: 22, fontWeight: "800", paddingHorizontal: SPACING.lg, marginBottom: SPACING.sm },
  metaRow: { flexDirection: "row", gap: SPACING.sm, paddingHorizontal: SPACING.lg, marginBottom: SPACING.md },
  metaChip: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: COLORS.surface, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: COLORS.border },
  metaChipText: { color: COLORS.muted, fontSize: 12 },
  priceBanner: { flexDirection: "row", alignItems: "center", gap: SPACING.sm, marginHorizontal: SPACING.lg, marginBottom: SPACING.md, backgroundColor: "rgba(244,197,66,0.08)", borderWidth: 1, borderColor: "rgba(244,197,66,0.25)", borderRadius: RADIUS.sm, padding: SPACING.sm },
  priceBannerText: { color: COLORS.gold, fontSize: 13, flex: 1 },
  sectionTitle: { color: COLORS.text, fontSize: 17, fontWeight: "700", paddingHorizontal: SPACING.lg, marginBottom: SPACING.sm },

  itemCard: { flex: 1, backgroundColor: COLORS.surface, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, overflow: "hidden" },
  itemCardAuctioned: { opacity: 0.55 },
  itemImageWrap: { height: 120, backgroundColor: "#1A1A1A", justifyContent: "center", alignItems: "center" },
  itemImage: { position: "absolute", width: "100%", height: "100%" },
  auctionedBadge: { position: "absolute", top: 6, left: 6, backgroundColor: "rgba(0,0,0,0.7)", borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  auctionedText: { color: "#fff", fontSize: 9, fontWeight: "800" },
  itemInfo: { padding: SPACING.sm, gap: 4 },
  itemName: { color: COLORS.text, fontSize: 13, fontWeight: "700" },
  itemBrand: { color: COLORS.muted, fontSize: 11 },
  itemDesc: { color: COLORS.muted, fontSize: 11, lineHeight: 16 },
  priceBlock: { marginTop: 6, gap: 2 },
  priceLabel: { color: COLORS.muted, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.5 },
  priceValue: { color: COLORS.gold, fontSize: 14, fontWeight: "800" },
  priceMuted: { color: COLORS.muted, fontSize: 11 },
  priceLocked: { flexDirection: "row", alignItems: "center", gap: 3 },
  emptyWrap: { alignItems: "center", gap: SPACING.md, paddingTop: SPACING.xl },
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
