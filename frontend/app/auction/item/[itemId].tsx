import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator, Dimensions, FlatList, Image,
  Pressable, SafeAreaView, ScrollView,
  StyleSheet, Text, View,
} from "react-native";

import { COLORS, RADIUS, SPACING } from "../../../src/constants/theme";
import { useAuth } from "../../../src/context/AuthContext";
import {
  CatalogItemDetail,
  getCatalogItemDetailApi,
  getItemPhotoIdsApi,
  getPhotoUrl,
} from "../../../src/services/auctionService";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function ItemDetailScreen() {
  const { itemId } = useLocalSearchParams<{ itemId: string }>();
  const { user } = useAuth();
  const isLoggedIn = !!user;

  const [item, setItem]           = useState<CatalogItemDetail | null>(null);
  const [photoIds, setPhotoIds]   = useState<number[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [activePhoto, setActivePhoto] = useState(0);

  useEffect(() => {
    if (!itemId) return;
    Promise.all([
      getCatalogItemDetailApi(Number(itemId)),
      getItemPhotoIdsApi(Number(itemId)),
    ])
      .then(([detail, ids]) => { setItem(detail); setPhotoIds(ids); })
      .catch((err) => setError(err?.message ?? "No se pudo cargar el ítem."))
      .finally(() => setLoading(false));
  }, [itemId]);

  if (loading) return (
    <View style={styles.centered}><ActivityIndicator size="large" color={COLORS.gold} /></View>
  );

  if (error || !item) return (
    <SafeAreaView style={styles.container}>
      <View style={styles.centered}>
        <MaterialCommunityIcons name="alert-circle-outline" size={48} color={COLORS.danger} />
        <Text style={styles.mutedText}>{error ?? "Ítem no encontrado."}</Text>
        <Pressable onPress={() => router.back()} style={styles.backPill}>
          <Text style={styles.backPillText}>Volver</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );

  const isAuctioned = item.auctioned === "si";
const isArt = item.productType === "art";

const isLive = (() => {
  if (item.auctionStatus !== "abierta") return false;
  if (!item.auctionDate || !item.auctionTime) return false;

  const now = new Date();

  const auctionDateTime = new Date(
    `${item.auctionDate}T${item.auctionTime}`
  );

  return auctionDateTime <= now;
})();
  const formattedAuctionDate = item.auctionDate
    ? new Date(item.auctionDate + "T00:00:00").toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" })
    : null;
  const formattedAuctionTime = item.auctionTime ? item.auctionTime.slice(0, 5) + " hs" : null;

  return (
    <SafeAreaView style={styles.container}>
      {/* Navbar */}
      <View style={styles.navbar}>
        <Pressable onPress={() => router.back()} style={styles.navBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.text} />
        </Pressable>
        <Text style={styles.navTitle} numberOfLines={1}>{item.productName}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Galería de fotos ─────────────────────────────────────────── */}
        {photoIds.length > 0 ? (
          <View>
            <FlatList
              data={photoIds}
              keyExtractor={(id) => id.toString()}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={(e) => {
                const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
                setActivePhoto(idx);
              }}
              scrollEventThrottle={16}
              renderItem={({ item: photoId }) => (
                <View style={styles.gallerySlide}>
                  <Image
                    source={{ uri: getPhotoUrl(photoId) }}
                    style={styles.galleryImage}
                    resizeMode="cover"
                  />
                </View>
              )}
            />
            {/* Indicadores */}
            {photoIds.length > 1 && (
              <View style={styles.dotsWrap}>
                {photoIds.map((_, i) => (
                  <View key={i} style={[styles.dot, i === activePhoto && styles.dotActive]} />
                ))}
              </View>
            )}
            {/* Contador */}
            <View style={styles.photoCounter}>
              <MaterialCommunityIcons name="image-outline" size={12} color="#fff" />
              <Text style={styles.photoCounterText}>{activePhoto + 1}/{photoIds.length}</Text>
            </View>
            {/* Badges sobre la galería */}
            {isAuctioned && (
              <View style={styles.soldBanner}>
                <MaterialCommunityIcons name="gavel" size={14} color="#fff" />
                <Text style={styles.soldBannerText}>VENDIDO</Text>
              </View>
            )}
            {!isAuctioned && isLive && (
              <View style={styles.liveBanner}>
                <View style={styles.liveDot} />
                <Text style={styles.liveBannerText}>EN VIVO</Text>
              </View>
            )}
          </View>
        ) : (
          // Sin fotos: placeholder
          <View style={styles.heroPlaceholder}>
            <MaterialCommunityIcons
              name={isArt ? "palette-outline" : "cube-outline"} size={80} color={COLORS.border} />
            {isAuctioned && (
              <View style={styles.soldBanner}>
                <MaterialCommunityIcons name="gavel" size={14} color="#fff" />
                <Text style={styles.soldBannerText}>VENDIDO</Text>
              </View>
            )}
            {!isAuctioned && isLive && (
              <View style={styles.liveBanner}>
                <View style={styles.liveDot} />
                <Text style={styles.liveBannerText}>EN VIVO</Text>
              </View>
            )}
          </View>
        )}

        {/* ── Tipo badge ───────────────────────────────────────────────── */}
        <View style={styles.typeBadgeWrap}>
          <View style={[styles.typeBadge, isArt ? styles.typeBadgeArt : styles.typeBadgeNormal]}>
            <MaterialCommunityIcons
              name={isArt ? "palette-outline" : "cube-outline"} size={12}
              color={isArt ? "#E879F9" : "#60A5FA"} />
            <Text style={[styles.typeBadgeText, isArt ? styles.typeBadgeTextArt : styles.typeBadgeTextNormal]}>
              {isArt ? "Obra de arte" : "Producto"}
            </Text>
          </View>
        </View>

        {/* ── Nombre y marca ───────────────────────────────────────────── */}
        <View style={styles.titleBlock}>
          <Text style={styles.productName}>{item.productName}</Text>
          {item.productBrand && <Text style={styles.productBrand}>{item.productBrand}</Text>}
        </View>

        {/* ── Precio ───────────────────────────────────────────────────── */}
        {isLoggedIn && item.basePrice != null ? (
  <View style={styles.priceCard}>
    <PriceRow
      label="Precio base"
      bold
      goldValue
      value={`$${Number(item.basePrice).toLocaleString("es-AR")}`}
    />
  </View>
) : !isLoggedIn ? (
          <Pressable style={styles.loginBanner} onPress={() => router.push("/(auth)/login")}>
            <MaterialCommunityIcons name="lock-outline" size={18} color={COLORS.gold} />
            <View style={styles.loginBannerText}>
              <Text style={styles.loginBannerTitle}>Precio no disponible</Text>
              <Text style={styles.loginBannerSub}>Iniciá sesión para ver el precio base y pujar</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={18} color={COLORS.gold} />
          </Pressable>
        ) : null}

        {/* ── Descripción ──────────────────────────────────────────────── */}
        {item.catalogDescription && (
          <InfoSection title="Descripción">
            <Text style={styles.descText}>{item.catalogDescription}</Text>
          </InfoSection>
        )}
        {item.fullDescription && item.fullDescription !== item.catalogDescription && (
          <InfoSection title="Descripción completa">
            <Text style={styles.descText}>{item.fullDescription}</Text>
          </InfoSection>
        )}

        {/* ── Historia (solo arte) ─────────────────────────────────────── */}
        {isArt && item.history && (
          <InfoSection title="Historia y procedencia">
            <Text style={styles.descText}>{item.history}</Text>
          </InfoSection>
        )}

        {/* ── Detalles ─────────────────────────────────────────────────── */}
        <InfoSection title="Detalles">
          <View style={styles.detailsCard}>
            {item.quantity != null && item.quantity > 1 && (
              <DetailRow icon="layers-outline" label="Cantidad" value={item.quantity.toString()} />
            )}
            {item.productDate && (
              <DetailRow icon="calendar-outline" label="Fecha de ingreso"
                value={new Date(item.productDate + "T00:00:00").toLocaleDateString("es-AR")} />
            )}
            <DetailRow
              icon={isArt ? "palette-outline" : "cube-outline"}
              label="Tipo" value={isArt ? "Obra de arte / Producto diseñado" : "Producto normal"}
            />
          </View>
        </InfoSection>

        {/* ── Subasta ──────────────────────────────────────────────────── */}
        <InfoSection title="Subasta">
          <View style={styles.detailsCard}>
            {item.auctionLocation && (
              <DetailRow icon="map-marker-outline" label="Ubicación" value={item.auctionLocation} />
            )}
            {formattedAuctionDate && (
              <DetailRow icon="calendar" label="Fecha" value={formattedAuctionDate} />
            )}
            {formattedAuctionTime && (
              <DetailRow icon="clock-outline" label="Hora" value={formattedAuctionTime} />
            )}
            {item.auctioneerName && (
              <DetailRow icon="account-tie-outline" label="Rematador" value={item.auctioneerName} />
            )}
            <DetailRow
              icon="lightning-bolt" label="Estado"
              value={isLive ? "En vivo" : isAuctioned ? "Vendido" : "Cerrada"}
              valueColor={isLive ? COLORS.success : undefined}
            />
          </View>
        </InfoSection>

        {/* ── CTA ─────────────────────────────────────────────────────── */}
        {isLive && !isAuctioned && (
          <Pressable
            style={styles.ctaBtn}
            onPress={() => router.push({ pathname: "/auction/[id]", params: { id: item.auctionId } })}
          >
            <MaterialCommunityIcons name="gavel" size={20} color="#000" />
            <Text style={styles.ctaBtnText}>
              {isLoggedIn ? "Ir a la subasta" : "Ver subasta"}
            </Text>
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function InfoSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.infoSection}>
      <Text style={styles.infoSectionTitle}>{title.toUpperCase()}</Text>
      {children}
    </View>
  );
}

function PriceRow({ label, value, bold, goldValue }: {
  label: string; value: string; bold?: boolean; goldValue?: boolean;
}) {
  return (
    <View style={styles.priceRow}>
      <Text style={styles.priceRowLabel}>{label}</Text>
      <Text style={[styles.priceRowValue, bold && { fontWeight: "800" }, goldValue && { color: COLORS.gold }]}>
        {value}
      </Text>
    </View>
  );
}

function DetailRow({ icon, label, value, valueColor }: {
  icon: string; label: string; value: string; valueColor?: string;
}) {
  return (
    <View style={styles.detailRow}>
      <MaterialCommunityIcons name={icon as any} size={16} color={COLORS.muted} style={{ width: 20 }} />
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={[styles.detailValue, valueColor ? { color: valueColor } : {}]} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", gap: SPACING.md },
  mutedText: { color: COLORS.muted, textAlign: "center", fontSize: 15 },
  backPill: { borderWidth: 1, borderColor: COLORS.gold, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, borderRadius: RADIUS.md },
  backPillText: { color: COLORS.gold, fontWeight: "600" },

  navbar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: "#111" },
  navBtn: { padding: 6, width: 40 },
  navTitle: { color: COLORS.text, fontSize: 16, fontWeight: "700", flex: 1, textAlign: "center" },

  scroll: { paddingBottom: 80 },

  // Galería
  gallerySlide: { width: SCREEN_WIDTH, height: 260, backgroundColor: "#0D0D0D" },
  galleryImage: { width: "100%", height: "100%" },
  heroPlaceholder: { height: 260, backgroundColor: "#0D0D0D", justifyContent: "center", alignItems: "center" },
  dotsWrap: { flexDirection: "row", justifyContent: "center", gap: 6, marginTop: 10 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#333" },
  dotActive: { backgroundColor: COLORS.gold, width: 18 },
  photoCounter: { position: "absolute", top: 12, right: 12, flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(0,0,0,0.6)", borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4 },
  photoCounterText: { color: "#fff", fontSize: 11, fontWeight: "600" },

  soldBanner: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "rgba(0,0,0,0.75)", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 8 },
  soldBannerText: { color: "#fff", fontSize: 13, fontWeight: "800", letterSpacing: 1 },
  liveBanner: { position: "absolute", top: SPACING.md, right: SPACING.md, flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: COLORS.danger, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#fff" },
  liveBannerText: { color: "#fff", fontSize: 11, fontWeight: "800" },

  typeBadgeWrap: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.md },
  typeBadge: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 5, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  typeBadgeArt: { backgroundColor: "rgba(232,121,249,0.15)" },
  typeBadgeNormal: { backgroundColor: "rgba(96,165,250,0.15)" },
  typeBadgeText: { fontSize: 12, fontWeight: "600" },
  typeBadgeTextArt: { color: "#E879F9" },
  typeBadgeTextNormal: { color: "#60A5FA" },

  titleBlock: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.sm, paddingBottom: SPACING.md },
  productName: { color: COLORS.text, fontSize: 26, fontWeight: "800", lineHeight: 32 },
  productBrand: { color: COLORS.muted, fontSize: 15, marginTop: 4 },

  priceCard: { marginHorizontal: SPACING.lg, backgroundColor: COLORS.surface, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, overflow: "hidden", marginBottom: SPACING.md },
  priceRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: SPACING.md, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#1A1A1A" },
  priceRowLabel: { color: COLORS.muted, fontSize: 14 },
  priceRowValue: { color: COLORS.text, fontSize: 14, fontWeight: "600" },

  loginBanner: { marginHorizontal: SPACING.lg, marginBottom: SPACING.md, flexDirection: "row", alignItems: "center", gap: SPACING.md, backgroundColor: "rgba(244,197,66,0.07)", borderWidth: 1, borderColor: "rgba(244,197,66,0.2)", borderRadius: RADIUS.md, padding: SPACING.md },
  loginBannerText: { flex: 1 },
  loginBannerTitle: { color: COLORS.text, fontSize: 14, fontWeight: "700" },
  loginBannerSub: { color: COLORS.muted, fontSize: 12, marginTop: 2 },

  descText: { color: COLORS.muted, fontSize: 14, lineHeight: 22 },
  infoSection: { paddingHorizontal: SPACING.lg, marginBottom: SPACING.lg },
  infoSectionTitle: { color: COLORS.muted, fontSize: 11, fontWeight: "700", letterSpacing: 1.5, marginBottom: SPACING.sm },

  detailsCard: { backgroundColor: COLORS.surface, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, overflow: "hidden" },
  detailRow: { flexDirection: "row", alignItems: "center", gap: SPACING.sm, paddingHorizontal: SPACING.md, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#111" },
  detailLabel: { color: COLORS.muted, fontSize: 13, flex: 1 },
  detailValue: { color: COLORS.text, fontSize: 13, fontWeight: "600", flex: 1, textAlign: "right" },

  ctaBtn: { marginHorizontal: SPACING.lg, backgroundColor: COLORS.gold, borderRadius: RADIUS.lg, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: SPACING.sm, padding: 16 },
  ctaBtnText: { color: "#000", fontSize: 16, fontWeight: "800" },
});
