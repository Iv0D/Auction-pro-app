import { router } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import CustomButton from "../../src/components/ui/CustomButton";
import CustomCard from "../../src/components/ui/CustomCard";
import ScreenHeader from "../../src/components/ui/ScreenHeader";
import { COLORS, SPACING } from "../../src/constants/theme";

export default function TermsScreen() {
  return (
    <View style={styles.container}>
      <ScreenHeader title="Términos y condiciones" />

      <ScrollView contentContainerStyle={styles.content}>
        {sections.map((section) => (
          <CustomCard key={section.title}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionText}>{section.text}</Text>
          </CustomCard>
        ))}

        <CustomButton
          title="Volver al registro"
          onPress={() => router.back()}
        />
      </ScrollView>
    </View>
  );
}

const sections = [
  {
    title: "Introducción",
    text: "AuctionPro brinda una plataforma curada para subastas premium en vivo y programadas.",
  },
  {
    title: "Responsabilidades",
    text: "Los usuarios son responsables de verificar los ítems y asegurar la disponibilidad de fondos antes de pujar.",
  },
  {
    title: "Reglas de subasta",
    text: "Las pujas deben respetar los incrementos establecidos según la categoría del producto.",
  },
  {
    title: "Pagos",
    text: "Las pujas ganadoras deberán abonarse mediante un método de pago verificado.",
  },
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.lg,
    gap: SPACING.md,
    paddingBottom: 80,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: "700",
    marginBottom: SPACING.xs,
  },
  sectionText: {
    color: COLORS.muted,
    fontSize: 15,
    lineHeight: 22,
  },
});
