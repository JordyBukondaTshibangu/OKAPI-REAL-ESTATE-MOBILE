import React from "react";
import { View, Text, TouchableOpacity, FlatList, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useAuthStore } from "../../../src/store/useAuthStore";
import { useThemeStore } from "../../../src/store/useThemeStore";
import { useT } from "../../../src/i18n/useT";
import Avatar from "../../../src/components/ui/Avatar";
import Button from "../../../src/components/ui/Button";
import ThemeToggle from "../../../src/components/ui/ThemeToggle";
import LanguageSwitcher from "../../../src/components/ui/LanguageSwitcher";
import { Colors } from "../../../src/constants/colors";
import { ChevronRight, User, Heart, MessageSquare, Bell, Star, LogOut } from "lucide-react-native";
import { API_URL } from "../../../src/constants/api";

const MENU_ITEMS = [
  { key: "profil", icon: User, href: "/(tabs)/compte/profil" },
  { key: "favoris", icon: Heart, href: "/(tabs)/compte/favoris" },
  { key: "demandes", icon: MessageSquare, href: "/(tabs)/compte/demandes" },
  { key: "alertes", icon: Bell, href: "/(tabs)/compte/alertes" },
  { key: "avis", icon: Star, href: "/(tabs)/compte/avis" },
] as const;

export default function CompteScreen() {
  const t = useT();
  const { isAuthenticated, user, logout } = useAuthStore();
  const { theme } = useThemeStore();
  const isDark = theme === "dark";
  const bgColor = isDark ? Colors.dark.background : Colors.backgroundAlt;

  const menuLabels: Record<string, string> = {
    profil: t.user.profile,
    favoris: t.user.favorites,
    demandes: t.user.enquiries,
    alertes: t.user.alerts,
    avis: t.user.reviews,
  };

  if (!isAuthenticated || !user) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: bgColor }} edges={["top"]}>
        <View className="flex-row items-center justify-end px-5 pt-2 gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
        </View>
        <View className="flex-1 items-center justify-center px-6">
          <View className="items-center mb-8">
            <View className="w-20 h-20 rounded-full bg-accent dark:bg-dark-accent items-center justify-center mb-4">
              <User size={36} color={isDark ? Colors.dark.primary : Colors.primary} />
            </View>
            <Text className="text-foreground dark:text-dark-foreground text-xl font-sans-bold mb-2">
              {t.nav.account}
            </Text>
            <Text className="text-muted-fg dark:text-dark-muted-fg text-sm text-center">
              {t.user.loginPrompt}
            </Text>
          </View>
          <Button onPress={() => router.push("/(auth)/connexion")} style={{ width: "100%", marginBottom: 12 }}>
            {t.user.loginBtn}
          </Button>
          <Button variant="outline" onPress={() => router.push("/(auth)/inscription")} style={{ width: "100%" }}>
            {t.user.registerBtn}
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  const photoUri = user.profileImage
    ? user.profileImage.startsWith("http") ? user.profileImage : `${API_URL}/${user.profileImage}`
    : null;

  function handleLogout() {
    Alert.alert(t.user.logout, t.user.deleteConfirm.replace("compte", "session"), [
      { text: t.common.cancel, style: "cancel" },
      { text: t.user.logout, style: "destructive", onPress: () => { logout(); } },
    ]);
  }

  const cardBg = isDark ? Colors.dark.card : Colors.white;
  const borderColor = isDark ? Colors.dark.border : Colors.border;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bgColor }} edges={["top"]}>
      {/* Profile header */}
      <View
        style={{ backgroundColor: cardBg, borderBottomColor: borderColor, borderBottomWidth: 1 }}
        className="px-5 py-4 mb-3"
      >
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-foreground dark:text-dark-foreground text-lg font-sans-bold">
            {t.nav.account}
          </Text>
          <View className="flex-row gap-2 items-center">
            <LanguageSwitcher />
            <ThemeToggle />
          </View>
        </View>
        <View className="flex-row items-center gap-4">
          <Avatar name={`${user.firstName} ${user.lastName}`} photo={photoUri} size={56} />
          <View className="flex-1">
            <Text className="text-foreground dark:text-dark-foreground text-lg font-sans-bold">
              {user.firstName} {user.lastName}
            </Text>
            <Text className="text-muted-fg dark:text-dark-muted-fg text-sm">{user.email}</Text>
          </View>
        </View>
      </View>

      <FlatList
        data={MENU_ITEMS}
        keyExtractor={(item) => item.key}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => router.push(item.href as any)}
            style={{ backgroundColor: cardBg, borderBottomColor: borderColor, borderBottomWidth: 1 }}
            className="flex-row items-center px-5 py-4"
          >
            <View
              className="w-10 h-10 rounded-xl items-center justify-center mr-4"
              style={{ backgroundColor: isDark ? Colors.dark.accent : Colors.accent }}
            >
              <item.icon size={20} color={isDark ? Colors.dark.primary : Colors.primary} />
            </View>
            <Text className="flex-1 text-foreground dark:text-dark-foreground font-sans-medium">
              {menuLabels[item.key]}
            </Text>
            <ChevronRight size={18} color={isDark ? Colors.dark.mutedFg : Colors.mutedFg} />
          </TouchableOpacity>
        )}
        contentContainerStyle={{ paddingBottom: 32 }}
        ListFooterComponent={
          <TouchableOpacity
            onPress={handleLogout}
            style={{ backgroundColor: cardBg, borderBottomColor: borderColor, borderBottomWidth: 1 }}
            className="flex-row items-center px-5 py-4 mt-3"
          >
            <View
              className="w-10 h-10 rounded-xl items-center justify-center mr-4"
              style={{ backgroundColor: isDark ? "#2d1515" : "#fff1f1" }}
            >
              <LogOut size={20} color={isDark ? Colors.dark.destructive : Colors.destructive} />
            </View>
            <Text
              className="flex-1 font-sans-medium"
              style={{ color: isDark ? Colors.dark.destructive : Colors.destructive }}
            >
              {t.user.logout}
            </Text>
          </TouchableOpacity>
        }
      />
    </SafeAreaView>
  );
}
