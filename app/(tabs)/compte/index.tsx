import React from "react";
import {
  View, Text, TouchableOpacity, FlatList, Alert, ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useAuthStore } from "../../../src/store/useAuthStore";
import { useAgentSessionStore } from "../../../src/store/useAgentSessionStore";
import { useThemeStore } from "../../../src/store/useThemeStore";
import { useLocaleStore } from "../../../src/store/useLocaleStore";
import { useT } from "../../../src/i18n/useT";
import Avatar from "../../../src/components/ui/Avatar";
import Button from "../../../src/components/ui/Button";
import ThemeToggle from "../../../src/components/ui/ThemeToggle";
import LanguageSwitcher from "../../../src/components/ui/LanguageSwitcher";
import { Colors } from "../../../src/constants/colors";
import {
  ChevronRight, User, Heart, MessageSquare, Bell, Star,
  LogOut, Settings, Sun, Moon, Globe, UserCheck, Building2, ArrowRight,
} from "lucide-react-native";
import { API_URL } from "../../../src/constants/api";

const MENU_ITEMS = [
  { key: "profil",      icon: User,         href: "/(tabs)/compte/profil"     },
  { key: "favoris",     icon: Heart,        href: "/(tabs)/compte/favoris"    },
  { key: "demandes",    icon: MessageSquare,href: "/(tabs)/compte/demandes"   },
  { key: "alertes",     icon: Bell,         href: "/(tabs)/compte/alertes"    },
  { key: "avis",        icon: Star,         href: "/(tabs)/compte/avis"       },
  { key: "parametres",  icon: Settings,     href: "/(tabs)/compte/parametres" },
] as const;

