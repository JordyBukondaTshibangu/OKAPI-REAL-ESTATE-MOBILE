import React from "react";
import { View, Text, FlatList, TouchableOpacity, Alert } from "react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getMyReviews, deleteReview } from "../../../src/services/auth";
import { useAuthStore } from "../../../src/store/useAuthStore";
import { useAuthGuard } from "../../../src/hooks/useAuthGuard";
import Loader from "../../../src/components/ui/Loader";
import EmptyState from "../../../src/components/ui/EmptyState";
import StarRating from "../../../src/components/ui/StarRating";
import { Colors } from "../../../src/constants/colors";
import { Star, Trash2 } from "lucide-react-native";

export default function AvisScreen() {
  const isAuth = useAuthGuard();
  const { token } = useAuthStore();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["reviews"],
    queryFn: () => getMyReviews(token!),
    enabled: !!token,
  });

  async function handleDelete(id: string) {
    Alert.alert("Supprimer", "Supprimer cet avis ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer", style: "destructive",
        onPress: async () => {
          try {
            await deleteReview(token!, id);
            queryClient.invalidateQueries({ queryKey: ["reviews"] });
          } catch { Alert.alert("Erreur", "Impossible de supprimer cet avis."); }
        }
      },
    ]);
  }

  if (!isAuth) return null;
  if (isLoading) return <Loader />;

  const reviews = data ?? [];

  if (reviews.length === 0) {
    return (
      <EmptyState
        title="Aucun avis publié"
        subtitle="Notez les biens et agents après vos visites."
        icon={Star}
      />
    );
  }

  const avg = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : "0";

  return (
    <FlatList
      data={reviews}
      keyExtractor={r => r.id}
      contentContainerStyle={{ padding: 16 }}
      ListHeaderComponent={
        <View className="bg-white rounded-2xl border border-border p-4 mb-4 items-center">
          <Text className="text-text-dark text-4xl font-sans-bold">{avg}</Text>
          <StarRating rating={Number(avg)} size={18} />
          <Text className="text-muted-fg text-xs mt-1">{reviews.length} avis publiés</Text>
        </View>
      }
      renderItem={({ item }) => (
        <View
          className="bg-white rounded-2xl border border-border mb-3 p-4"
          style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1 }}
        >
          <View className="flex-row items-start justify-between mb-2">
            <View className="flex-1 mr-3">
              <Text className="text-text-dark font-sans-semibold" numberOfLines={1}>
                {item.property?.title ?? item.agent ? `${item.agent?.firstName} ${item.agent?.lastName}` : "Avis"}
              </Text>
              <Text className="text-muted-fg text-xs mt-0.5">{new Date(item.createdAt).toLocaleDateString("fr-FR")}</Text>
            </View>
            <TouchableOpacity onPress={() => handleDelete(item.id)}>
              <Trash2 size={16} color={Colors.destructive} />
            </TouchableOpacity>
          </View>
          <StarRating rating={item.rating} size={14} />
          {item.comment && <Text className="text-muted-fg text-sm mt-2">{item.comment}</Text>}
        </View>
      )}
    />
  );
}
