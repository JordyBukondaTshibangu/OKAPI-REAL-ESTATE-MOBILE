import { Stack } from "expo-router";
import { useThemeStore } from "../../../src/store/useThemeStore";
import { Colors } from "../../../src/constants/colors";
import { useT } from "../../../src/i18n/useT";

export default function CompteLayout() {
  const { theme } = useThemeStore();
  const t = useT();
  const isDark = theme === "dark";

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: isDark ? Colors.dark.card : Colors.white },
        headerTintColor: isDark ? Colors.dark.foreground : Colors.foreground,
        headerTitleStyle: { color: isDark ? Colors.dark.foreground : Colors.foreground, fontFamily: "DMSans_600SemiBold" },
        headerBackTitle: t.nav.account,
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="profil" options={{ title: t.user.profile }} />
      <Stack.Screen name="favoris" options={{ title: t.user.favorites }} />
      <Stack.Screen name="alertes" options={{ title: t.user.alerts }} />
      <Stack.Screen name="demandes" options={{ title: t.user.enquiries }} />
      <Stack.Screen name="avis" options={{ title: t.user.reviews }} />
      <Stack.Screen name="parametres" options={{ title: t.user.settings }} />
    </Stack>
  );
}
