import React from "react";
import { View, Text, FlatList, TouchableOpacity, Alert } from "react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getEnquiries, deleteEnquiry } from "../../../src/services/auth";
import { useAuthStore } from "../../../src/store/useAuthStore";
import { useAuthGuard } from "../../../src/hooks/useAuthGuard";
import Loader from "../../../src/components/ui/Loader";
import EmptyState from "../../../src/components/ui/EmptyState";
import Badge from "../../../src/components/ui/Badge";
import { Colors } from "../../../src/constants/colors";
import { MessageSquare, Trash2 } from "lucide-react-native";

const STATUS_LABEL: Record<string, string> = {
  pending: "En attente",
  replied: "Répondu",
  closed: "Clôturé",
};

const STATUS_VARIANT: Record<string, "primary" | "secondary" | "muted" | "gold"> = {
  pending: "primary",
  replied: "gold",
  closed: "muted",
};

export default function DemandesScreen() {
  const isAuth = useAuthGuard();
  const { token } = useAuthStore();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["enquiries"],
    queryFn: () => getEnquiries(token!),
    enabled: !!token,
  });

  async function handleDelete(id: string) {
    Alert.alert("Supprimer", "Supprimer cette demande ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer", style: "destructive",
        onPress: async () => {
          try {
            await deleteEnquiry(token!, id);
            queryClient.invalidateQueries({ queryKey: ["enquiries"] });
          } catch {
            Alert.alert("Erreur", "Impossible de supprimer cette demande.");
          }
        }
      },
    ]);
  }

  if (!isAuth) return null;
  if (isLoading) return <Loader />;

  const enquiries = data ?? [];

  if (enquiries.length === 0) {
    return (
      <EmptyState
        title="Aucune demande envoyée"
        subtitle="Vos demandes de renseignements apparaîtront ici."
        icon={MessageSquare}
      />
    );
  }

  return (
    <FlatList
      data={enquiries}
      keyExtractor={e => e.id}
      contentContainerStyle={{ padding: 16 }}
      renderItem={({ item }) => (
        <View
          className="bg-white rounded-2xl border border-border mb-3 p-4"
          style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1 }}
        >
          <View className="flex-row items-start justify-between mb-2">
            <View className="flex-1 mr-3">
              <Text className="text-text-dark font-sans-semibold" numberOfLines={1}>
                {item.property?.title ?? "Bien immobilier"}
              </Text>
              <Text className="text-muted-fg text-xs mt-0.5">{new Date(item.createdAt).toLocaleDateString("fr-FR")}</Text>
            </View>
            <Badge label={STATUS_LABEL[item.status]} variant={STATUS_VARIANT[item.status]} />
          </View>
          <Text className="text-muted-fg text-sm" numberOfLines={2}>{item.message}</Text>
          <View className="flex-row justify-end mt-3">
            <TouchableOpacity onPress={() => handleDelete(item.id)}>
              <Trash2 size={16} color={Colors.destructive} />
            </TouchableOpacity>
          </View>
        </View>
      )}
    />
  );
}
