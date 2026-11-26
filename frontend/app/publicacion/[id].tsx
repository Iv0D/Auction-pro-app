import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Animated,
  FlatList,
} from "react-native";

import { COLORS, RADIUS, SPACING } from "../../src/constants/theme";
import {
  ProductDetailResponse,
  getProductDetailApi,
} from "../../src/services/publicacionService";

const { width: SW } = Dimensions.get("window");
const TABS = ["Producto", "Depósito & Seguro"];

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [product, setProduct] = useState<ProductDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const indicatorAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!id) return;
    getProductDetailApi(Number(id))
      .then(setProduct)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const goToTab = (idx: number) => {
    setActiveTab(idx);
    scrollRef.current?.scrollTo({ x: idx * SW, animated: true });
    Animated.spring(indicatorAnim, {
      toValue: idx,
      useNativeDriver: true,
      tension: 80,
      friction: 12,
    }).start();
  };

  const onScroll = (e: any) => {
    const x = e.nativeEvent.contentOffset.x;
    const idx = Math.round(x / SW);
    if (idx !== activeTab) setActiveTab(idx);
    // Animate indicator continuously while dragging
    Animated.spring(indicatorAnim, {
      toValue: x / SW,
      useNativeDriver: true,
      tension: 80,
      friction: 12,
    }).start();
  };

  if (loading) {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.centered}>
          <ActivityIndicator color={COLORS.gold} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (!product) {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.header}>
          <Pressable onPress={() => router.back()} style={s.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={22} color={COLORS.text} />
          </Pressable>
        </View>
        <View style={s.centered}>
          <MaterialCommunityIcons name="alert-circle-outline" size={48} color={COLORS.muted} />
          <Text style={s.mutedText}>Producto no encontrado</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isArt = product.type === "art";
  const isAvailable = product.available === "si";

  const tabW = SW / 2;
  const indicatorTranslate = indicatorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, tabW],
  });

  return (
    <SafeAreaView style={s.container}>
      {/* ── Header ── */}
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={COLORS.text} />
        </Pressable>
        <Text style={s.headerTitle} numberOfLines={1}>{product.name}</Text>
        <View style={[s.statusBadge, isAvailable ? s.statusOk : s.statusPending]}>
          <Text style={[s.statusText, isAvailable ? { color: COLORS.success } : { color: COLORS.gold }]}>
            {isAvailable ? "Aprobado" : "Pendiente"}
          </Text>
        </View>
      </View>

      {/* ── Tab Bar ── */}
      <View style={s.tabBar}>
        {TABS.map((t, i) => (
          <Pressable key={t} style={s.tabBtn} onPress={() => goToTab(i)}>
            <Text style={[s.tabLabel, activeTab === i && s.tabLabelActive]}>{t}</Text>
          </Pressable>
        ))}
        <Animated.View
          style={[s.tabIndicator, { width: tabW, transform: [{ translateX: indicatorTranslate }] }]}
        />
      </View>

      {/* ── Scrollable Pages ── */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScroll}
        scrollEventThrottle={16}
        style={{ flex: 1 }}
      >
        {/* ── PAGE 1: Detalle del producto ── */}
        <ScrollView style={{ width: SW }} contentContainerStyle={s.page} showsVerticalScrollIndicator={false}>
          {/* Galería de fotos */}
          {product.photosBase64.length > 0 ? (
            <PhotoGallery photos={product.photosBase64} />
          ) : (
            <View style={s.photoPlaceholder}>
              <MaterialCommunityIcons
                name={isArt ? "palette-outline" : "cube-outline"}
                size={56}
                color={COLORS.border}
              />
              <Text style={s.photoPlaceholderText}>Sin fotos</Text>
            </View>
          )}

          {/* Tipo badge */}
          <View style={s.typeBadgeRow}>
            <View style={[s.typeBadge, isArt ? s.typeBadgeArt : s.typeBadgeNormal]}>
              <MaterialCommunityIcons
                name={isArt ? "palette-outline" : "cube-outline"}
                size={12}
                color={isArt ? "#E879F9" : "#60A5FA"}
              />
              <Text style={[s.typeBadgeText, { color: isArt ? "#E879F9" : "#60A5FA" }]}>
                {isArt ? "Arte" : "Producto"}
              </Text>
            </View>
            {product.brand && (
              <Text style={s.brandText}>{product.brand}</Text>
            )}
          </View>

          {/* Info grid */}
          <View style={s.infoGrid}>
            {product.quantity != null && (
              <InfoRow icon="layers-outline" label="Cantidad" value={String(product.quantity)} />
            )}
            {product.date && (
              <InfoRow
                icon="calendar-outline"
                label="Fecha de ingreso"
                value={new Date(product.date + "T00:00:00").toLocaleDateString("es-AR", {
                  day: "2-digit", month: "long", year: "numeric",
                })}
              />
            )}
            {product.reviewerName && (
              <InfoRow icon="account-check-outline" label="Revisado por" value={product.reviewerName} />
            )}
          </View>

          {/* Descripción catálogo */}
          {product.catalogDescription && (
            <Section title="Descripción de catálogo">
              <Text style={s.bodyText}>{product.catalogDescription}</Text>
            </Section>
          )}

          {/* Descripción completa */}
          {product.fullDescription && product.fullDescription !== product.catalogDescription && (
            <Section title="Descripción completa">
              <Text style={s.bodyText}>{product.fullDescription}</Text>
            </Section>
          )}

          {/* Historia (solo arte) */}
          {isArt && product.history && (
            <Section title="Historia & proveniencia">
              <Text style={s.bodyText}>{product.history}</Text>
            </Section>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>

        {/* ── PAGE 2: Depósito & Seguro ── */}
        <ScrollView style={{ width: SW }} contentContainerStyle={s.page} showsVerticalScrollIndicator={false}>

          {/* DEPÓSITO */}
          <Section title="Depósito">
            {product.deposito ? (
              <View style={s.card}>
                <View style={s.cardIconRow}>
                  <View style={s.cardIconWrap}>
                    <MaterialCommunityIcons name="warehouse" size={22} color={COLORS.gold} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.cardTitle}>{product.deposito.nombre}</Text>
                    {product.deposito.ciudad && (
                      <Text style={s.cardSub}>{product.deposito.ciudad}{product.deposito.pais ? `, ${product.deposito.pais}` : ""}</Text>
                    )}
                  </View>
                </View>

                <View style={s.divider} />

                <View style={s.detailRows}>
                  <DetailRow icon="map-marker-outline" label="Dirección" value={product.deposito.direccion} />
                  {product.deposito.telefono && (
                    <DetailRow icon="phone-outline" label="Teléfono" value={product.deposito.telefono} />
                  )}
                  {product.deposito.responsable && (
                    <DetailRow icon="account-outline" label="Responsable" value={product.deposito.responsable} />
                  )}
                  {product.deposito.horario && (
                    <DetailRow icon="clock-outline" label="Horario" value={product.deposito.horario} />
                  )}
                </View>
              </View>
            ) : (
              <View style={s.emptyCard}>
                <MaterialCommunityIcons name="warehouse" size={32} color={COLORS.border} />
                <Text style={s.emptyCardText}>Sin depósito asignado</Text>
                <Text style={s.emptyCardSub}>El equipo de AuctionPro asignará un depósito una vez que el artículo sea procesado.</Text>
              </View>
            )}
          </Section>

          {/* SEGURO */}
          <Section title="Seguro">
            {product.insurance ? (
              <View style={s.card}>
                <View style={s.cardIconRow}>
                  <View style={[s.cardIconWrap, { backgroundColor: "#22C55E18" }]}>
                    <MaterialCommunityIcons name="shield-check-outline" size={22} color={COLORS.success} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.cardTitle}>{product.insurance.company}</Text>
                    <Text style={s.cardSub}>Póliza Nº {product.insurance.policyNumber}</Text>
                  </View>
                </View>

                <View style={s.divider} />

                <View style={s.detailRows}>
                  <DetailRow
                    icon="currency-usd"
                    label="Importe asegurado"
                    value={new Intl.NumberFormat("es-AR", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(product.insurance.amount)}
                  />
                  {product.insurance.combinedPolicy && (
                    <DetailRow
                      icon="file-document-outline"
                      label="Póliza combinada"
                      value={product.insurance.combinedPolicy === "si" ? "Sí" : "No"}
                    />
                  )}
                </View>
              </View>
            ) : (
              <View style={s.emptyCard}>
                <MaterialCommunityIcons name="shield-off-outline" size={32} color={COLORS.border} />
                <Text style={s.emptyCardText}>Sin seguro registrado</Text>
                <Text style={s.emptyCardSub}>El seguro se registra luego de la aceptación y el ingreso al depósito.</Text>
              </View>
            )}
          </Section>

          <View style={{ height: 40 }} />
        </ScrollView>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function PhotoGallery({ photos }: { photos: string[] }) {
  const [current, setCurrent] = useState(0);
  return (
    <View style={s.gallery}>
      <FlatList
        data={photos}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(_, i) => i.toString()}
        onMomentumScrollEnd={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / SW);
          setCurrent(idx);
        }}
        renderItem={({ item }) => (
          <Image source={{ uri: item }} style={s.galleryImage} resizeMode="cover" />
        )}
      />
      {photos.length > 1 && (
        <View style={s.galleryDots}>
          {photos.map((_, i) => (
            <View key={i} style={[s.dot, i === current && s.dotActive]} />
          ))}
        </View>
      )}
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={s.section}>
      <Text style={s.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function InfoRow({ icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <View style={s.infoRow}>
      <MaterialCommunityIcons name={icon} size={16} color={COLORS.muted} />
      <Text style={s.infoLabel}>{label}</Text>
      <Text style={s.infoValue}>{value}</Text>
    </View>
  );
}

function DetailRow({ icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <View style={s.detailRow}>
      <View style={s.detailLeft}>
        <MaterialCommunityIcons name={icon} size={15} color={COLORS.muted} />
        <Text style={s.detailLabel}>{label}</Text>
      </View>
      <Text style={s.detailValue}>{value}</Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", gap: SPACING.md },
  mutedText: { color: COLORS.muted, fontSize: 15 },

  header: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.md,
    borderBottomWidth: 1, borderBottomColor: COLORS.border, gap: SPACING.sm,
  },
  backBtn: { padding: 6, borderRadius: 20 },
  headerTitle: { flex: 1, color: COLORS.text, fontSize: 16, fontWeight: "800" },
  statusBadge: {
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1,
  },
  statusOk: { backgroundColor: `${COLORS.success}15`, borderColor: `${COLORS.success}40` },
  statusPending: { backgroundColor: `${COLORS.gold}12`, borderColor: `${COLORS.gold}40` },
  statusText: { fontSize: 11, fontWeight: "700" },

  // Tab bar
  tabBar: {
    flexDirection: "row", borderBottomWidth: 1, borderBottomColor: COLORS.border,
    position: "relative",
  },
  tabBtn: { flex: 1, paddingVertical: 14, alignItems: "center" },
  tabLabel: { color: COLORS.muted, fontSize: 13, fontWeight: "600" },
  tabLabelActive: { color: COLORS.text, fontWeight: "800" },
  tabIndicator: {
    position: "absolute", bottom: 0, height: 2,
    backgroundColor: COLORS.gold, borderRadius: 2,
  },

  // Pages
  page: { padding: SPACING.md, gap: SPACING.lg },

  // Gallery
  gallery: { borderRadius: RADIUS.md, overflow: "hidden", backgroundColor: COLORS.surfaceLight },
  galleryImage: { width: SW - SPACING.md * 2, height: 240 },
  galleryDots: {
    position: "absolute", bottom: 10, left: 0, right: 0,
    flexDirection: "row", justifyContent: "center", gap: 6,
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.4)" },
  dotActive: { backgroundColor: COLORS.gold, width: 18 },

  // Photo placeholder
  photoPlaceholder: {
    height: 180, backgroundColor: COLORS.surfaceLight, borderRadius: RADIUS.md,
    justifyContent: "center", alignItems: "center", gap: SPACING.sm,
    borderWidth: 1, borderColor: COLORS.border,
  },
  photoPlaceholderText: { color: COLORS.muted, fontSize: 13 },

  // Type badge
  typeBadgeRow: { flexDirection: "row", alignItems: "center", gap: SPACING.sm },
  typeBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
  },
  typeBadgeArt: { backgroundColor: "rgba(232,121,249,0.12)" },
  typeBadgeNormal: { backgroundColor: "rgba(96,165,250,0.12)" },
  typeBadgeText: { fontSize: 11, fontWeight: "700" },
  brandText: { color: COLORS.muted, fontSize: 13 },

  // Info grid
  infoGrid: {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.border, overflow: "hidden",
  },
  infoRow: {
    flexDirection: "row", alignItems: "center", gap: SPACING.sm,
    paddingHorizontal: SPACING.md, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  infoLabel: { color: COLORS.muted, fontSize: 13, flex: 1 },
  infoValue: { color: COLORS.text, fontSize: 13, fontWeight: "600", textAlign: "right", maxWidth: "50%" },

  // Sections
  section: { gap: SPACING.sm },
  sectionTitle: { color: COLORS.text, fontSize: 15, fontWeight: "800" },
  bodyText: { color: COLORS.muted, fontSize: 14, lineHeight: 22 },

  // Cards (depósito / seguro)
  card: {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.border, overflow: "hidden",
  },
  cardIconRow: {
    flexDirection: "row", alignItems: "center", gap: SPACING.md,
    padding: SPACING.md,
  },
  cardIconWrap: {
    width: 44, height: 44, borderRadius: RADIUS.sm,
    backgroundColor: `${COLORS.gold}15`,
    justifyContent: "center", alignItems: "center",
  },
  cardTitle: { color: COLORS.text, fontSize: 15, fontWeight: "700" },
  cardSub: { color: COLORS.muted, fontSize: 12, marginTop: 2 },
  divider: { height: 1, backgroundColor: COLORS.border },
  detailRows: { padding: SPACING.md, gap: 12 },
  detailRow: {
    flexDirection: "row", alignItems: "flex-start",
    justifyContent: "space-between", gap: SPACING.sm,
  },
  detailLeft: { flexDirection: "row", alignItems: "center", gap: 6, flex: 1 },
  detailLabel: { color: COLORS.muted, fontSize: 13 },
  detailValue: { color: COLORS.text, fontSize: 13, fontWeight: "600", textAlign: "right", flex: 1 },

  // Empty cards
  emptyCard: {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.border,
    padding: SPACING.xl, alignItems: "center", gap: SPACING.sm,
  },
  emptyCardText: { color: COLORS.text, fontSize: 14, fontWeight: "700" },
  emptyCardSub: { color: COLORS.muted, fontSize: 12, textAlign: "center", lineHeight: 18 },
});
