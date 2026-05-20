import { Stack } from "expo-router";
import { useFonts, DMSans_400Regular, DMSans_500Medium, DMSans_600SemiBold, DMSans_700Bold } from "@expo-google-fonts/dm-sans";
import { useEffect } from "react";
import * as SplashScreen from "expo-splash-screen";
import QueryProvider from "../src/components/QueryProvider";
import "../global.css";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded] = useFonts({ DMSans_400Regular, DMSans_500Medium, DMSans_600SemiBold, DMSans_700Bold });

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded) return null;

  return (
    <QueryProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="property/[id]" options={{ headerShown: true, title: "Détail du bien", headerBackTitle: "Retour" }} />
        <Stack.Screen name="agents/[id]" options={{ headerShown: true, title: "Profil agent", headerBackTitle: "Retour" }} />
        <Stack.Screen name="agences/[id]" options={{ headerShown: true, title: "Agence", headerBackTitle: "Retour" }} />
        <Stack.Screen name="blog/index" options={{ headerShown: true, title: "Blog", headerBackTitle: "Retour" }} />
        <Stack.Screen name="blog/[slug]" options={{ headerShown: true, title: "Article", headerBackTitle: "Blog" }} />
        <Stack.Screen name="conseils/index" options={{ headerShown: true, title: "Conseils", headerBackTitle: "Retour" }} />
        <Stack.Screen name="conseils/[slug]" options={{ headerShown: true, title: "Conseils", headerBackTitle: "Conseils" }} />
      </Stack>
    </QueryProvider>
  );
}
