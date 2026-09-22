import React, { useState } from "react";
import { TouchableOpacity, Text, View, ActivityIndicator } from "react-native";
import { router } from "expo-router";

// @react-native-google-signin requires a native binary — not available in Expo Go.
// Lazy-require with a try/catch so the module is silently absent in Expo Go
// but fully functional in dev/production builds.
let GoogleSignin: any = null;
let statusCodes: Record<string, string> = {};
try {
  const mod = require("@react-native-google-signin/google-signin");
  GoogleSignin = mod.GoogleSignin;
  statusCodes = mod.statusCodes ?? {};
} catch {
  // Expo Go or any environment where the native module isn't compiled in.
}
import { googleSignInAgent, getAgentMe } from "../../services/agentAuth";
import { useAgentSessionStore } from "../../store/useAgentSessionStore";
import { useThemeStore } from "../../store/useThemeStore";
import { Colors } from "../../constants/colors";

// ─── Configure once at app start ─────────────────────────────────────────────
// Call this from your root _layout.tsx or wherever you initialise Expo
export function configureGoogleSignIn() {
  if (!GoogleSignin) return; // no-op in Expo Go
  GoogleSignin.configure({
    // Web client ID (also used for Android)
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    // iOS client ID — required on iOS
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    offlineAccess: false,
  });
}

// ─── Google "G" logo SVG as a simple text mark ───────────────────────────────
// Using a styled "G" since we cannot import SVGs inline in RN without a library
function GoogleLogo() {
  return (
    <View style={{
      width: 20, height: 20, borderRadius: 10,
      backgroundColor: "#fff",
      alignItems: "center", justifyContent: "center",
    }}>
      <Text style={{ fontSize: 13, fontFamily: "DMSans_700Bold", color: "#4285F4" }}>G</Text>
    </View>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  label?: string;
  onError?: (msg: string) => void;
}

export default function GoogleSignInButton({ label = "Continuer avec Google", onError }: Props) {
  const { setSession } = useAgentSessionStore();
  const { theme } = useThemeStore();
  const isDark = theme === "dark";

  const [loading, setLoading] = useState(false);

  // Don't render the button in Expo Go — native module is unavailable
  if (!GoogleSignin) return null;

  async function handlePress() {
    setLoading(true);
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const idToken = userInfo.data?.idToken;

      if (!idToken) {
        onError?.("Google n'a pas fourni de token — réessayez.");
        return;
      }

      const { access_token } = await googleSignInAgent(idToken);
      const agent = await getAgentMe(access_token);
      setSession(access_token, agent);

      // Route based on verification state (same logic as email/password login)
      if (!agent.emailVerified && agent.verificationTier === "NON_VERIFIE") {
        router.replace("/(auth)/agent-verification" as any);
      } else if (agent.agentType === "AGENCY_OWNER" && agent.agencyId) {
        router.replace("/espace-agence" as any);
      } else {
        router.replace("/espace-agent" as any);
      }
    } catch (e: any) {
      if (e.code === statusCodes.SIGN_IN_CANCELLED) {
        // User cancelled — no error to show
      } else if (e.code === statusCodes.IN_PROGRESS) {
        // Already signing in
      } else if (e.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        onError?.("Google Play Services non disponible sur cet appareil.");
      } else {
        const msg = e?.response?.data?.message ?? e?.message ?? "Erreur Google Sign-In";
        onError?.(Array.isArray(msg) ? msg[0] : msg);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.8}
      disabled={loading}
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        height: 48,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: isDark ? Colors.dark.border : Colors.border,
        backgroundColor: isDark ? Colors.dark.card : Colors.white,
        paddingHorizontal: 16,
      }}
    >
      {loading ? (
        <ActivityIndicator size="small" color={isDark ? Colors.dark.primary : Colors.primary} />
      ) : (
        <>
          <GoogleLogo />
          <Text style={{
            color: isDark ? Colors.dark.foreground : Colors.foreground,
            fontSize: 14,
            fontFamily: "DMSans_600SemiBold",
          }}>
            {label}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}
