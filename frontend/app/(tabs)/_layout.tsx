import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Tabs, router } from "expo-router";
import { Text, StyleSheet } from "react-native";
import { useAuth } from "../../src/context/AuthContext";
import { COLORS } from "../../src/constants/theme";

import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TabLayout() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          ...styles.tabBar,
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom,
        },
        tabBarActiveTintColor: COLORS.gold,
        tabBarInactiveTintColor: "#555",
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      {/* Inicio — siempre visible */}
      <Tabs.Screen
        name="index"
        options={{
          title: "Inicio",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="home-outline" size={size} color={color} />
          ),
        }}
      />

      {/* Subastas — siempre visible */}
      <Tabs.Screen
        name="auctions"
        options={{
          title: "Subastas",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="gavel" size={size} color={color} />
          ),
        }}
      />

      {/* Publicar — solo logueado, sino botón que va al login */}
      <Tabs.Screen
        name="upload"
        options={{
          title: "Publicar",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="plus-circle-outline"
              size={size + 4}
              color={user ? COLORS.gold : "#555"}
            />
          ),
          tabBarLabel: ({ focused }) => (
            <Text style={[styles.tabLabel, { color: user ? (focused ? COLORS.gold : "#555") : "#555" }]}>
              Publicar
            </Text>
          ),
        }}
        listeners={{
          tabPress: (e) => {
            if (!user) {
              e.preventDefault();
              router.push("/(auth)/login");
            }
          },
        }}
      />

      {/* Historial — solo logueado */}
      <Tabs.Screen
        name="history"
        options={{
          title: "Historial",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="history" size={size} color={user ? color : "#555"} />
          ),
        }}
        listeners={{
          tabPress: (e) => {
            if (!user) {
              e.preventDefault();
              router.push("/(auth)/login");
            }
          },
        }}
      />

      {/* Perfil — siempre visible, muestra diferente según sesión */}
      <Tabs.Screen
        name="profile"
        options={{
          title: "Perfil",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: "#0D0D0D",
    borderTopColor: "#1A1A1A",
    borderTopWidth: 1,
    paddingTop: 4,
    height: 60,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: "600",
  },
});
