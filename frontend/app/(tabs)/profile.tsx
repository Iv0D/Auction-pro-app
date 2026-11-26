import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { COLORS, RADIUS, SPACING } from "../../src/constants/theme";
import { useAuth } from "../../src/context/AuthContext";
import { UserProfile, getProfileApi } from "../../src/services/userService";

const CATEGORY_LABEL: Record<string, string> = {
  COMUN: "Miembro Común",
  ESPECIAL: "Miembro Especial",
  PLATA: "Miembro Plata",
  ORO: "Miembro Oro",
  PLATINO: "Miembro Platino",
};

const CATEGORY_COLOR: Record<string, string> = {
  COMUN: "#9CA3AF",
  ESPECIAL: "#60A5FA",
  PLATA: "#CBD5E1",
  ORO: "#F4C542",
  PLATINO: "#E879F9",
};

export default function ProfileScreen() {
  const { user, clearSession } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProfileApi()
      .then(setProfile)
      .catch(() => {/* usamos datos del contexto como fallback */})
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = async () => {
  if (Platform.OS === "web") {
    const confirmed = window.confirm(
      "¿Estás seguro que querés cerrar sesión?"
    );

    if (confirmed) {
      await clearSession();
      router.replace("/(auth)/login");
    }
    return;
  }

  Alert.alert(
    "Cerrar sesión",
    "¿Estás seguro que querés cerrar sesión?",
    [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Cerrar sesión",
        style: "destructive",
        onPress: async () => {
          await clearSession();
          router.replace("/(auth)/login");
        },
      },
    ]
  );
};

  // Nombre: preferimos el perfil completo, fallback al contexto
  const displayName = profile?.nombre ?? user?.name ?? "Usuario";
  const displayEmail = profile?.email ?? user?.email ?? "";
  const category = profile?.categoria ?? user?.category ?? "COMUN";
  const admitted = profile?.estado === "ACTIVO" || user?.admitted;

  const categoryLabel = CATEGORY_LABEL[category] ?? category;
  const categoryColor = CATEGORY_COLOR[category] ?? COLORS.muted;

  const menuItems = [
  ...(user?.administrator ? [{
    icon: "gavel",
    label: "Administración",
    description: "Solicitudes, pagos, publicaciones y subastas",
    onPress: () => router.push("/admin"),
  }] : []),
  {
    icon: "credit-card-outline",
    label: "Medios de pago",
    description: "Tarjetas, cuentas y cheques",
    onPress: () => router.push("/profile/paymentMethod"),
  },
  {
    icon: "account-edit-outline",
    label: "Configuración de perfil",
    description: "Domicilio y país de origen",
    onPress: () => router.push("/profile/edit"),
  },
  {
    icon: "history",
    label: "Historial de pujas",
    description: "Subastas y métricas",
    onPress: () => router.push("/profile/history"),
  },
  {
    icon: "lock-outline",
    label: "Cambiar contraseña",
    description: "Actualizá tu contraseña de acceso",
    onPress: () => router.push("/profile/changePassword"),
  },
  {
    icon: "alert-circle-outline",
    label: "Historial de multas",
    description: "Multas por incumplimiento de pago",
    onPress: () => router.push("/profile/fines"),
  },
];

const isLoggedIn = !!user;

