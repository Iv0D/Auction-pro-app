import { ActivityIndicator, View } from "react-native";
import { Redirect } from "expo-router";
import { useAuth } from "../src/context/AuthContext";
import { COLORS } from "../src/constants/theme";

// Punto de entrada: siempre va al home público.
// El home detecta si hay sesión y muestra el contenido apropiado.
export default function Entry() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.background, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator color={COLORS.gold} size="large" />
      </View>
    );
  }

  return <Redirect href="/(tabs)" />;
}
