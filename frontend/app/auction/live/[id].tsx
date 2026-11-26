import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator, Alert, Image, Platform, Pressable, SafeAreaView,
  ScrollView, StyleSheet, Text, TextInput, View,
} from "react-native";

import { COLORS, RADIUS, SPACING } from "../../../src/constants/theme";
import {
  BidUpdate, ItemResult, JoinAuctionResponse,
  WS_URL, getAuctionStateApi, joinAuctionApi,
  leaveAuctionApi,
} from "../../../src/services/liveAuctionService";
import { PaymentMethod, getPaymentMethodsApi } from "../../../src/services/paymentService";
import { getItemPhotoUrl } from "../../../src/services/auctionService";

// SockJS + STOMP — instalados como @stomp/stompjs y sockjs-client
import { Client as StompClient } from "@stomp/stompjs";
import SockJS from "sockjs-client";

type Phase = "loading" | "select-payment" | "live" | "error";

function suggestedBid(basePrice: number, currentBid = 0) {
  const incrementInCents = Math.ceil(Math.round(basePrice * 100) / 100);
  return (currentBid + incrementInCents / 100).toFixed(2);
}

export default function AuctionLiveScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const auctionId = Number(id);

  const [phase, setPhase]               = useState<Phase>("loading");
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedPm, setSelectedPm]     = useState<number | null>(null);
  const [state, setState]               = useState<JoinAuctionResponse | null>(null);
  const [bids, setBids]                 = useState<BidUpdate[]>([]);
  const [lastResult, setLastResult]     = useState<ItemResult | null>(null);
  const [bidAmount, setBidAmount]       = useState("");
  const [bidding, setBidding]           = useState(false);
  const [bidError, setBidError]         = useState("");
  const [errorMsg, setErrorMsg]         = useState("");

  const stompRef = useRef<StompClient | null>(null);

  // ─── 1. Cargar medios de pago al entrar ───────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const pms = await getPaymentMethodsApi();
        const verified = pms.filter((p) => p.verificado
          && (p.tipo !== "CHEQUE_CERTIFICADO" || (p.moneda ?? "ARS").toUpperCase() === "ARS"));

        if (verified.length === 0) {
          // Sin medios verificados: entrar solo como espectador
          await doJoin(null);
        } else if (verified.length === 1) {
          // Solo uno: preguntar si quiere usarlo
          setPaymentMethods(verified);
          setSelectedPm(verified[0].id);
          setPhase("select-payment");
        } else {
          setPaymentMethods(verified);
          setPhase("select-payment");
        }
      } catch (e: any) {
        setErrorMsg(e?.message ?? "No se pudo cargar la subasta.");
        setPhase("error");
      }
    })();
  }, []);

  // ─── 2. Unirse ────────────────────────────────────────────────────────────
  const doJoin = async (pmId: number | null) => {
    setPhase("loading");
    try {
      const s = await joinAuctionApi(auctionId, pmId ?? undefined);
      setState(s);
      if (s.basePrice != null) {
        setBidAmount(suggestedBid(s.basePrice, s.currentBid ?? 0));
      }
      connectWebSocket(s);
      setPhase("live");
    } catch (e: any) {
      setErrorMsg(e?.message ?? "No se pudo unir a la subasta.");
      setPhase("error");
    }
  };

  const refreshCheckBalance = async () => {
    const updated = await getAuctionStateApi(auctionId);
    setState((prev) => prev ? { ...prev, chequeDisponible: updated.chequeDisponible } : prev);
  };

  // ─── 3. WebSocket ─────────────────────────────────────────────────────────
  const connectWebSocket = (s: JoinAuctionResponse) => {
    const transport = Platform.OS === "web"
      ? { webSocketFactory: () => new SockJS(new URL(WS_URL, window.location.href).href) }
      : { brokerURL: WS_URL.replace(/^http/, "ws") + "/websocket" };

    const client = new StompClient({
      ...transport,
      reconnectDelay: 5000,
      onConnect: () => {
        // Suscribirse a pujas en tiempo real
        client.subscribe(`/topic/auction/${auctionId}/bids`, (msg) => {
          const bid: BidUpdate = JSON.parse(msg.body);
          setBids((prev) => [...prev, bid]);
          setState((prev) => prev
            ? { ...prev, currentBid: bid.amount }
            : prev);
          // Sugerir la oferta mínima siguiente
          if (bid.minNextBid) setBidAmount(bid.minNextBid.toString());
        });

        // Suscribirse al resultado de cada ítem
        client.subscribe(`/topic/auction/${auctionId}/result`, (msg) => {
          const result: ItemResult = JSON.parse(msg.body);
          setLastResult(result);
          setBids([]);
          setBidError("");
          if (s.chequeDisponible != null) void refreshCheckBalance().catch(() => {});
          if (result.auctionFinished) {
            setState((prev) => prev ? { ...prev, currentItemId: null } : prev);
            Alert.alert("Subasta finalizada", "La subasta llegó a su fin.", [
              { text: "Salir", onPress: handleLeave },
            ]);
          } else if (result.nextItemId) {
            setState((prev) => prev ? {
              ...prev,
              currentItemId: result.nextItemId!,
              currentItemName: result.nextItemName,
              currentItemDescription: null,
              basePrice: result.nextBasePrice,
              currentBid: null,
            } : prev);
            if (result.nextBasePrice)
              setBidAmount(suggestedBid(result.nextBasePrice));
          }
        });
      },
    });
    client.activate();
    stompRef.current = client;
  };

  // ─── 4. Pujar ─────────────────────────────────────────────────────────────
  const handleBid = async () => {
    if (!state?.currentItemId || !bidAmount || bidding) return;
    const enteredAmount = bidAmount.trim().replace(",", ".");
    const amount = Number(enteredAmount);
    if (!/^\d+(\.\d{0,2})?$/.test(enteredAmount) || !Number.isFinite(amount) || amount <= 0) {
      setBidError("Ingresá un importe positivo con hasta dos decimales.");
      return;
    }
    setBidError("");
    setBidding(true);
    try {
      // Enviamos via REST para tener confirmación
      await import("../../../src/services/api").then(({ default: request }) =>
        request(`/auctions/${auctionId}/bid`, {
          method: "POST",
          body: JSON.stringify({
            auctionId,
            itemId: state.currentItemId,
            amount,
          }),
        })
      );
      // Refrescar el estado: si pagó con cheque, el disponible puede haber cambiado
      if (state.chequeDisponible != null) void refreshCheckBalance().catch(() => {});
    } catch (e: any) {
      setBidError(e?.message ?? "No se pudo registrar la oferta. Intentá de nuevo.");
    } finally {
      setBidding(false);
    }
  };

  // ─── 5. Salir ─────────────────────────────────────────────────────────────
  const handleLeave = async () => {
    stompRef.current?.deactivate();
    await leaveAuctionApi(auctionId).catch(() => {});
    router.back();
  };

  const confirmLeave = () => {
    Alert.alert("Salir de la subasta", "¿Querés salir? Podrás reconectarte más tarde.", [
      { text: "Cancelar", style: "cancel" },
      { text: "Salir", style: "destructive", onPress: handleLeave },
    ]);
  };

  // ─── RENDERS ──────────────────────────────────────────────────────────────

  if (phase === "loading") return (
    <View style={styles.centered}>
      <ActivityIndicator size="large" color={COLORS.gold} />
      <Text style={styles.mutedText}>Conectando a la subasta...</Text>
    </View>
  );

  if (phase === "error") return (
    <SafeAreaView style={styles.container}>
      <View style={styles.centered}>
        <MaterialCommunityIcons name="alert-circle-outline" size={56} color={COLORS.danger} />
        <Text style={styles.errorTitle}>No se puede ingresar</Text>
        <Text style={styles.mutedText}>{errorMsg}</Text>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Volver</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );

  if (phase === "select-payment") return (
    <SafeAreaView style={styles.container}>
      <View style={styles.navbar}>
        <Pressable onPress={() => router.back()} style={styles.navBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.text} />
        </Pressable>
        <Text style={styles.navTitle}>Ingresar a la subasta</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.sectionTitle}>Seleccioná tu medio de pago</Text>
        <Text style={styles.sectionSub}>
          Usarás este medio para las compras que realices en la subasta.
        </Text>

        {paymentMethods.map((pm) => (
          <Pressable
            key={pm.id}
            style={[styles.pmCard, selectedPm === pm.id && styles.pmCardSelected]}
            onPress={() => setSelectedPm(pm.id)}
          >
            <MaterialCommunityIcons
              name={pm.tipo === "TARJETA_CREDITO" ? "credit-card-outline"
                  : pm.tipo === "CUENTA_BANCARIA" ? "bank-outline"
                  : "file-document-outline"}
              size={24}
              color={selectedPm === pm.id ? COLORS.gold : COLORS.muted}
            />
            <View style={styles.pmInfo}>
              <Text style={styles.pmLabel}>
                {pm.tipo === "TARJETA_CREDITO"
                  ? `${pm.marca ?? "Tarjeta"} ···· ${pm.ultimos4}`
                  : pm.tipo === "CUENTA_BANCARIA"
                  ? `${pm.banco ?? "Banco"} · ${pm.cbu?.slice(-4)}`
                  : `Cheque certificado · $${pm.montoGarantizado?.toLocaleString("es-AR")}`}
              </Text>
              {pm.titular && <Text style={styles.pmSub}>{pm.titular}</Text>}
            </View>
            {selectedPm === pm.id && (
              <MaterialCommunityIcons name="check-circle" size={20} color={COLORS.gold} />
            )}
          </Pressable>
        ))}

        <View style={styles.buttons}>
          <Pressable
            style={[styles.joinBtn, !selectedPm && { opacity: 0.5 }]}
            disabled={!selectedPm}
            onPress={() => doJoin(selectedPm)}
          >
            <MaterialCommunityIcons name="gavel" size={20} color="#000" />
            <Text style={styles.joinBtnText}>Ingresar y pujar</Text>
          </Pressable>

          <Pressable style={styles.watchBtn} onPress={() => doJoin(null)}>
            <Text style={styles.watchBtnText}>Solo ver (sin pujar)</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );

  // ─── PANTALLA LIVE ────────────────────────────────────────────────────────
  const minBid = state?.basePrice
    ? (state.currentBid ?? 0) + state.basePrice * 0.01 : null;
  const maxBid = state?.basePrice
    ? (state.currentBid ?? 0) + state.basePrice * 0.20 : null;

  return (
    <SafeAreaView style={styles.container}>
      {/* Navbar */}
      <View style={styles.navbar}>
        <Pressable onPress={confirmLeave} style={styles.navBtn}>
          <MaterialCommunityIcons name="close" size={24} color={COLORS.text} />
        </Pressable>
        <View style={styles.liveIndicator}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>EN VIVO</Text>
        </View>
        <View style={styles.bidderBadge}>
          <Text style={styles.bidderText}>#{state?.bidderNumber}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Foto del artículo actual */}
        {state?.currentItemId && (
          <ItemPhoto key={state.currentItemId} itemId={state.currentItemId} />
        )}

        {/* Ítem actual */}
        <View style={styles.itemCard}>
          <Text style={styles.itemLabel}>ARTÍCULO EN REMATE</Text>
          <Text style={styles.itemName}>{state?.currentItemName ?? "—"}</Text>
          {state?.currentItemDescription && (
            <Text style={styles.itemDesc}>{state.currentItemDescription}</Text>
          )}
          {state?.basePrice != null && (
            <View style={styles.basePriceRow}>
              <Text style={styles.basePriceLabel}>Precio base</Text>
              <Text style={styles.basePriceValue}>
                ${Number(state.basePrice).toLocaleString("es-AR")}
              </Text>
            </View>
          )}
        </View>

        {/* Oferta actual */}
        <View style={styles.currentBidCard}>
          <Text style={styles.currentBidLabel}>MEJOR OFERTA</Text>
          <Text style={styles.currentBidAmount}>
            {state?.currentBid != null
              ? `$${Number(state.currentBid).toLocaleString("es-AR")}`
              : "Sin ofertas aún"}
          </Text>
        </View>

        {/* Formulario de puja */}
        {state?.canBid ? (
          <View style={styles.bidSection}>
            <Text style={styles.bidSectionTitle}>HACER UNA OFERTA</Text>
            {minBid != null && (
              <Text style={styles.bidLimits}>
                Mín: ${Number(minBid).toLocaleString("es-AR")}
                {maxBid != null ? ` · Máx: $${Number(maxBid).toLocaleString("es-AR")}` : ""}
              </Text>
            )}
            {state.chequeDisponible != null && (
              <View style={styles.checkAvailableBanner}>
                <MaterialCommunityIcons name="file-document-outline" size={14} color={COLORS.gold} />
                <Text style={styles.checkAvailableText}>
                  Disponible en tu cheque: ${Number(state.chequeDisponible).toLocaleString("es-AR")}
                </Text>
              </View>
            )}
            <View style={styles.bidInputRow}>
              <Text style={styles.currencySign}>$</Text>
              <TextInput
                style={styles.bidInput}
                value={bidAmount}
                onChangeText={(value) => { setBidAmount(value); setBidError(""); }}
                keyboardType="numeric"
                placeholder="0.00"
                placeholderTextColor={COLORS.border}
              />
            </View>
            {!!bidError && <Text accessibilityRole="alert" style={styles.bidError}>{bidError}</Text>}
            <Pressable
              style={[styles.bidBtn, (bidding || !state.currentItemId) && { opacity: 0.5 }]}
              onPress={handleBid}
              disabled={bidding || !state.currentItemId}
            >
              {bidding
                ? <ActivityIndicator color="#000" size="small" />
                : <>
                    <MaterialCommunityIcons name="gavel" size={20} color="#000" />
                    <Text style={styles.bidBtnText}>Pujar</Text>
                  </>}
            </Pressable>
          </View>
        ) : (
          <View style={styles.watchOnlyBanner}>
            <MaterialCommunityIcons name="eye-outline" size={18} color={COLORS.muted} />
            <Text style={styles.watchOnlyText}>Estás viendo como espectador</Text>
          </View>
        )}

        {/* Resultado del ítem anterior */}
        {lastResult && (
          <View style={[styles.resultCard,
            lastResult.sold ? styles.resultCardSold : styles.resultCardUnsold]}>
            <Text style={styles.resultTitle}>
              {lastResult.sold ? "✓ Artículo vendido" : "Sin ofertas — comprado por la empresa"}
            </Text>
            <Text style={styles.resultDetail}>
              {lastResult.itemName} · ${Number(lastResult.finalAmount).toLocaleString("es-AR")}
            </Text>
            {lastResult.sold && lastResult.winnerBidderNumber && (
              <Text style={styles.resultWinner}>Postor #{lastResult.winnerBidderNumber}</Text>
            )}
          </View>
        )}

        {/* Historial de pujas */}
        {bids.length > 0 && (
          <View style={styles.bidsHistory}>
            <Text style={styles.bidsHistoryTitle}>HISTORIAL DE OFERTAS</Text>
            {[...bids].reverse().map((b) => (
              <View key={b.bidId} style={styles.bidRow}>
                <View style={styles.bidRowLeft}>
                  <Text style={styles.bidRowBidder}>Postor #{b.bidderNumber}</Text>
                  <Text style={styles.bidRowTime}>
                    {new Date(b.timestamp).toLocaleTimeString("es-AR",
                      { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                  </Text>
                </View>
                <Text style={styles.bidRowAmount}>
                  ${Number(b.amount).toLocaleString("es-AR")}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Foto del artículo en remate ───────────────────────────────────────────────

function ItemPhoto({ itemId }: { itemId: number }) {
  const [imgError, setImgError] = useState(false);
  const photoUrl = getItemPhotoUrl(itemId);

  if (imgError) {
    return (
      <View style={styles.itemPhotoPlaceholder}>
        <MaterialCommunityIcons name="image-off-outline" size={40} color={COLORS.border} />
      </View>
    );
  }

  return (
    <Image
      source={{ uri: photoUrl }}
      style={styles.itemPhoto}
      resizeMode="cover"
      onError={() => setImgError(true)}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", gap: SPACING.md, padding: SPACING.xl },
  mutedText: { color: COLORS.muted, textAlign: "center", fontSize: 15 },
  errorTitle: { color: COLORS.text, fontSize: 20, fontWeight: "800" },
  backBtn: { borderWidth: 1, borderColor: COLORS.gold, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, borderRadius: RADIUS.md },
  backBtnText: { color: COLORS.gold, fontWeight: "600" },

  navbar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: "#111" },
  navBtn: { padding: 4, width: 40 },
  navTitle: { color: COLORS.text, fontSize: 16, fontWeight: "700", flex: 1, textAlign: "center" },
  liveIndicator: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(239,68,68,0.15)", borderWidth: 1, borderColor: "rgba(239,68,68,0.3)", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: COLORS.danger },
  liveText: { color: COLORS.danger, fontSize: 12, fontWeight: "800" },
  bidderBadge: { backgroundColor: COLORS.gold + "20", borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4, minWidth: 40, alignItems: "center" },
  bidderText: { color: COLORS.gold, fontSize: 13, fontWeight: "800" },

  scroll: { padding: SPACING.lg, gap: SPACING.md, paddingBottom: 80 },

  // Foto del ítem
  itemPhoto: { width: "100%", height: 220, borderRadius: RADIUS.md, backgroundColor: "#0A0A0A" },
  itemPhotoPlaceholder: { width: "100%", height: 220, borderRadius: RADIUS.md, backgroundColor: "#0A0A0A", borderWidth: 1, borderColor: COLORS.border, justifyContent: "center", alignItems: "center" },

  // Ítem actual
  itemCard: { backgroundColor: COLORS.surface, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.md, gap: SPACING.sm },
  itemLabel: { color: COLORS.muted, fontSize: 10, fontWeight: "700", letterSpacing: 1.5 },
  itemName: { color: COLORS.text, fontSize: 22, fontWeight: "800" },
  itemDesc: { color: COLORS.muted, fontSize: 14, lineHeight: 20 },
  basePriceRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 4 },
  basePriceLabel: { color: COLORS.muted, fontSize: 13 },
  basePriceValue: { color: COLORS.text, fontSize: 13, fontWeight: "600" },

  // Oferta actual
  currentBidCard: { backgroundColor: "#0A0A0A", borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.gold + "30", padding: SPACING.md, alignItems: "center", gap: 4 },
  currentBidLabel: { color: COLORS.muted, fontSize: 10, fontWeight: "700", letterSpacing: 1.5 },
  currentBidAmount: { color: COLORS.gold, fontSize: 36, fontWeight: "900" },

  // Puja
  bidSection: { backgroundColor: COLORS.surface, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.md, gap: SPACING.sm },
  bidSectionTitle: { color: COLORS.muted, fontSize: 10, fontWeight: "700", letterSpacing: 1.5 },
  bidLimits: { color: COLORS.muted, fontSize: 12 },
  bidError: { color: COLORS.danger, fontSize: 13 },
  checkAvailableBanner: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: COLORS.gold + "12", borderRadius: RADIUS.sm, paddingHorizontal: 10, paddingVertical: 6 },
  checkAvailableText: { color: COLORS.gold, fontSize: 12, fontWeight: "600" },
  bidInputRow: { flexDirection: "row", alignItems: "center", backgroundColor: "#0A0A0A", borderRadius: RADIUS.sm, borderWidth: 1, borderColor: "#2A2A2A", paddingHorizontal: SPACING.md },
  currencySign: { color: COLORS.gold, fontSize: 20, fontWeight: "800", marginRight: 4 },
  bidInput: { flex: 1, color: COLORS.text, fontSize: 24, fontWeight: "700", paddingVertical: 14 },
  bidBtn: { backgroundColor: COLORS.gold, borderRadius: RADIUS.md, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: SPACING.sm, padding: 14 },
  bidBtnText: { color: "#000", fontSize: 16, fontWeight: "800" },

  watchOnlyBanner: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: SPACING.sm, backgroundColor: COLORS.surface, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.md },
  watchOnlyText: { color: COLORS.muted, fontSize: 14 },

  // Resultado
  resultCard: { borderRadius: RADIUS.md, borderWidth: 1, padding: SPACING.md, gap: 4 },
  resultCardSold: { backgroundColor: "rgba(34,197,94,0.08)", borderColor: "rgba(34,197,94,0.25)" },
  resultCardUnsold: { backgroundColor: COLORS.surface, borderColor: COLORS.border },
  resultTitle: { color: COLORS.text, fontSize: 15, fontWeight: "700" },
  resultDetail: { color: COLORS.muted, fontSize: 13 },
  resultWinner: { color: COLORS.gold, fontSize: 13, fontWeight: "600" },

  // Historial
  bidsHistory: { backgroundColor: COLORS.surface, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, overflow: "hidden" },
  bidsHistoryTitle: { color: COLORS.muted, fontSize: 10, fontWeight: "700", letterSpacing: 1.5, padding: SPACING.md, borderBottomWidth: 1, borderBottomColor: "#111" },
  bidRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: SPACING.md, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#0D0D0D" },
  bidRowLeft: { gap: 2 },
  bidRowBidder: { color: COLORS.text, fontSize: 13, fontWeight: "600" },
  bidRowTime: { color: COLORS.muted, fontSize: 11 },
  bidRowAmount: { color: COLORS.gold, fontSize: 15, fontWeight: "800" },

  // Select payment
  sectionTitle: { color: COLORS.text, fontSize: 20, fontWeight: "800", marginBottom: 4 },
  sectionSub: { color: COLORS.muted, fontSize: 14, marginBottom: SPACING.lg },
  pmCard: { flexDirection: "row", alignItems: "center", gap: SPACING.md, backgroundColor: COLORS.surface, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.md, marginBottom: SPACING.sm },
  pmCardSelected: { borderColor: COLORS.gold },
  pmInfo: { flex: 1 },
  pmLabel: { color: COLORS.text, fontSize: 15, fontWeight: "600" },
  pmSub: { color: COLORS.muted, fontSize: 12 },
  buttons: { gap: SPACING.sm, marginTop: SPACING.md },
  joinBtn: { backgroundColor: COLORS.gold, borderRadius: RADIUS.lg, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: SPACING.sm, padding: 16 },
  joinBtnText: { color: "#000", fontSize: 16, fontWeight: "800" },
  watchBtn: { borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.lg, padding: 14, alignItems: "center" },
  watchBtnText: { color: COLORS.muted, fontSize: 14 },
});
