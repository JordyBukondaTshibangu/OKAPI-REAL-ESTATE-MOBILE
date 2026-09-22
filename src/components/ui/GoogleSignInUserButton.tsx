import React, { useState } from "react";
import { NativeModules, TouchableOpacity, Text, View, ActivityIndicator } from "react-native";
import { router } from "expo-router";

let GoogleSignin: any = null;
let statusCodes: Record<string, string> = {};

if (NativeModules.RNGoogleSignin) {
  const mod = require("@react-native-google-signin/google-signin");
  GoogleSignin = mod.GoogleSignin;
  statusCodes = mod.statusCodes ?? {};
}
import { googleSignInUser } from "../../services/auth";
import { useAuthStore } from "../../store/useAuthStore";
import { useThemeStore } from "../../store/useThemeStore";
import { Colors } from "../../constants/colors";

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

interface Props {
  label?: string;
  onError?: (msg: string) => void;
}

export default function GoogleSignInUserButton({ label = "Continuer avec Google", onError }: Props) {
  const { setAuth } = useAuthStore();
  const { theme } = useThemeStore();
  const isDark = theme === "dark";
  const [loading, setLoading] = useState(false);

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

      const { access_token, user } = await googleSignInUser(idToken);
      setAuth(access_token, user);
      router.replace("/(tabs)/compte");
    } catch (e: any) {
      if (e.code === statusCodes.SIGN_IN_CANCELLED) {
        // User cancelled — silent
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