if (!isLoggedIn) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.guestContainer}>

        {/* Card invitado */}
        <View style={styles.guestCard}>
          <View style={styles.guestAvatar}>
            <MaterialCommunityIcons
              name="account"
              size={22}
              color={COLORS.gold}
            />
          </View>

          <View>
            <Text style={styles.guestStatus}>
              STATUS: VISITANTE
            </Text>
            <Text style={styles.guestName}>
              Invitado
            </Text>
          </View>
        </View>

        {/* Centro */}
        <View style={styles.guestCenter}>
          <View style={styles.lockCircle}>
            <MaterialCommunityIcons
              name="lock"
              size={28}
              color={COLORS.gold}
            />
          </View>

          <Text style={styles.guestTitle}>
            No has iniciado sesión
          </Text>

          <Text style={styles.guestSubtitle}>
            Unite a la comunidad de coleccionistas.
            Accedé a subastas exclusivas, pujas seguras
            y alertas personalizadas.
          </Text>

          <Pressable
            style={styles.loginGuestBtn}
            onPress={() => router.push("/(auth)/login")}
          >
            <Text style={styles.loginGuestText}>
              Login
            </Text>
          </Pressable>

          <Pressable
            onPress={() => router.push("/(auth)/register")}
          >
            <Text style={styles.createGuestText}>
              Crear una cuenta
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Header con nombre + campana */}
        <View style={styles.topBar}>
          <Text style={styles.appName}>AuctionPro</Text>
          <Pressable style={styles.bellBtn}>
            <MaterialCommunityIcons name="bell-outline" size={22} color={COLORS.text} />
          </Pressable>
        </View>

        {/* Avatar + nombre + categoría */}
        <View style={styles.heroCard}>
          {loading ? (
            <ActivityIndicator color={COLORS.gold} size="large" />
          ) : (
            <>
              {/* Avatar placeholder con inicial */}
              <View style={styles.avatarWrap}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarInitial}>
                    {displayName.charAt(0).toUpperCase()}
                  </Text>
                </View>
                {/* Indicador de estado */}
                <View style={[styles.statusDot, admitted ? styles.dotActive : styles.dotPending]} />
              </View>

              <Text style={styles.userName}>{displayName}</Text>
              <Text style={styles.userEmail}>{displayEmail}</Text>

              {/* Badge de categoría */}
              <View style={[styles.categoryBadge, { borderColor: categoryColor + "55" }]}>
                <MaterialCommunityIcons name="medal-outline" size={13} color={categoryColor} />
                <Text style={[styles.categoryText, { color: categoryColor }]}>
                  {categoryLabel.toUpperCase()}
                </Text>
              </View>

              {!admitted && (
                <View style={styles.pendingBanner}>
                  <MaterialCommunityIcons name="clock-outline" size={14} color={COLORS.gold} />
                  <Text style={styles.pendingText}>Cuenta pendiente de verificación</Text>
                </View>
              )}
            </>
          )}
        </View>

        {/* Sección de opciones */}
        <Text style={styles.sectionLabel}>PREFERENCIAS DE CUENTA</Text>

        <View style={styles.menuCard}>
          {menuItems.map((item, index) => (
            <View key={item.label}>
              <Pressable
                style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
                onPress={item.onPress}
              >
                {/* Ícono */}
                <View style={styles.menuIconWrap}>
                  <MaterialCommunityIcons name={item.icon as any} size={20} color={COLORS.gold} />
                </View>

                {/* Textos */}
                <View style={styles.menuTexts}>
                  <Text style={styles.menuLabel}>{item.label}</Text>
                  <Text style={styles.menuDesc}>{item.description}</Text>
                </View>

                <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.muted} />
              </Pressable>

              {/* Divider entre items (no en el último) */}
              {index < menuItems.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </View>

        {/* Botón cerrar sesión */}
        <Pressable
          style={({ pressed }) => [styles.logoutBtn, pressed && { opacity: 0.75 }]}
          onPress={handleLogout}
        >
          <MaterialCommunityIcons name="logout" size={18} color={COLORS.danger} />
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </Pressable>

        {/* Versión */}
        <Text style={styles.version}>AuctionPro v1.0.0</Text>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { paddingBottom: 80 },

  // Top bar
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  appName: { color: COLORS.gold, fontSize: 18, fontWeight: "800" },
  bellBtn: { padding: SPACING.xs },

  // Hero card
  heroCard: {
    marginHorizontal: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    alignItems: "center",
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },

  // Avatar
  avatarWrap: { position: "relative", marginBottom: SPACING.xs },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.gold + "22",
    borderWidth: 3,
    borderColor: COLORS.gold,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitial: { color: COLORS.gold, fontSize: 32, fontWeight: "800" },
  statusDot: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: COLORS.surface,
  },
  dotActive: { backgroundColor: COLORS.success },
  dotPending: { backgroundColor: COLORS.gold },

  userName: { color: COLORS.text, fontSize: 22, fontWeight: "800" },
  userEmail: { color: COLORS.muted, fontSize: 13 },

  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginTop: 4,
  },
  categoryText: { fontSize: 11, fontWeight: "700", letterSpacing: 1 },

  pendingBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(244,197,66,0.08)",
    borderWidth: 1,
    borderColor: "rgba(244,197,66,0.2)",
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    marginTop: 4,
  },
  pendingText: { color: COLORS.gold, fontSize: 12 },

  // Sección
  sectionLabel: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
  },

  // Menu
  menuCard: {
    marginHorizontal: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
    marginBottom: SPACING.lg,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.md,
    paddingVertical: 14,
    gap: SPACING.md,
  },
  menuItemPressed: { backgroundColor: "#1A1A1A" },
  menuIconWrap: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.gold + "15",
    justifyContent: "center",
    alignItems: "center",
  },
  menuTexts: { flex: 1 },
  menuLabel: { color: COLORS.text, fontSize: 15, fontWeight: "600" },
  menuDesc: { color: COLORS.muted, fontSize: 12, marginTop: 2 },
  divider: { height: 1, backgroundColor: COLORS.border, marginLeft: SPACING.md + 38 + SPACING.md },

  // Logout
  logoutBtn: {
    marginHorizontal: SPACING.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.sm,
    backgroundColor: "rgba(239,68,68,0.1)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.25)",
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  logoutText: { color: COLORS.danger, fontWeight: "700", fontSize: 15 },

  version: { color: COLORS.border, fontSize: 12, textAlign: "center" },

  guestContainer: {
  flex: 1,
  padding: SPACING.lg,
},

guestCard: {
  flexDirection: "row",
  alignItems: "center",
  gap: SPACING.md,
  backgroundColor: COLORS.surface,
  borderWidth: 1,
  borderColor: COLORS.border,
  borderRadius: RADIUS.lg,
  padding: SPACING.md,
  marginTop: SPACING.md,
},

guestAvatar: {
  width: 46,
  height: 46,
  borderRadius: 23,
  borderWidth: 1,
  borderColor: COLORS.gold + "55",
  backgroundColor: COLORS.gold + "15",
  justifyContent: "center",
  alignItems: "center",
},

guestStatus: {
  color: COLORS.muted,
  fontSize: 10,
  letterSpacing: 1.5,
},

guestName: {
  color: COLORS.text,
  fontSize: 24,
  fontWeight: "700",
},

guestCenter: {
  flex: 1,
  justifyContent: "center",
  alignItems: "center",
  paddingHorizontal: SPACING.xl,
},

lockCircle: {
  width: 72,
  height: 72,
  borderRadius: 36,
  backgroundColor: COLORS.surface,
  borderWidth: 1,
  borderColor: COLORS.border,
  justifyContent: "center",
  alignItems: "center",
  marginBottom: SPACING.lg,
},

guestTitle: {
  color: COLORS.text,
  fontSize: 28,
  fontWeight: "700",
  marginBottom: SPACING.sm,
  textAlign: "center",
},

guestSubtitle: {
  color: COLORS.muted,
  textAlign: "center",
  lineHeight: 22,
  marginBottom: SPACING.xl,
},

loginGuestBtn: {
  backgroundColor: COLORS.gold,
  paddingVertical: 14,
  paddingHorizontal: 48,
  borderRadius: 999,
  marginBottom: SPACING.md,
},

loginGuestText: {
  color: "#000",
  fontWeight: "700",
  fontSize: 15,
},

createGuestText: {
  color: COLORS.gold,
  fontSize: 14,
},
});
