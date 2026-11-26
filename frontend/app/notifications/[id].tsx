import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator, Alert, Pressable,
  SafeAreaView, ScrollView, StyleSheet, Text, View,
} from "react-native";

import { COLORS, RADIUS, SPACING } from "../../src/constants/theme";
import {
  Notification, getNotificationsApi,
  markAsReadApi, respondToApprovalApi,
} from "../../src/services/notificationService";

const TYPE_CONFIG: Record<string, { icon: string; color: string; label: string }> = {
  PRODUCT_APPROVED: { icon: "check-circle-outline",  color: "#F4C542", label: "Producto aprobado"   },
  PRODUCT_REJECTED: { icon: "close-circle-outline",  color: "#EF4444", label: "Producto rechazado"  },
  BID_OUTBID:       { icon: "trending-up",            color: "#EF4444", label: "Tu puja fue superada"},
  AUCTION_STARTING: { icon: "alarm",                  color: "#F4C542", label: "Subasta por empezar" },
  PAYMENT_SUCCESS:  { icon: "check-decagram-outline", color: "#22C55E", label: "Pago confirmado"     },
  WATCHLIST_ALERT:  { icon: "star-outline",           color: "#60A5FA", label: "Artículo seguido"    },
};

export default function NotificationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [notification, setNotification] = useState<Notification | null>(null);
  const [loading, setLoading]           = useState(true);
  const [responding, setResponding]     = useState(false);

  useEffect(() => {
    getNotificationsApi()
      .then(async (list) => {
        const found = list.find((n) => n.id === Number(id)) ?? null;
        setNotification(found);
        if (found && !found.read) {
          await markAsReadApi(found.id).catch(() => {});
          setNotification({ ...found, read: true });
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleRespond = (response: "ACCEPTED" | "REJECTED_BY_USER") => {
    const accepting = response === "ACCEPTED";
    Alert.alert(
      accepting ? "Aceptar condiciones" : "Rechazar condiciones",
      accepting
        ? "Al aceptar, tu artículo será publicado en la próxima subasta curada. Los fondos se liquidarán 48 hs post-subasta."
        : "Al rechazar, tu artículo no será publicado. Podés volver a enviarlo cuando quieras.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: accepting ? "Aceptar" : "Rechazar",
          style: accepting ? "default" : "destructive",
          onPress: async () => {
            setResponding(true);
            try {
              const updated = await respondToApprovalApi(Number(id), response);
              setNotification(updated);
            } catch (err: any) {
              Alert.alert("Error", err?.message ?? "No se pudo procesar la respuesta.");
            } finally { setResponding(false); }
          },
        },
      ]
    );
  };

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color={COLORS.gold} /></View>;
  if (!notification) return (
    <SafeAreaView style={styles.container}>
      <View style={styles.centered}>
        <Text style={styles.mutedText}>Notificación no encontrada.</Text>
        <Pressable onPress={() => router.back()} style={styles.backPill}>
          <Text style={styles.backPillText}>Volver</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );

  const cfg = TYPE_CONFIG[notification.type] ?? { icon: "bell-outline", color: COLORS.muted, label: "Aviso" };
  const isApproval = notification.type === "PRODUCT_APPROVED";
  const isPending  = notification.userResponse === "PENDING";
  const accepted   = notification.userResponse === "ACCEPTED";
  const commissionAmt = notification.basePrice && notification.commissionRate
    ? notification.basePrice * notification.commissionRate / 100 : null;

  const formattedTime = new Date(notification.createdAt).toLocaleTimeString("es-AR", {
    hour: "2-digit", minute: "2-digit",
  });
  const formattedDate = new Date(notification.createdAt).toLocaleDateString("es-AR", {
    day: "2-digit", month: "long", year: "numeric",
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Navbar */}
      <View style={styles.navbar}>
        <Pressable onPress={() => router.back()} style={styles.navBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.text} />
        </Pressable>
        <Text style={styles.navTitle}>Detalle</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Fecha pill */}
        <View style={styles.datePill}>
          <Text style={styles.datePillText}>{formattedDate.toUpperCase()}</Text>
        </View>

        {/* Burbuja */}
        <View style={styles.chatWrap}>
          <View style={styles.senderRow}>
            <View style={[styles.senderDot, { backgroundColor: cfg.color }]} />
            <Text style={[styles.senderName, { color: cfg.color }]}>AUCTIONPRO OFFICIAL</Text>
          </View>

          <View style={styles.bubble}>
            <Text style={styles.bubbleText}>{notification.message}</Text>

            {/* Desglose precio — aprobación */}
            {isApproval && notification.basePrice != null && (
              <View style={styles.priceBreakdown}>
                <PriceRow label="Valor inicial" value={`$${Number(notification.basePrice).toLocaleString("es-AR")}`} />
                {notification.commissionRate != null && (
                  <PriceRow label={`Comisión (${notification.commissionRate}%)`}
                    value={commissionAmt ? `$${Number(commissionAmt).toLocaleString("es-AR")}` : "—"} />
                )}
                <PriceRow
                  label="Neto estimado" bold
                  value={`$${Number((notification.basePrice ?? 0) - (commissionAmt ?? 0)).toLocaleString("es-AR")}`}
                  valueColor={COLORS.gold}
                />
              </View>
            )}

            {/* Monto — puja / pago */}
            {notification.amount != null && !isApproval && (
              <View style={styles.amountChip}>
                <Text style={styles.amountChipText}>
                  ${Number(notification.amount).toLocaleString("es-AR")}
                </Text>
              </View>
            )}

            <Text style={styles.bubbleTime}>{formattedTime}</Text>
          </View>
        </View>

        {/* Resultado si ya respondió */}
        {isApproval && !isPending && (
          <View style={[styles.resultBanner, accepted ? styles.resultOk : styles.resultNo]}>
            <MaterialCommunityIcons
              name={accepted ? "check-circle" : "close-circle"} size={20}
              color={accepted ? COLORS.success : COLORS.danger} />
            <Text style={[styles.resultText, { color: accepted ? COLORS.success : COLORS.danger }]}>
              {accepted ? "Aceptaste las condiciones" : "Rechazaste las condiciones"}
            </Text>
          </View>
        )}

        {/* Acciones requeridas */}
        {isApproval && isPending && (
          <View style={styles.actionsWrap}>
            <Text style={styles.actionsLabel}>ACCIONES REQUERIDAS</Text>

            <Pressable
              style={({ pressed }) => [styles.acceptBtn, pressed && { opacity: 0.8 }]}
              onPress={() => handleRespond("ACCEPTED")} disabled={responding}
            >
              {responding
                ? <ActivityIndicator color="#000" size="small" />
                : <><MaterialCommunityIcons name="check-circle" size={20} color="#000" />
                   <Text style={styles.acceptBtnText}>Aceptar</Text></>}
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.rejectBtn, pressed && { opacity: 0.8 }]}
              onPress={() => handleRespond("REJECTED_BY_USER")} disabled={responding}
            >
              <MaterialCommunityIcons name="close-circle" size={20} color={COLORS.text} />
              <Text style={styles.rejectBtnText}>Rechazar</Text>
            </Pressable>

            <View style={styles.infoBox}>
              <MaterialCommunityIcons name="information-outline" size={15} color={COLORS.muted} />
              <Text style={styles.infoBoxText}>
                Al aceptar, tu artículo será publicado automáticamente en la próxima galería curada.
                Los fondos se liquidarán 48 hs post-subasta.
              </Text>
            </View>
          </View>
        )}

        {/* Ver subasta si aplica */}
        {notification.auctionId && notification.type !== "PRODUCT_APPROVED" && (
          <Pressable
            style={styles.auctionBtn}
            onPress={() => router.push({ pathname: "/auction/[id]", params: { id: notification.auctionId! } })}
          >
            <MaterialCommunityIcons name="gavel" size={18} color={COLORS.gold} />
            <Text style={styles.auctionBtnText}>
              {notification.type === "BID_OUTBID" ? "Volver a pujar" : "Ver subasta"}
            </Text>
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function PriceRow({ label, value, bold, valueColor }: {
  label: string; value: string; bold?: boolean; valueColor?: string;
}) {
  return (
    <View style={priceStyles.row}>
      <Text style={priceStyles.label}>{label}</Text>
      <Text style={[priceStyles.value, bold && { fontWeight: "800" }, valueColor ? { color: valueColor } : {}]}>
        {value}
      </Text>
    </View>
  );
}
const priceStyles = StyleSheet.create({
  row: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: SPACING.md, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#2A2A2A" },
  label: { color: COLORS.muted, fontSize: 13 },
  value: { color: COLORS.text, fontSize: 13, fontWeight: "600" },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0A0A" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", gap: SPACING.md },
  mutedText: { color: COLORS.muted, fontSize: 15 },
  backPill: { borderWidth: 1, borderColor: COLORS.gold, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, borderRadius: RADIUS.md },
  backPillText: { color: COLORS.gold, fontWeight: "600" },

  navbar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: "#1A1A1A" },
  navBtn: { padding: 6, width: 40 },
  navTitle: { color: COLORS.gold, fontSize: 15, fontWeight: "800", letterSpacing: 1 },

  scroll: { padding: SPACING.lg, gap: SPACING.lg, paddingBottom: 80 },

  datePill: { alignSelf: "center", backgroundColor: "#1A1A1A", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 5 },
  datePillText: { color: COLORS.muted, fontSize: 11, fontWeight: "700", letterSpacing: 1 },

  chatWrap: { gap: SPACING.sm },
  senderRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  senderDot: { width: 8, height: 8, borderRadius: 4 },
  senderName: { fontSize: 11, fontWeight: "800", letterSpacing: 1 },

  bubble: { backgroundColor: "#1A1A1A", borderRadius: RADIUS.md, borderTopLeftRadius: 4, borderWidth: 1, borderColor: "#2A2A2A", padding: SPACING.md, gap: SPACING.sm },
  bubbleText: { color: COLORS.text, fontSize: 15, lineHeight: 22 },
  bubbleTime: { color: COLORS.muted, fontSize: 11, alignSelf: "flex-end" },

  priceBreakdown: { backgroundColor: "#111", borderRadius: RADIUS.sm, borderWidth: 1, borderColor: "#2A2A2A", overflow: "hidden", marginTop: 4 },

  amountChip: { alignSelf: "flex-start", backgroundColor: COLORS.gold + "20", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
  amountChipText: { color: COLORS.gold, fontSize: 15, fontWeight: "800" },

  resultBanner: { flexDirection: "row", alignItems: "center", gap: SPACING.sm, borderRadius: RADIUS.md, padding: SPACING.md, borderWidth: 1 },
  resultOk: { backgroundColor: "rgba(34,197,94,0.08)", borderColor: "rgba(34,197,94,0.25)" },
  resultNo: { backgroundColor: "rgba(239,68,68,0.08)", borderColor: "rgba(239,68,68,0.25)" },
  resultText: { fontSize: 14, fontWeight: "700" },

  actionsWrap: { gap: SPACING.md },
  actionsLabel: { color: COLORS.muted, fontSize: 11, fontWeight: "700", letterSpacing: 1.5, textAlign: "center" },
  acceptBtn: { backgroundColor: COLORS.gold, borderRadius: RADIUS.lg, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: SPACING.sm, padding: 16 },
  acceptBtnText: { color: "#000", fontSize: 16, fontWeight: "800" },
  rejectBtn: { backgroundColor: "#1A1A1A", borderRadius: RADIUS.lg, borderWidth: 1, borderColor: "#333", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: SPACING.sm, padding: 16 },
  rejectBtnText: { color: COLORS.text, fontSize: 16, fontWeight: "600" },

  infoBox: { flexDirection: "row", alignItems: "flex-start", gap: SPACING.sm, backgroundColor: "#111", borderRadius: RADIUS.sm, borderWidth: 1, borderColor: "#222", padding: SPACING.md },
  infoBoxText: { color: COLORS.muted, fontSize: 12, lineHeight: 18, flex: 1 },

  auctionBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: SPACING.sm, borderWidth: 1, borderColor: COLORS.gold + "40", borderRadius: RADIUS.lg, padding: 14 },
  auctionBtnText: { color: COLORS.gold, fontSize: 15, fontWeight: "700" },
});
