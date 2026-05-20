import React from "react";
import { View, Text, TouchableOpacity, FlatList, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useAuthStore } from "../../../src/store/useAuthStore";
import Avatar from "../../../src/components/ui/Avatar";
import Button from "../../../src/components/ui/Button";
import { Colors } from "../../../src/constants/colors";
import { ChevronRight, User, Heart, MessageSquare, Bell, Star, LogOut } from "lucide-react-native";
import { API_URL } from "../../../src/constants/api";

const MENU_ITEMS = [
  { key: "profil", label: "Mon Profil", icon: User, href: "/(tabs)/compte/profil" },
  { key: "favoris", label: "Mes Favoris", icon: Heart, href: "/(tabs)/compte/favoris" },
  { key: "demandes", label: "Mes Demandes", icon: MessageSquare, href: "/(tabs)/compte/demandes" },
  { key: "alertes", label: "Mes Alertes", icon: Bell, href: "/(tabs)/compte/alertes" },
  { key: "avis", label: "Mes Avis & Notes", icon: Star, href: "/(tabs)/compte/avis" },
] as const;

export default function CompteScreen() {
  const { isAuthenticated, user, logout } = useAuthStore();

  if (!isAuthenticated || !user) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.backgroundAlt }} edges={["top"]}>
        <View className="flex-1 items-center justify-center px-6">
          <View className="items-center mb-8">
            <View className="w-20 h-20 rounded-full bg-accent items-center justify-center mb-4">
              <User size={36} color={Colors.primary} />
            </View>
            <Text className="text-text-dark text-xl font-sans-bold mb-2">Mon Compte</Text>
            <Text className="text-muted-fg text-sm text-center">
              Connectez-vous pour accéder à vos favoris, alertes et demandes.
            </Text>
          </View>
          <Button onPress={() => router.push("/(auth)/connexion")} style={{ width: "100%", marginBottom: 12 }}>
            Se connecter
          </Button>
          <Button variant="outline" onPress={() => router.push("/(auth)/inscription")} style={{ width: "100%" }}>
            S'inscrire
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  const photoUri = user.profileImage
    ? user.profileImage.startsWith("http") ? user.profileImage : `${API_URL}/${user.profileImage}`
    : null;

  function handleLogout() {
    Alert.alert("Se déconnecter", "Êtes-vous sûr de vouloir vous déconnecter ?", [
      { text: "Annuler", style: "cancel" },
      { text: "Se déconnecter", style: "destructive", onPress: () => { logout(); } },
    ]);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.backgroundAlt }} edges={["top"]}>
      <View className="bg-white px-5 py-5 mb-3 border-b border-border">
        <View className="flex-row items-center gap-4">
          <Avatar name={`${user.firstName} ${user.lastName}`} photo={photoUri} size={56} />
          <View className="flex-1">
            <Text className="text-text-dark text-lg font-sans-bold">{user.firstName} {user.lastName}</Text>
            <Text className="text-muted-fg text-sm">{user.email}</Text>
          </View>
        </View>
      </View>

      <FlatList
        data={MENU_ITEMS}
        keyExtractor={item => item.key}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => router.push(item.href as any)}
            className="flex-row items-center bg-white px-5 py-4 border-b border-border"
          >
            <View className="w-10 h-10 rounded-xl bg-accent items-center justify-center mr-4">
              <item.icon size={20} color={Colors.primary} />
            </View>
            <Text className="flex-1 text-text-dark font-sans-medium">{item.label}</Text>
            <ChevronRight size={18} color={Colors.mutedFg} />
          </TouchableOpacity>
        )}
        contentContainerStyle={{ paddingBottom: 32 }}
        ListFooterComponent={
          <TouchableOpacity
            onPress={handleLogout}
            className="flex-row items-center px-5 py-4 mt-3 bg-white border-b border-border"
          >
            <View className="w-10 h-10 rounded-xl bg-red-50 items-center justify-center mr-4">
              <LogOut size={20} color={Colors.destructive} />
            </View>
            <Text className="flex-1 text-destructive font-sans-medium">Se déconnecter</Text>
          </TouchableOpacity>
        }
      />
    </SafeAreaView>
  );
}