export default function CompteScreen() {
  const t = useT();
  const { isAuthenticated, user, logout } = useAuthStore();
  const { agent: agentSession, isAuthenticated: isAgentAuth, logout: agentLogout } = useAgentSessionStore();
  const { theme, setTheme } = useThemeStore();
  const { locale, setLocale } = useLocaleStore();
  const isDark = theme === "dark";

  const bgColor   = isDark ? Colors.dark.background : Colors.backgroundAlt;
  const cardBg    = isDark ? Colors.dark.card        : Colors.white;
  const borderC   = isDark ? Colors.dark.border      : Colors.border;
  const textMain  = isDark ? Colors.dark.foreground  : Colors.foreground;
  const textMut   = isDark ? Colors.dark.mutedFg     : Colors.mutedFg;
  const accentBg  = isDark ? Colors.dark.accent      : Colors.accent;
  const iconC     = isDark ? Colors.dark.primary     : Colors.primary;

  const menuLabels: Record<string, string> = {
    profil: t.user.profile, favoris: t.user.favorites,
    demandes: t.user.enquiries, alertes: t.user.alerts,
    avis: t.user.reviews, parametres: t.user.settings,
  };

  const localeFull: Record<string, string> = { fr: "Français", en: "English", ln: "Lingala" };

  function handleLanguagePicker() {
    Alert.alert(t.settings.languageTitle, t.settings.chooseLanguage, [
      { text: `Français${locale === "fr" ? " ✓" : ""}`, onPress: () => setLocale("fr") },
      { text: `English${locale === "en" ? " ✓" : ""}`,  onPress: () => setLocale("en") },
      { text: `Lingala${locale === "ln" ? " ✓" : ""}`,  onPress: () => setLocale("ln") },
      { text: t.common.cancel, style: "cancel" },
    ]);
  }

  function handleLogout() {
    Alert.alert(t.user.logout, t.user.deleteConfirm.replace("compte", "session"), [
      { text: t.common.cancel, style: "cancel" },
      { text: t.user.logout, style: "destructive", onPress: logout },
    ]);
  }

  function handleAgentLogout() {
    Alert.alert(t.agentAuth.logoutTitle, t.agentAuth.logoutMsg, [
      { text: t.common.cancel, style: "cancel" },
      { text: t.agentAuth.logoutConfirm, style: "destructive", onPress: agentLogout },
    ]);
  }

  // ── Agent session view ──────────────────────────────────────────────────────
  if (isAgentAuth && agentSession) {
    const isAgencyOwner = agentSession.agentType === "AGENCY_OWNER" && !!agentSession.agencyId;
    const portalHref = isAgencyOwner ? "/espace-agence" : "/espace-agent";
    const spaceLabel = isAgencyOwner ? t.agentAuth.agencySpace : t.agentAuth.agentSpace;
    const spaceDesc  = isAgencyOwner ? t.agentAuth.agencySpaceDesc : t.agentAuth.agentSpaceDesc;
    const SpaceIcon  = isAgencyOwner ? Building2 : UserCheck;

    const initials = agentSession.name
      .split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();

    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: bgColor }} edges={["top"]}>
        <ScrollView showsVerticalScrollIndicator={false}>

          {/* Header */}
          <View style={{ backgroundColor: Colors.navy, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 28 }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <Text style={{ color: "#fff", fontSize: 18, fontFamily: "DMSans_700Bold" }}>
                {t.nav.account}
              </Text>
              <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
                <LanguageSwitcher />
                <ThemeToggle />
              </View>
            </View>

            {/* Agent info */}
            <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
              <View style={{
                width: 52, height: 52, borderRadius: 26,
                backgroundColor: Colors.secondary,
                alignItems: "center", justifyContent: "center",
                borderWidth: 2, borderColor: "rgba(255,255,255,0.3)",
              }}>
                <Text style={{ color: Colors.navy, fontSize: 18, fontFamily: "DMSans_700Bold" }}>
                  {initials}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: "rgba(201,162,39,0.8)", fontSize: 10, fontFamily: "DMSans_600SemiBold", letterSpacing: 1, textTransform: "uppercase", marginBottom: 2 }}>
                  {spaceLabel}
                </Text>
                <Text style={{ color: "#fff", fontSize: 16, fontFamily: "DMSans_700Bold" }}>
                  {agentSession.name}
                </Text>
                <Text style={{ color: "rgba(255,255,255,0.55)", fontSize: 12, marginTop: 1 }}>
                  {agentSession.email}
                </Text>
              </View>
            </View>
          </View>

          {/* Portal card */}
          <View style={{ margin: 16 }}>
            <TouchableOpacity
              onPress={() => router.push(portalHref as any)}
              style={{
                backgroundColor: cardBg,
                borderRadius: 16, padding: 16,
                borderWidth: 1, borderColor: borderC,
                flexDirection: "row", alignItems: "center", gap: 14,
                shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
                shadowOpacity: isDark ? 0.2 : 0.06, shadowRadius: 8, elevation: 2,
              }}
            >
              <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: `${iconC}20`, alignItems: "center", justifyContent: "center" }}>
                <SpaceIcon size={22} color={iconC} strokeWidth={1.8} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: textMain, fontSize: 15, fontFamily: "DMSans_600SemiBold" }}>
                  {t.agentAuth.mySpace}
                </Text>
                <Text style={{ color: textMut, fontSize: 12, marginTop: 2 }}>
                  {spaceDesc}
                </Text>
              </View>
              <ArrowRight size={18} color={textMut} />
            </TouchableOpacity>
          </View>

          {/* Preferences */}
          <View style={{ marginHorizontal: 16, marginBottom: 12, backgroundColor: cardBg, borderRadius: 16, borderWidth: 1, borderColor: borderC, overflow: "hidden" }}>
            <View style={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8 }}>
              <Text style={{ color: textMut, fontSize: 11, fontFamily: "DMSans_600SemiBold", letterSpacing: 0.8, textTransform: "uppercase" }}>
                {t.user.preferences}
              </Text>
            </View>

            {/* Theme */}
            <TouchableOpacity
              onPress={() => setTheme(isDark ? "light" : "dark")}
              style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 14, borderTopWidth: 1, borderTopColor: borderC }}
            >
              <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: accentBg, alignItems: "center", justifyContent: "center" }}>
                {isDark ? <Moon size={18} color={iconC} strokeWidth={1.8} /> : <Sun size={18} color={iconC} strokeWidth={1.8} />}
              </View>
              <Text style={{ flex: 1, color: textMain, fontSize: 15, fontFamily: "DMSans_500Medium" }}>
                {isDark ? t.settings.darkMode : t.settings.lightMode}
              </Text>
            </TouchableOpacity>

            {/* Language */}
            <TouchableOpacity
              onPress={handleLanguagePicker}
              style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 14, borderTopWidth: 1, borderTopColor: borderC }}
            >
              <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: accentBg, alignItems: "center", justifyContent: "center" }}>
                <Globe size={18} color={iconC} strokeWidth={1.8} />
              </View>
              <Text style={{ flex: 1, color: textMain, fontSize: 15, fontFamily: "DMSans_500Medium" }}>
                {t.settings.language}
              </Text>
              <Text style={{ color: textMut, fontSize: 14 }}>{localeFull[locale]}</Text>
              <ChevronRight size={16} color={textMut} />
            </TouchableOpacity>
          </View>

          {/* Logout */}
          <TouchableOpacity
            onPress={handleAgentLogout}
            style={{ marginHorizontal: 16, marginBottom: 32, backgroundColor: cardBg, borderRadius: 16, borderWidth: 1, borderColor: borderC, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 14 }}
          >
            <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: isDark ? "#2d1515" : "#fff1f1", alignItems: "center", justifyContent: "center" }}>
              <LogOut size={18} color={isDark ? Colors.dark.destructive : Colors.destructive} />
            </View>
            <Text style={{ color: isDark ? Colors.dark.destructive : Colors.destructive, fontSize: 15, fontFamily: "DMSans_500Medium" }}>
              {t.agentAuth.logoutConfirm}
            </Text>
          </TouchableOpacity>

        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Guest view ──────────────────────────────────────────────────────────────
  if (!isAuthenticated || !user) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: bgColor }} edges={["top"]}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20 }}>
            <Text style={{ color: textMain, fontSize: 22, fontFamily: "DMSans_700Bold", marginBottom: 20 }}>
              {t.nav.account}
            </Text>

            {/* Guest avatar */}
            <View style={{ alignItems: "center", paddingVertical: 28 }}>
              <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: accentBg, alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
                <User size={36} color={iconC} />
              </View>
              <Text style={{ color: textMain, fontSize: 18, fontFamily: "DMSans_700Bold", marginBottom: 6 }}>
                {t.nav.account}
              </Text>
              <Text style={{ color: textMut, fontSize: 14, textAlign: "center", lineHeight: 20, maxWidth: 260 }}>
                {t.user.loginPrompt}
              </Text>
            </View>

            {/* Regular auth buttons */}
            <Button onPress={() => router.push("/(auth)/connexion")} style={{ marginBottom: 10 }}>
              {t.user.loginBtn}
            </Button>
            <Button variant="outline" onPress={() => router.push("/(auth)/inscription")} style={{ marginBottom: 20 }}>
              {t.user.registerBtn}
            </Button>

            {/* Divider */}
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 20 }}>
              <View style={{ flex: 1, height: 1, backgroundColor: borderC }} />
              <Text style={{ color: textMut, fontSize: 12 }}>ou</Text>
              <View style={{ flex: 1, height: 1, backgroundColor: borderC }} />
            </View>

            {/* Agent login CTA */}
            <TouchableOpacity
              onPress={() => router.push("/(auth)/agent-connexion")}
              style={{
                flexDirection: "row", alignItems: "center", gap: 12,
                backgroundColor: cardBg, borderRadius: 16, padding: 16,
                borderWidth: 1, borderColor: borderC,
                shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
                shadowOpacity: isDark ? 0.2 : 0.05, shadowRadius: 6, elevation: 2,
              }}
            >
              <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.navy, alignItems: "center", justifyContent: "center" }}>
                <UserCheck size={22} color={Colors.secondary} strokeWidth={1.8} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: textMain, fontSize: 14, fontFamily: "DMSans_600SemiBold" }}>
                  {t.agentAuth.login}
                </Text>
                <Text style={{ color: textMut, fontSize: 12, marginTop: 1 }}>
                  {t.agentAuth.subtitle}
                </Text>
              </View>
              <ChevronRight size={16} color={textMut} />
            </TouchableOpacity>
          </View>

          {/* Quick settings */}
          <View style={{ marginHorizontal: 16, marginBottom: 32, backgroundColor: cardBg, borderRadius: 16, borderWidth: 1, borderColor: borderC, overflow: "hidden" }}>
            <View style={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8 }}>
              <Text style={{ color: textMut, fontSize: 11, fontFamily: "DMSans_600SemiBold", letterSpacing: 0.8, textTransform: "uppercase" }}>
                {t.user.preferences}
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => setTheme(isDark ? "light" : "dark")}
              style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 14, borderTopWidth: 1, borderTopColor: borderC }}
            >
              <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: accentBg, alignItems: "center", justifyContent: "center" }}>
                {isDark ? <Moon size={18} color={iconC} strokeWidth={1.8} /> : <Sun size={18} color={iconC} strokeWidth={1.8} />}
              </View>
              <Text style={{ flex: 1, color: textMain, fontSize: 15, fontFamily: "DMSans_500Medium" }}>
                {isDark ? t.settings.darkMode : t.settings.lightMode}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleLanguagePicker}
              style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 14, borderTopWidth: 1, borderTopColor: borderC }}
            >
              <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: accentBg, alignItems: "center", justifyContent: "center" }}>
                <Globe size={18} color={iconC} strokeWidth={1.8} />
              </View>
              <Text style={{ flex: 1, color: textMain, fontSize: 15, fontFamily: "DMSans_500Medium" }}>
                {t.settings.language}
              </Text>
              <Text style={{ color: textMut, fontSize: 14 }}>{localeFull[locale]}</Text>
              <ChevronRight size={16} color={textMut} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push("/(tabs)/compte/parametres" as any)}
              style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 14, borderTopWidth: 1, borderTopColor: borderC }}
            >
              <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: accentBg, alignItems: "center", justifyContent: "center" }}>
                <Settings size={18} color={iconC} strokeWidth={1.8} />
              </View>
              <Text style={{ flex: 1, color: textMain, fontSize: 15, fontFamily: "DMSans_500Medium" }}>
                {t.user.settings}
              </Text>
              <ChevronRight size={16} color={textMut} />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Authenticated regular user ───────────────────────────────────────────────
  const photoUri = user.profileImage
    ? user.profileImage.startsWith("http") ? user.profileImage : `${API_URL}/${user.profileImage}`
    : null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bgColor }} edges={["top"]}>
      {/* Profile header */}
      <View style={{ backgroundColor: cardBg, borderBottomColor: borderC, borderBottomWidth: 1, paddingHorizontal: 20, paddingVertical: 16, marginBottom: 8 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <Text style={{ color: textMain, fontSize: 18, fontFamily: "DMSans_700Bold" }}>
            {t.nav.account}
          </Text>
          <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
            <LanguageSwitcher />
            <ThemeToggle />
          </View>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
          <Avatar name={`${user.firstName} ${user.lastName}`} photo={photoUri} size={52} />
          <View style={{ flex: 1 }}>
            <Text style={{ color: textMain, fontSize: 16, fontFamily: "DMSans_700Bold" }}>
              {user.firstName} {user.lastName}
            </Text>
            <Text style={{ color: textMut, fontSize: 13, marginTop: 2 }}>{user.email}</Text>
          </View>
        </View>
      </View>

      <FlatList
        data={MENU_ITEMS}
        keyExtractor={(item) => item.key}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => router.push(item.href as any)}
            style={{ backgroundColor: cardBg, borderBottomColor: borderC, borderBottomWidth: 1, flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 14 }}
          >
            <View style={{ width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center", marginRight: 14, backgroundColor: accentBg }}>
              <item.icon size={20} color={iconC} />
            </View>
            <Text style={{ flex: 1, color: textMain, fontFamily: "DMSans_500Medium", fontSize: 15 }}>
              {menuLabels[item.key]}
            </Text>
            <ChevronRight size={18} color={textMut} />
          </TouchableOpacity>
        )}
        contentContainerStyle={{ paddingBottom: 32 }}
        ListFooterComponent={
          <TouchableOpacity
            onPress={handleLogout}
            style={{ backgroundColor: cardBg, borderBottomColor: borderC, borderBottomWidth: 1, flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 14, marginTop: 12 }}
          >
            <View style={{ width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center", marginRight: 14, backgroundColor: isDark ? "#2d1515" : "#fff1f1" }}>
              <LogOut size={20} color={isDark ? Colors.dark.destructive : Colors.destructive} />
            </View>
            <Text style={{ flex: 1, color: isDark ? Colors.dark.destructive : Colors.destructive, fontFamily: "DMSans_500Medium", fontSize: 15 }}>
              {t.user.logout}
            </Text>
          </TouchableOpacity>
        }
      />
    </SafeAreaView>
  );
}
