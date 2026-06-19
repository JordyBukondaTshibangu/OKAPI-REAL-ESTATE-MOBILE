import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Alert,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useAuthStore } from "../../../src/store/useAuthStore";
import { useThemeStore } from "../../../src/store/useThemeStore";
import { useLocaleStore } from "../../../src/store/useLocaleStore";
import { useT } from "../../../src/i18n/useT";
import Avatar from "../../../src/components/ui/Avatar";
import Button from "../../../src/components/ui/Button";
import ThemeToggle from "../../../src/components/ui/ThemeToggle";
import LanguageSwitcher from "../../../src/components/ui/LanguageSwitcher";
import { Colors } from "../../../src/constants/colors";
import {
  ChevronRight,
  User,
  Heart,
  MessageSquare,
  Bell,
  Star,
  LogOut,
  Settings,
  Sun,
  Moon,
  Globe,
} from "lucide-react-native";
import { API_URL } from "../../../src/constants/api";

const MENU_ITEMS = [
  { key: "profil", icon: User, href: "/(tabs)/compte/profil" },
  { key: "favoris", icon: Heart, href: "/(tabs)/compte/favoris" },
  { key: "demandes", icon: MessageSquare, href: "/(tabs)/compte/demandes" },
  { key: "alertes", icon: Bell, href: "/(tabs)/compte/alertes" },
  { key: "avis", icon: Star, href: "/(tabs)/compte/avis" },
  { key: "parametres", icon: Settings, href: "/(tabs)/compte/parametres" },
] as const;

