import React, { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Bell, Heart } from "lucide-react-native";
import AgentAnnoncesScreen from "../espace-agent/annonces/index";
import AlertesScreen from "./compte/alertes";
import FavorisScreen from "./compte/favoris";
import { useAgentSessionStore } from "../../src/store/useAgentSessionStore";
import { useAuthStore } from "../../src/store/useAuthStore";
import { useThemeStore } from "../../src/store/useThemeStore";
import { useT } from "../../src/i18n/useT";
import { Colors } from "../../src/constants/colors";

type Tab = "alertes" | "favoris";

export default function LouerScreen() {
  const { isAuthenticated: isAgentLoggedIn } = useAgentSessionStore();
  const { isAuthenticated: isUserLoggedIn } = useAuthStore();
  const { theme } = useThemeStore();
  const t = useT();
  const isDark = theme === "dark";
  const [activeTab, setActiveTab] = useState<Tab>("alertes");

  // Agents: show their listings portal inline (tab bar stays visible)
  if (isAgentLoggedIn) return <AgentAnnoncesScreen showBackButton={false} />;

  const bgColor     = isDark ? Colors.dark.background : Colors.backgroundAlt;
  const cardBg      = isDark ? Colors.dark.card       : Colors.white;
  const borderColor = isDark ? Colors.dark.border     : Colors.border;
  const textMain    = isDark ? Colors.dark.foreground : Colors.foreground;
  const textMuted   = isDark ? Colors.dark.mutedFg    : Colors.mutedFg;
  const primary     = isDark ? Colors.dark.primary    : Colors.primary;

  const TABS: { key: Tab; label: string; Icon: typeof Bell }[] = [
    { key: "alertes", label: t.nav.alerts,    Icon: Bell  },
    { key: "favoris", label: t.user.favorites ?? "Favoris", Icon: Heart },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bgColor }} edges={["top"]}>
      {/* Header */}
      <View style={{
        backgroundColor: cardBg,
        borderBottomColor: borderColor,
        borderBottomWidth: 1,
        paddingHorizontal: 20,
        paddingTop: 18,
        paddingBottom: 0,
      }}>
        <Text style={{ color: textMain, fontSize: 22, fontFamily: "DMSans_700Bold", marginBottom: 14 }}>
          {activeTab === "alertes" ? t.nav.alerts : (t.user.favorites ?? "Favoris")}
        </Text>

        {/* Segmented tabs */}
        <View style={{ flexDirection: "row", gap: 0 }}>
          {TABS.map(({ key, label, Icon }) => {
            const active = activeTab === key;
            return (
              <TouchableOpacity
                key={key}
                onPress={() => setActiveTab(key)}
                style={{
                  flex: 1,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  paddingVertical: 11,
                  borderBottomWidth: 2.5,
                  borderBottomColor: active ? primary : "transparent",
                }}
                activeOpacity={0.75}
              >
                <Icon size={15} color={active ? primary : textMuted} />
                <Text style={{
                  fontSize: 14,
                  fontFamily: active ? "DMSans_700Bold" : "DMSans_400Regular",
                  color: active ? primary : textMuted,
                }}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Content */}
      {isUserLoggedIn ? (
        activeTab === "alertes" ? <AlertesScreen /> : <FavorisScreen />
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
