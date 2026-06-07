import React from "react";
import { View, Text, FlatList, TouchableOpacity, Alert } from "react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Image } from "expo-image";
import { router } from "expo-router";
import { getFavourites, removeFavourite } from "../../../src/services/auth";
import { useAuthStore } from "../../../src/store/useAuthStore";
import { useThemeStore } from "../../../src/store/useThemeStore";
import { useAuthGuard } from "../../../src/hooks/useAuthGuard";
import Loader from "../../../src/components/ui/Loader";
import EmptyState from "../../../src/components/ui/EmptyState";
import { Colors } from "../../../src/constants/colors";
import { Trash2, Heart, MapPin } from "lucide-react-native";
import { API_URL } from "../../../src/constants/api";

export default function FavorisScreen() {
  const isAuth = useAuthGuard();
  const { token } = useAuthStore();
  const { theme } = useThemeStore();
  const isDark = theme === "dark";
  const queryClient = useQueryClient();

  const pageBg  = isDark ? Colors.dark.background : Colors.backgroundAlt;
  const cardBg  = isDark ? Colors.dark.card : Colors.white;
  const borderC = isDark ? Colors.dark.border : Colors.border;
  const textMain= isDark ? Colors.dark.foreground : Colors.textDark;
  const textMut = isDark ? Colors.dark.mutedFg : Colors.mutedFg;

  const { data, isLoading } = useQuery({
    queryKey: ["favourites"],
    queryFn: () => getFavourites(token!),
    enabled: !!token,
  });

  async function handleRemove(propertyId: string) {
    try {
      await removeFavourite(token!, propertyId);
      queryClient.invalidateQueries({ queryKey: ["favourites"] });
    } catch {
      Alert.alert("Erreur", "Impossible de supprimer ce favori.");
    }
  }

  if (!isAuth) return null;
  if (isLoading) return <Loader />;

  const favourites = data ?? [];

  if (favourites.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: pageBg }}>
        <EmptyState title="Aucun favori" subtitle="Sauvegardez des biens en appuyant sur le cœur." icon={Heart} />
      </View>
    );
  }

  return (
    <FlatList
      data={favourites}
      keyExtractor={f => f.id}
      style={{ backgroundColor: pageBg }}
      contentContainerStyle={{ padding: 16 }}
      renderItem={({ item }) => {
        const gallery = item.property?.gallery ?? [];
        const imageUri = gallery[0]
          ? gallery[0].startsWith("http") ? gallery[0] : `${API_URL}/${gallery[0]}`
          : null;

        return (
          <TouchableOpacity
            onPress={() => router.push(`/property/${item.propertyId}` as any)}
            style={{
              backgroundColor: cardBg,
              borderColor: borderC,
              borderWidth: 1,
              borderRadius: 16,
              marginBottom: 12,
              overflow: "hidden",
              flexDirection: "row",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: isDark ? 0.2 : 0.05,
              shadowRadius: 4,
              elevation: 1,
            }}
          >
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={{ width: 96, height: 96 }} contentFit="cover" />
            ) : (
              <View style={{ width: 96, height: 96, backgroundColor: isDark ? Colors.dark.muted : Colors.backgroundAlt }} />
            )}
            <View style={{ flex: 1, paddingHorizontal: 12, paddingVertical: 12, justifyContent: "space-between" }}>
              <Text style={{ color: textMain, fontFamily: "DMSans_600SemiBold", fontSize: 14, lineHeight: 19 }} numberOfLines={2}>
                {item.property?.title}
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <MapPin size={12} color={textMut} />
                <Text style={{ color: textMut, fontSize: 12 }}>{item.property?.location}</Text>
              </View>
              <Text style={{ color: isDark ? Colors.dark.primary : Colors.primary, fontFamily: "DMSans_700Bold", fontSize: 14 }}>
                {item.property?.price?.toLocaleString("fr-FR")} $
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                Alert.alert("Supprimer", "Retirer ce bien de vos favoris ?", [
                  { text: "Annuler", style: "cancel" },
                  { text: "Supprimer", style: "destructive", onPress: () => handleRemove(item.propertyId) },
                ]);
              }}
              style={{ paddingHorizontal: 14, alignItems: "center", justifyContent: "center" }}
            >
              <Trash2 size={18} color={isDark ? Colors.dark.destructive : Colors.destructive} />
            </TouchableOpacity>
          </TouchableOpacity>
        );
      }}
    />
  );
}
