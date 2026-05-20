import React from "react";
import { View, Text, FlatList, TouchableOpacity, Alert } from "react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Image } from "expo-image";
import { router } from "expo-router";
import { getFavourites, removeFavourite } from "../../../src/services/auth";
import { useAuthStore } from "../../../src/store/useAuthStore";
import { useAuthGuard } from "../../../src/hooks/useAuthGuard";
import Loader from "../../../src/components/ui/Loader";
import EmptyState from "../../../src/components/ui/EmptyState";
import { Colors } from "../../../src/constants/colors";
import { Trash2, Heart, MapPin } from "lucide-react-native";
import { API_URL } from "../../../src/constants/api";

export default function FavorisScreen() {
  const isAuth = useAuthGuard();
  const { token } = useAuthStore();
  const queryClient = useQueryClient();

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
      <EmptyState
        title="Aucun favori"
        subtitle="Sauvegardez des biens en appuyant sur le cœur."
        icon={Heart}
      />
    );
  }

  return (
    <FlatList
      data={favourites}
      keyExtractor={f => f.id}
      contentContainerStyle={{ padding: 16 }}
      renderItem={({ item }) => {
        const gallery = item.property?.gallery ?? [];
        const imageUri = gallery[0]
          ? gallery[0].startsWith("http") ? gallery[0] : `${API_URL}/${gallery[0]}`
          : null;

        return (
          <TouchableOpacity
            onPress={() => router.push(`/property/${item.propertyId}` as any)}
            className="bg-white rounded-2xl border border-border mb-3 overflow-hidden flex-row"
            style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1 }}
          >
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={{ width: 90, height: 90 }} contentFit="cover" />
            ) : (
              <View style={{ width: 90, height: 90, backgroundColor: Colors.backgroundAlt }} />
            )}
            <View className="flex-1 px-3 py-3 justify-between">
              <Text className="text-text-dark font-sans-semibold" numberOfLines={2}>{item.property?.title}</Text>
              <View className="flex-row items-center gap-1">
                <MapPin size={12} color={Colors.mutedFg} />
                <Text className="text-muted-fg text-xs">{item.property?.location}</Text>
              </View>
              <Text className="text-primary font-sans-bold text-sm">{item.property?.price?.toLocaleString("fr-FR")} $</Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                Alert.alert("Supprimer", "Retirer ce bien de vos favoris ?", [
                  { text: "Annuler", style: "cancel" },
                  { text: "Supprimer", style: "destructive", onPress: () => handleRemove(item.propertyId) },
                ]);
              }}
              className="px-3 items-center justify-center"
            >
              <Trash2 size={18} color={Colors.destructive} />
            </TouchableOpacity>
          </TouchableOpacity>
        );
      }}
    />
  );
}
