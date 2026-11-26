import { Stack } from "expo-router";
import { AuthProvider } from "../src/context/AuthContext";

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="auction/[id]" />
        <Stack.Screen name="auction/catalog/[id]" />
        <Stack.Screen name="auction/item/[itemId]" />
        <Stack.Screen name="auction/live/[id]" />
        <Stack.Screen name="notifications/index" />
        <Stack.Screen name="notifications/[id]" />
        <Stack.Screen name="profile/edit" />
        <Stack.Screen name="profile/changePassword" />
        <Stack.Screen name="profile/paymentMethod" />
        <Stack.Screen name="profile/fines" />
        <Stack.Screen name="publicacion/nueva" />
        <Stack.Screen name="publicacion/mis-publicaciones" />
      </Stack>
    </AuthProvider>
  );
}
