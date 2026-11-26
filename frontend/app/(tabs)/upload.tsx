import { useEffect } from "react";
import { router } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import { COLORS } from "../../src/constants/theme";

// Esta pantalla solo sirve como puente desde la tab "Publicar".
// Si el usuario llega aquí ya está logueado (el _layout intercepta si no lo está).
export default function UploadTab() {
  useEffect(() => {
    router.replace("/publicacion/mis-publicaciones");
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background, justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator color={COLORS.gold} />
    </View>
  );
}