export default function CompteScreen() {
  const t = useT();
  const { isAuthenticated, user, logout } = useAuthStore();
  const { theme, setTheme } = useThemeStore();
  const { locale, setLocale } = useLocaleStore();
  const isDark = theme === "dark";
  const bgColor = isDark ? Colors.dark.background : Colors.backgroundAlt;

  const menuLabels: Record<string, string> = {
    profil: t.user.profile,
    favoris: t.user.favorites,
    demandes: t.user.enquiries,
    alertes: t.user.alerts,
    avis: t.user.reviews,
    parametres: t.user.settings,
  };

  const localeLabel: Record<string, string> = { fr: "FR", en: "EN", ln: "LN" };
  const localeFull: Record<string, string> = {
    fr: "Français",
    en: "English",
    ln: "Lingala",
  };

  function handleLanguagePicker() {
    Alert.alert(t.settings.languageTitle, t.settings.chooseLanguage, [
      {
        text: `Français${locale === "fr" ? " ✓" : ""}`,
        onPress: () => setLocale("fr"),
      },
      {
        text: `English${locale === "en" ? " ✓" : ""}`,
        onPress: () => setLocale("en"),
      },
      {
        text: `Lingala${locale === "ln" ? " ✓" : ""}`,
        onPress: () => setLocale("ln"),
      },
      { text: t.common.cancel, style: "cancel" },
    ]);
  }

  if (!isAuthenticated || !user) {
    const guestCardBg = isDark ? Colors.dark.card : Colors.white;
    const guestBorder = isDark ? Colors.dark.border : Colors.border;
    const guestText = isDark ? Colors.dark.foreground : Colors.foreground;
    const guestMuted = isDark ? Colors.dark.mutedFg : Colors.mutedFg;
    const guestAccent = isDark ? Colors.dark.accent : Colors.accent;
    const iconC = isDark ? Colors.dark.primary : Colors.primary;

    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: bgColor }}
        edges={["top"]}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View
            style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20 }}
          >
            <Text
              style={{
                color: guestText,
                fontSize: 22,
                fontFamily: "DMSans_700Bold",
                marginBottom: 20,
              }}
            >
              {t.nav.account}
            </Text>

            {/* Guest avatar + prompt */}
            <View style={{ alignItems: "center", paddingVertical: 28 }}>
              <View
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  backgroundColor: guestAccent,
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 14,
                }}
              >
                <User size={36} color={iconC} />
              </View>
              <Text
                style={{
                  color: guestText,
                  fontSize: 18,
                  fontFamily: "DMSans_700Bold",
                  marginBottom: 6,
                }}
              >
                {t.nav.account}
              </Text>
              <Text
                style={{
                  color: guestMuted,
                  fontSize: 14,
                  textAlign: "center",
                  lineHeight: 20,
                  maxWidth: 260,
                }}
              >
                {t.user.loginPrompt}
              </Text>
            </View>

            <Button
              onPress={() => router.push("/(auth)/connexion")}
              style={{ marginBottom: 10 }}
            >
              {t.user.loginBtn}
            </Button>
            <Button
              variant="outline"
              className="text-white"
              onPress={() => router.push("/(auth)/inscription")}
            >
              {t.user.registerBtn}
            </Button>
          </View>

          {/* Quick settings for guests */}
          <View
            style={{
              marginHorizontal: 16,
              marginTop: 8,
              marginBottom: 32,
              backgroundColor: guestCardBg,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: guestBorder,
              overflow: "hidden",
            }}
          >
            {/* Section label */}
            <View
              style={{
                paddingHorizontal: 16,
                paddingTop: 14,
                paddingBottom: 8,
              }}
            >
              <Text
                style={{
                  color: guestMuted,
                  fontSize: 11,
                  fontFamily: "DMSans_600SemiBold",
                  letterSpacing: 0.8,
                  textTransform: "uppercase",
                }}
              >
                {t.user.preferences}
              </Text>
            </View>

            {/* Theme toggle row */}
            <TouchableOpacity
              onPress={() => setTheme(isDark ? "light" : "dark")}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                paddingHorizontal: 16,
                paddingVertical: 14,
                borderTopWidth: 1,
                borderTopColor: guestBorder,
              }}
            >
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  backgroundColor: guestAccent,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {isDark ? (
                  <Moon size={18} color={iconC} strokeWidth={1.8} />
                ) : (
                  <Sun size={18} color={iconC} strokeWidth={1.8} />
                )}
              </View>
              <Text
                style={{
                  flex: 1,
                  color: guestText,
                  fontSize: 15,
                  fontFamily: "DMSans_500Medium",
                }}
              >
                {isDark ? t.settings.darkMode : t.settings.lightMode}
              </Text>
              <View
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 20,
                  backgroundColor: isDark
                    ? Colors.dark.primary + "22"
                    : Colors.accent,
                }}
              >
                <Text
                  style={{
                    color: iconC,
                    fontSize: 12,
                    fontFamily: "DMSans_600SemiBold",
                  }}
                >
                  {isDark ? "ON" : "OFF"}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Language row */}
            <TouchableOpacity
              onPress={handleLanguagePicker}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                paddingHorizontal: 16,
                paddingVertical: 14,
                borderTopWidth: 1,
                borderTopColor: guestBorder,
              }}
            >
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  backgroundColor: guestAccent,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Globe size={18} color={iconC} strokeWidth={1.8} />
              </View>
              <Text
                style={{
                  flex: 1,
                  color: guestText,
                  fontSize: 15,
                  fontFamily: "DMSans_500Medium",
                }}
              >
                {t.settings.language}
              </Text>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
              >
                <Text
                  style={{
                    color: guestMuted,
                    fontSize: 14,
                    fontFamily: "DMSans_400Regular",
                  }}
                >
                  {localeFull[locale]}
                </Text>
                <ChevronRight size={16} color={guestMuted} />
              </View>
            </TouchableOpacity>

            {/* Settings link */}
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/compte/parametres" as any)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                paddingHorizontal: 16,
                paddingVertical: 14,
                borderTopWidth: 1,
                borderTopColor: guestBorder,
              }}
            >
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  backgroundColor: guestAccent,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Settings size={18} color={iconC} strokeWidth={1.8} />
              </View>
              <Text
                style={{
                  flex: 1,
                  color: guestText,
                  fontSize: 15,
                  fontFamily: "DMSans_500Medium",
                }}
              >
                {t.user.settings}
              </Text>
              <ChevronRight size={16} color={guestMuted} />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const photoUri = user.profileImage
    ? user.profileImage.startsWith("http")
      ? user.profileImage
      : `${API_URL}/${user.profileImage}`
    : null;

  function handleLogout() {
    Alert.alert(
      t.user.logout,
      t.user.deleteConfirm.replace("compte", "session"),
      [
        { text: t.common.cancel, style: "cancel" },
        {
          text: t.user.logout,
          style: "destructive",
          onPress: () => {
            logout();
          },
        },
      ],
    );
  }

  const cardBg = isDark ? Colors.dark.card : Colors.white;
  const borderColor = isDark ? Colors.dark.border : Colors.border;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bgColor }} edges={["top"]}>
      {/* Profile header */}
      <View
        style={{
          backgroundColor: cardBg,
          borderBottomColor: borderColor,
          borderBottomWidth: 1,
        }}
        className="px-5 py-4 mb-3"
      >
        <View className="flex-row items-center justify-between mb-3">
          <Text
            style={{
              color: isDark ? Colors.dark.foreground : Colors.foreground,
              fontSize: 18,
              fontFamily: "DMSans_700Bold",
            }}
          >
            {t.nav.account}
          </Text>
          <View className="flex-row gap-2 items-center">
            <LanguageSwitcher />
            <ThemeToggle />
          </View>
        </View>
        <View className="flex-row items-center gap-4">
          <Avatar
            name={`${user.firstName} ${user.lastName}`}
            photo={photoUri}
            size={56}
          />
          <View className="flex-1">
            <Text
              style={{
                color: isDark ? Colors.dark.foreground : Colors.foreground,
                fontSize: 17,
                fontFamily: "DMSans_700Bold",
              }}
            >
              {user.firstName} {user.lastName}
            </Text>
            <Text
              style={{
                color: isDark ? Colors.dark.mutedFg : Colors.mutedFg,
                fontSize: 13,
                marginTop: 2,
              }}
            >
              {user.email}
            </Text>
          </View>
        </View>
      </View>

      <FlatList
        data={MENU_ITEMS}
        keyExtractor={(item) => item.key}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => router.push(item.href as any)}
            style={{
              backgroundColor: cardBg,
              borderBottomColor: borderColor,
              borderBottomWidth: 1,
            }}
            className="flex-row items-center px-5 py-4"
          >
            <View
              className="w-10 h-10 rounded-xl items-center justify-center mr-4"
              style={{
                backgroundColor: isDark ? Colors.dark.accent : Colors.accent,
              }}
            >
              <item.icon
                size={20}
                color={isDark ? Colors.dark.primary : Colors.primary}
              />
            </View>
            <Text
              style={{
                flex: 1,
                color: isDark ? Colors.dark.foreground : Colors.foreground,
                fontFamily: "DMSans_500Medium",
                fontSize: 15,
              }}
            >
              {menuLabels[item.key]}
            </Text>
            <ChevronRight
              size={18}
              color={isDark ? Colors.dark.mutedFg : Colors.mutedFg}
            />
          </TouchableOpacity>
        )}
        contentContainerStyle={{ paddingBottom: 32 }}
        ListFooterComponent={
          <TouchableOpacity
            onPress={handleLogout}
            style={{
              backgroundColor: cardBg,
              borderBottomColor: borderColor,
              borderBottomWidth: 1,
            }}
            className="flex-row items-center px-5 py-4 mt-3"
          >
            <View
              className="w-10 h-10 rounded-xl items-center justify-center mr-4"
              style={{ backgroundColor: isDark ? "#2d1515" : "#fff1f1" }}
            >
              <LogOut
                size={20}
                color={isDark ? Colors.dark.destructive : Colors.destructive}
              />
            </View>
            <Text
              className="flex-1 font-sans-medium"
              style={{
                color: isDark ? Colors.dark.destructive : Colors.destructive,
              }}
            >
              {t.user.logout}
            </Text>
          </TouchableOpacity>
        }
      />
    </SafeAreaView>
  );
}
