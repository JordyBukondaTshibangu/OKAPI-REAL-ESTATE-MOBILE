import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Bell } from "lucide-react-native";
import AgentAnnoncesScreen from "../espace-agent/annonces/index";
import AlertesScreen from "./compte/alertes";
import { useAgentSessionStore } from "../../src/store/useAgentSessionStore";
import { useAuthStore } from "../../src/store/useAuthStore";
import { useThemeStore } from "../../src/store/useThemeStore";
import { useT } from "../../src/i18n/useT";
import { Colors } from "../../src/constants/colors";

export default function LouerScreen() {
  const { isAuthenticated: isAgentLoggedIn } = useAgentSessionStore();
  const { isAuthenticated: isUserLoggedIn } = useAuthStore();
  const { theme } = useThemeStore();
  const t = useT();
  const isDark = theme === "dark";

  // Agents: show their listings portal inline (tab bar stays visible)
  if (isAgentLoggedIn) return <AgentAnnoncesScreen showBackButton={false} />;

  // Users: show Alertes tab
  const bgColor     = isDark ? Colors.dark.background : Colors.backgroundAlt;
  const cardBg      = isDark ? Colors.dark.card       : Colors.white;
  const borderColor = isDark ? Colors.dark.border     : Colors.border;
  const textMain    = isDark ? Colors.dark.foreground : Colors.foreground;
  const textMuted   = isDark ? Colors.dark.mutedFg    : Colors.mutedFg;
  const primary     = isDark ? Colors.dark.primary    : Colors.primary;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bgColor }} edges={["top"]}>
      {/* Header */}
      <View style={{
        backgroundColor: cardBg,
        borderBottomColor: borderColor,
        borderBottomWidth: 1,
        paddingHorizontal: 20,
        paddingTop: 18,
        paddingBottom: 14,
      }}>
        <Text style={{ color: textMain, fontSize: 22, fontFamily: "DMSans_700Bold" }}>
          {t.nav.alerts}
        </Text>
        <Text style={{ color: textMuted, fontSize: 12, marginTop: 2 }}>
          {t.alerts.subtitle}
        </Text>
      </View>

      {/* Content */}
      {isUserLoggedIn ? (
        <AlertesScreen />
      ) : (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 32 }}>
          <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: isDark ? Colors.dark.accent : Colors.accent, alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
            <Bell size={28} color={primary} />
          </View>
          <Text style={{ color: textMain, fontSize: 18, fontFamily: "DMSans_700Bold", textAlign: "center", marginBottom: 8 }}>
            {t.alerts.loginTitle}
          </Text>
          <Text style={{ color: textMuted, fontSize: 14, textAlign: "center", lineHeight: 20, marginBottom: 24 }}>
            {t.alerts.loginDesc}
          </Text>
          <TouchableOpacity
            onPress={() => router.push("/(auth)/connexion")}
            style={{ backgroundColor: primary, paddingHorizontal: 28, paddingVertical: 13, borderRadius: 14 }}
          >
            <Text style={{ color: "#fff", fontSize: 15, fontFamily: "DMSans_600SemiBold" }}>
              {t.auth.login}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}
