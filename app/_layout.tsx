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
import { useAuthStore } from "../src/store/useAuthStore";
import { Colors } from "../src/constants/colors";
import { useT } from "../src/i18n/useT";
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
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  // Wait for both stores to rehydrate from AsyncStorage before navigating.
  // Without this, both flags default to false on first render, causing premature redirects.
  const [hydrated, setHydrated] = useState(
    () => useOnboardingStore.persist.hasHydrated() && useAuthStore.persist.hasHydrated()
  );

  useEffect(() => {
    if (hydrated) return;
    let onboardingReady = useOnboardingStore.persist.hasHydrated();
    let authReady = useAuthStore.persist.hasHydrated();

    const trySetHydrated = () => {
      if (onboardingReady && authReady) setHydrated(true);
    };

    const unsub1 = useOnboardingStore.persist.onFinishHydration(() => {
      onboardingReady = true;
      trySetHydrated();
    });
    const unsub2 = useAuthStore.persist.onFinishHydration(() => {
      authReady = true;
      trySetHydrated();
    });
    return () => { unsub1(); unsub2(); };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (isAuthenticated) {
      router.replace("/(tabs)/louer");
    } else if (!hasCompleted) {
      router.replace("/(onboarding)");
    }
  }, [hydrated, hasCompleted, isAuthenticated]);

  return null;
}

export default function RootLayout() {
  const theme = useThemeStore((s) => s.theme);
  const t = useT();
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
            options={{ headerShown: true, title: t.property.screenTitle, headerBackTitle: t.common.back }}
          />
          <Stack.Screen
            name="agents/[id]"
            options={{ headerShown: true, title: t.agent.profileTitle, headerBackTitle: t.common.back }}
          />
          <Stack.Screen
            name="agences/index"
            options={{ headerShown: true, title: t.agency.agenciesTitle, headerBackTitle: t.common.back }}
          />
          <Stack.Screen
            name="agences/[id]"
            options={{ headerShown: true, title: t.agency.title, headerBackTitle: t.common.back }}
          />
          <Stack.Screen
            name="blog/index"
            options={{ headerShown: true, title: t.blog.title, headerBackTitle: t.common.back }}
          />
          <Stack.Screen
            name="blog/[slug]"
            options={{ headerShown: true, title: t.blog.articleTitle, headerBackTitle: t.blog.title }}
          />
          <Stack.Screen
            name="conseils/index"
            options={{ headerShown: true, title: t.nav.conseils, headerBackTitle: t.common.back }}
          />
          <Stack.Screen
            name="conseils/[slug]"
            options={{ headerShown: true, title: t.nav.conseils, headerBackTitle: t.nav.conseils }}
          />
        </Stack>
      </QueryProvider>
    </GestureHandlerRootView>
  );
}
