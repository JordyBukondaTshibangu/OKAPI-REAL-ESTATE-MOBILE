import { Stack } from "expo-router";
import { useThemeStore } from "../../../src/store/useThemeStore";
import { Colors } from "../../../src/constants/colors";

export default function CompteLayout() {
  const { theme } = useThemeStore();
  const isDark = theme === "dark";

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: isDark ? Colors.dark.card : Colors.white },
        headerTintColor: isDark ? Colors.dark.foreground : Colors.foreground,
        headerTitleStyle: { color: isDark ? Colors.dark.foreground : Colors.foreground, fontFamily: "DMSans_600SemiBold" },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="profil" options={{ title: "Mon Profil", headerBackTitle: "Compte" }} />
      <Stack.Screen name="favoris" options={{ title: "Mes Favoris", headerBackTitle: "Compte" }} />
      <Stack.Screen name="alertes" options={{ title: "Mes Alertes", headerBackTitle: "Compte" }} />
      <Stack.Screen name="demandes" options={{ title: "Mes Demandes", headerBackTitle: "Compte" }} />
      <Stack.Screen name="avis" options={{ title: "Mes Avis", headerBackTitle: "Compte" }} />
      <Stack.Screen name="parametres" options={{ title: "Paramètres", headerBackTitle: "Compte" }} />
    </Stack>
  );
}
