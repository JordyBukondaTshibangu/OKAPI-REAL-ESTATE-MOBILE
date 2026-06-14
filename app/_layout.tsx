import { Stack, router } from "expo-router";
import {
  useFonts,
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_700Bold,
} from "@expo-google-fonts/dm-sans";
import { useEffect, useState } from "react";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { colorScheme } from "nativewind";
import QueryProvider from "../src/components/QueryProvider";
import { useThemeStore } from "../src/store/useThemeStore";
import { useOnboardingStore } from "../src/store/useOnboardingStore";
import { Colors } from "../src/constants/colors";
import "../global.css";

SplashScreen.preventAutoHideAsync();

function ThemeSyncer() {
  const theme = useThemeStore((s) => s.theme);
  useEffect(() => {
    colorScheme.set(theme);
  }, [theme]);
  return <StatusBar style={theme === "dark" ? "light" : "dark"} animated />;
}

function OnboardingGate() {
  const hasCompleted = useOnboardingStore((s) => s.hasCompletedOnboarding);
  // Wait for AsyncStorage rehydration before navigating.
  // Without this check, hasCompleted is `false` on first render (Zustand default),
  // causing router.replace to fire before the Stack navigator is mounted — which
  // corrupts the navigation context and crashes lazily-loaded tabs (e.g. agents).
  const [hydrated, setHydrated] = useState(
    () => useOnboardingStore.persist.hasHydrated()
  );

  useEffect(() => {
    if (hydrated) return;
    const unsub = useOnboardingStore.persist.onFinishHydration(() => {
      setHydrated(true);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (hydrated && !hasCompleted) {
      router.replace("/(onboarding)");
    }
  }, [hydrated, hasCompleted]);

  return null;
}

export default function RootLayout() {
  const theme = useThemeStore((s) => s.theme);
  const isDark = theme === "dark";

  const [loaded] = useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
  });

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryProvider>
        <ThemeSyncer />
        <OnboardingGate />
        <Stack
          screenOptions={{
            headerShown: false,
            headerStyle: { backgroundColor: isDark ? Colors.dark.card : Colors.white },
            headerTintColor: isDark ? Colors.dark.foreground : Colors.foreground,
            headerTitleStyle: { color: isDark ? Colors.dark.foreground : Colors.foreground, fontFamily: "DMSans_600SemiBold" },
          }}
        >
          <Stack.Screen name="(onboarding)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen
            name="property/[id]"
            options={{ headerShown: true, title: "Détail du bien", headerBackTitle: "Retour" }}
          />
          <Stack.Screen
            name="agents/[id]"
            options={{ headerShown: true, title: "Profil agent", headerBackTitle: "Retour" }}
          />
          <Stack.Screen
            name="agences/index"
            options={{ headerShown: true, title: "Agences", headerBackTitle: "Retour" }}
          />
          <Stack.Screen
            name="agences/[id]"
            options={{ headerShown: true, title: "Agence", headerBackTitle: "Retour" }}
          />
          <Stack.Screen
            name="blog/index"
            options={{ headerShown: true, title: "Blog", headerBackTitle: "Retour" }}
          />
          <Stack.Screen
            name="blog/[slug]"
            options={{ headerShown: true, title: "Article", headerBackTitle: "Blog" }}
          />
          <Stack.Screen
            name="conseils/index"
            options={{ headerShown: true, title: "Conseils", headerBackTitle: "Retour" }}
          />
          <Stack.Screen
            name="conseils/[slug]"
            options={{ headerShown: true, title: "Conseils", headerBackTitle: "Conseils" }}
          />
        </Stack>
      </QueryProvider>
    </GestureHandlerRootView>
  );
}
