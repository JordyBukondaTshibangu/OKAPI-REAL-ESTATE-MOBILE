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
import { redirectAfterOnboarding } from "../src/utils/onboardingRedirect";
import { useAgentSessionStore } from "../src/store/useAgentSessionStore";
import { Colors } from "../src/constants/colors";
import { useT } from "../src/i18n/useT";
import { registerForPushNotifications } from "../src/services/notifications";
import { ToastProvider } from "../src/context/ToastContext";
import { configureGoogleSignIn } from "../src/components/ui/GoogleSignInButton";
import { setupApiInterceptors } from "../src/lib/apiClient";
import { useNetworkStatus } from "../src/hooks/useNetworkStatus";
import OfflineScreen from "../src/components/ui/OfflineScreen";
import { initSentry, setSentryUser } from "../src/lib/sentry";
import { clearIfEnvChanged } from "../src/lib/envGuard";
import "../global.css";

SplashScreen.preventAutoHideAsync();
configureGoogleSignIn();
setupApiInterceptors();
initSentry();
// Start the env guard immediately at module load — BEFORE any component mounts
// or Zustand store hydrates. The promise is awaited in RootLayout so the app
// never renders children (and stores never hydrate) until the clear is done.
const envGuardReady = clearIfEnvChanged();

function ThemeSyncer() {
  const theme = useThemeStore((s) => s.theme);
  useEffect(() => {
    colorScheme.set(theme);
  }, [theme]);
  return <StatusBar style={theme === "dark" ? "light" : "dark"} animated />;
}

function PushRegistrar() {
  const token = useAuthStore((s) => s.token);
  const user  = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (isAuthenticated && token) {
      registerForPushNotifications(token).catch(() => {});
      // Attach user identity to Sentry so crashes are linkable to a user
      if (user) {
        setSentryUser({ id: user.id, email: user.email, name: `${user.firstName} ${user.lastName}` });
      }
    } else {
      setSentryUser(null);
    }
  }, [isAuthenticated, token, user]);

  return null;
}

function OnboardingGate() {
  const hasCompleted = useOnboardingStore((s) => s.hasCompletedOnboarding);
  // Note: searchRedirectPending is intentionally NOT subscribed here.
  // We read it via getState() inside the effect so that clearing the flag
  // (setSearchRedirectPending(false)) doesn't re-trigger the effect and cause
  // a double-navigation to /(tabs) after the filter redirect.
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isAgentAuthenticated = useAgentSessionStore((s) => s.isAuthenticated);

  // Wait for all three stores to rehydrate from AsyncStorage before navigating.
  const [hydrated, setHydrated] = useState(
    () =>
      useOnboardingStore.persist.hasHydrated() &&
      useAuthStore.persist.hasHydrated() &&
      useAgentSessionStore.persist.hasHydrated()
  );

  useEffect(() => {
    if (hydrated) return;
    let onboardingReady = useOnboardingStore.persist.hasHydrated();
    let authReady = useAuthStore.persist.hasHydrated();
    let agentReady = useAgentSessionStore.persist.hasHydrated();

    const trySetHydrated = () => {
      if (onboardingReady && authReady && agentReady) setHydrated(true);
    };

    const unsub1 = useOnboardingStore.persist.onFinishHydration(() => {
      onboardingReady = true;
      trySetHydrated();
    });
    const unsub2 = useAuthStore.persist.onFinishHydration(() => {
      authReady = true;
      trySetHydrated();
    });
    const unsub3 = useAgentSessionStore.persist.onFinishHydration(() => {
      agentReady = true;
      trySetHydrated();
    });
    return () => { unsub1(); unsub2(); unsub3(); };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (isAuthenticated || isAgentAuthenticated) {
      // Read searchRedirectPending fresh from the store each time the effect runs
      // (not via subscription — see comment above) so that clearing the flag
      // doesn't re-trigger this effect and cause a second navigation.
      const { searchRedirectPending, setSearchRedirectPending } = useOnboardingStore.getState();
      if (searchRedirectPending) {
        // User just completed onboarding and registered/signed in — redirect to
        // search with their saved filters instead of bare /(tabs).
        setSearchRedirectPending(false);
        redirectAfterOnboarding();
      } else {
        // Returning user or agent — go straight to the main tab.
        router.replace("/(tabs)");
      }
    } else if (!hasCompleted) {
      router.replace("/(onboarding)");
    }
  }, [hydrated, hasCompleted, isAuthenticated, isAgentAuthenticated]);
  // Note: searchRedirectPending deliberately excluded from deps (see comment above)

  return null;
}

export default function RootLayout() {
  const theme = useThemeStore((s) => s.theme);
  const t = useT();
  const isDark = theme === "dark";
  const { isConnected, isInternetReachable } = useNetworkStatus();
  const isOffline = !isConnected || isInternetReachable === false;

  // Block rendering until the env guard has finished clearing stale auth data.
  // This prevents Zustand stores from hydrating with QA tokens before the clear
  // runs — which would cause a "logged in on wrong env" flash on first launch.
  const [envReady, setEnvReady] = useState(false);
  useEffect(() => {
    envGuardReady.then(() => setEnvReady(true));
  }, []);

  const [loaded] = useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
  });

  useEffect(() => {
    // Keep splash up until BOTH fonts are loaded AND env guard has finished.
    // This guarantees stores hydrate from a clean AsyncStorage.
    if (loaded && envReady) SplashScreen.hideAsync();
  }, [loaded, envReady]);

  if (!loaded || !envReady) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryProvider>
        <ToastProvider>
        <ThemeSyncer />
        <PushRegistrar />
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
          {isOffline && <OfflineScreen />}
        </ToastProvider>
      </QueryProvider>
    </GestureHandlerRootView>
  );
}
