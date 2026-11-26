import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator, FlatList, Pressable,
  SafeAreaView, StyleSheet, Text, View,
} from "react-native";

import ScreenHeader from "../../src/components/ui/ScreenHeader";
import { COLORS, RADIUS, SPACING } from "../../src/constants/theme";
import { ProductResponse, getMisProductosApi } from "../../src/services/publicacionService";

export default function MisProductosScreen() {
  const [productos, setProductos] = useState<ProductResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getMisProductosApi()
      .then(setProductos)
      .catch((err: any) => setError(err?.message ?? "Error al cargar"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title="Mis artículos" />

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.gold} />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <MaterialCommunityIcons name="alert-circle-outline" size={48} color={COLORS.danger} />
          <Text style={styles.mutedText}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={productos}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            productos.length > 0 ? (
              <Text style={styles.listHeader}>
                {productos.length} artículo{productos.length !== 1 ? "s" : ""} aprobado{productos.length !== 1 ? "s" : ""}
              </Text>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <MaterialCommunityIcons name="package-variant-closed" size={56} color={COLORS.border} />
              <Text style={styles.emptyTitle}>Sin artículos aprobados</Text>
              <Text style={styles.emptyText}>
                Tus artículos aparecerán acá una vez que un empleado los revise y apruebe.
                Si enviaste uno recientemente, puede tardar unos días.
              </Text>
            </View>
          }
          ListFooterComponent={
            <Pressable
              style={styles.addBtn}
              onPress={() => router.push("/publicacion/nueva")}
            >
              <MaterialCommunityIcons name="plus" size={18} color="#000" />
              <Text style={styles.addBtnText}>Enviar nuevo artículo</Text>
            </Pressable>
          }
          renderItem={({ item }) => <ProductCard product={item} />}
        />
      )}
    </SafeAreaView>
  );
}

function ProductCard({ product }: { product: ProductResponse }) {
  const isArt = product.type === "art";
  const fecha = product.date
    ? new Date(product.date + "T00:00:00").toLocaleDateString("es-AR", {
        day: "2-digit", month: "short", year: "numeric",
      })
    : "";

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.75 }]}
      onPress={() => router.push({ pathname: "/publicacion/[id]", params: { id: product.id } } as any)}
    >
      <View style={styles.cardLeft}>
        <View style={styles.cardIcon}>
          <MaterialCommunityIcons
            name={isArt ? "palette-outline" : "cube-outline"}
            size={22} color={COLORS.gold}
          />
        </View>
        <View style={styles.cardTexts}>
          <Text style={styles.cardName} numberOfLines={1}>{product.name}</Text>
          {product.brand && (
            <Text style={styles.cardBrand}>{product.brand}</Text>
          )}
          {product.catalogDescription && (
            <Text style={styles.cardDesc} numberOfLines={2}>{product.catalogDescription}</Text>
          )}
          <View style={styles.cardMeta}>
            <View style={[styles.typeBadge, isArt ? styles.typeBadgeArt : styles.typeBadgeNormal]}>
              <Text style={[styles.typeBadgeText, isArt ? styles.typeBadgeTextArt : styles.typeBadgeTextNormal]}>
                {isArt ? "Arte" : "Producto"}
              </Text>
            </View>
            {/* Aprobado — siempre verde porque filtramos en el back */}
            <View style={styles.approvedBadge}>
              <MaterialCommunityIcons name="check-circle-outline" size={11} color={COLORS.success} />
              <Text style={styles.approvedText}>Aprobado</Text>
            </View>
          </View>
        </View>
      </View>
      <View style={styles.cardRight}>
        <Text style={styles.cardDate}>{fecha}</Text>
        <View style={styles.photoCountWrap}>
          <MaterialCommunityIcons name="image-outline" size={13} color={COLORS.muted} />
          <Text style={styles.photoCountText}>{product.photoCount}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", gap: SPACING.md },
  mutedText: { color: COLORS.muted, fontSize: 15, textAlign: "center" },
  list: { padding: SPACING.lg, gap: SPACING.md, paddingBottom: 80 },
  listHeader: { color: COLORS.muted, fontSize: 13, marginBottom: SPACING.sm },

  empty: { alignItems: "center", gap: SPACING.sm, paddingVertical: SPACING.xl },
  emptyTitle: { color: COLORS.text, fontSize: 17, fontWeight: "700" },
  emptyText: { color: COLORS.muted, fontSize: 13, textAlign: "center", lineHeight: 20, paddingHorizontal: SPACING.lg },

  addBtn: {
    marginTop: SPACING.lg, backgroundColor: COLORS.gold,
    borderRadius: RADIUS.lg, paddingVertical: 16,
    flexDirection: "row", justifyContent: "center", alignItems: "center", gap: SPACING.sm,
  },
  addBtnText: { color: "#000", fontWeight: "800", fontSize: 15 },

  card: {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.border,
    padding: SPACING.md, flexDirection: "row", gap: SPACING.md,
  },
  cardLeft: { flex: 1, flexDirection: "row", gap: SPACING.md },
  cardIcon: {
    width: 44, height: 44, borderRadius: RADIUS.sm,
    backgroundColor: COLORS.gold + "15",
    justifyContent: "center", alignItems: "center",
  },
  cardTexts: { flex: 1, gap: 3 },
  cardName: { color: COLORS.text, fontSize: 15, fontWeight: "700" },
  cardBrand: { color: COLORS.muted, fontSize: 13 },
  cardDesc: { color: COLORS.muted, fontSize: 12, lineHeight: 17 },
  cardMeta: { flexDirection: "row", gap: SPACING.sm, marginTop: 4, flexWrap: "wrap" },

  typeBadge: { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 },
  typeBadgeArt: { backgroundColor: "rgba(232,121,249,0.15)" },
  typeBadgeNormal: { backgroundColor: "rgba(96,165,250,0.15)" },
  typeBadgeText: { fontSize: 11, fontWeight: "600" },
  typeBadgeTextArt: { color: "#E879F9" },
  typeBadgeTextNormal: { color: "#60A5FA" },

  approvedBadge: {
    flexDirection: "row", alignItems: "center", gap: 3,
    backgroundColor: "rgba(34,197,94,0.12)",
    borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2,
  },
  approvedText: { color: COLORS.success, fontSize: 11, fontWeight: "600" },

  cardRight: { alignItems: "flex-end", justifyContent: "space-between" },
  cardDate: { color: COLORS.muted, fontSize: 11 },
  photoCountWrap: { flexDirection: "row", alignItems: "center", gap: 3 },
  photoCountText: { color: COLORS.muted, fontSize: 12 },
});
