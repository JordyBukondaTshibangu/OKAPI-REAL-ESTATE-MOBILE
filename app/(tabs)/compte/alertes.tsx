import React, { useState } from "react";
import { View, Text, FlatList, TouchableOpacity, Alert, Modal, TextInput, ScrollView } from "react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getAlerts, createAlert, deleteAlert, type CreateAlertPayload } from "../../../src/services/auth";
import { useAuthStore } from "../../../src/store/useAuthStore";
import { useAuthGuard } from "../../../src/hooks/useAuthGuard";
import Loader from "../../../src/components/ui/Loader";
import EmptyState from "../../../src/components/ui/EmptyState";
import Badge from "../../../src/components/ui/Badge";
import Button from "../../../src/components/ui/Button";
import { Colors } from "../../../src/constants/colors";
import { Bell, Plus, Trash2, X } from "lucide-react-native";

export default function AlertesScreen() {
  const isAuth = useAuthGuard();
  const { token } = useAuthStore();
  const queryClient = useQueryClient();
  const [createModal, setCreateModal] = useState(false);
  const [form, setForm] = useState<Partial<CreateAlertPayload>>({ active: true });
  const [creating, setCreating] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["alerts"],
    queryFn: () => getAlerts(token!),
    enabled: !!token,
  });

  async function handleCreate() {
    if (!form.name?.trim()) { Alert.alert("Erreur", "Veuillez donner un nom à cette alerte."); return; }
    setCreating(true);
    try {
      await createAlert(token!, form as CreateAlertPayload);
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
      setCreateModal(false);
      setForm({ active: true });
    } catch { Alert.alert("Erreur", "Impossible de créer l'alerte."); }
    finally { setCreating(false); }
  }

  async function handleDelete(id: string) {
    Alert.alert("Supprimer", "Supprimer cette alerte ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer", style: "destructive",
        onPress: async () => {
          try {
            await deleteAlert(token!, id);
            queryClient.invalidateQueries({ queryKey: ["alerts"] });
          } catch { Alert.alert("Erreur", "Impossible de supprimer cette alerte."); }
        }
      },
    ]);
  }

  if (!isAuth) return null;
  if (isLoading) return <Loader />;

  const alerts = data ?? [];

  return (
    <View style={{ flex: 1, backgroundColor: Colors.backgroundAlt }}>
      {alerts.length === 0 ? (
        <EmptyState
          title="Aucune alerte configurée"
          subtitle="Créez des alertes pour être notifié des nouveaux biens."
          icon={Bell}
          action={{ label: "Créer une alerte", onPress: () => setCreateModal(true) }}
        />
      ) : (
        <FlatList
          data={alerts}
          keyExtractor={a => a.id}
          contentContainerStyle={{ padding: 16 }}
          ListHeaderComponent={
            <Button onPress={() => setCreateModal(true)} style={{ marginBottom: 12 }}>
              <Plus size={16} color="#fff" />
              <Text className="text-white ml-1">Nouvelle alerte</Text>
            </Button>
          }
          renderItem={({ item }) => (
            <View
              className="bg-white rounded-2xl border border-border mb-3 p-4"
              style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1 }}
            >
              <View className="flex-row items-start justify-between mb-2">
                <View className="flex-1 mr-3">
                  <Text className="text-text-dark font-sans-semibold">{item.name}</Text>
                  <Text className="text-muted-fg text-xs mt-0.5">{new Date(item.createdAt).toLocaleDateString("fr-FR")}</Text>
                </View>
                <View className="flex-row items-center gap-2">
                  <Badge label={item.active ? "Active" : "Inactive"} variant={item.active ? "primary" : "muted"} />
                  <TouchableOpacity onPress={() => handleDelete(item.id)}>
                    <Trash2 size={16} color={Colors.destructive} />
                  </TouchableOpacity>
                </View>
              </View>
              <View className="flex-row flex-wrap gap-2">
                {item.listingType && <View className="bg-background-alt rounded-full px-2.5 py-1"><Text className="text-xs text-muted-fg">{item.listingType === "sale" ? "Vente" : "Location"}</Text></View>}
                {item.city && <View className="bg-background-alt rounded-full px-2.5 py-1"><Text className="text-xs text-muted-fg">{item.city}</Text></View>}
                {item.suburb && <View className="bg-background-alt rounded-full px-2.5 py-1"><Text className="text-xs text-muted-fg">{item.suburb}</Text></View>}
                {item.minPrice && <View className="bg-background-alt rounded-full px-2.5 py-1"><Text className="text-xs text-muted-fg">≥ {item.minPrice.toLocaleString()} $</Text></View>}
              </View>
            </View>
          )}
        />
      )}

      {/* Create modal */}
      <Modal visible={createModal} transparent animationType="slide" onRequestClose={() => setCreateModal(false)}>
        <TouchableOpacity style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)" }} onPress={() => setCreateModal(false)} />
        <View className="bg-white rounded-t-3xl px-5 pt-5 pb-10" style={{ position: "absolute", bottom: 0, left: 0, right: 0, maxHeight: "80%" }}>
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-text-dark text-lg font-sans-semibold">Nouvelle alerte</Text>
            <TouchableOpacity onPress={() => setCreateModal(false)}>
              <X size={22} color={Colors.mutedFg} />
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            <TextInput
              value={form.name ?? ""}
              onChangeText={v => setForm(f => ({ ...f, name: v }))}
              placeholder="Nom de l'alerte *"
              placeholderTextColor="#94a3b8"
              className="border border-border rounded-xl px-4 py-3 text-text-dark mb-3"
            />
            {/* Listing type */}
            <View className="flex-row gap-2 mb-3">
              {[{ value: "sale", label: "Vente" }, { value: "rent", label: "Location" }].map(t => (
                <TouchableOpacity
                  key={t.value}
                  onPress={() => setForm(f => ({ ...f, listingType: t.value }))}
                  className={`flex-1 py-2.5 rounded-xl items-center border ${form.listingType === t.value ? "bg-accent border-primary" : "bg-background-alt border-border"}`}
                >
                  <Text className={form.listingType === t.value ? "text-primary font-sans-medium" : "text-muted-fg"}>{t.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput value={form.city ?? ""} onChangeText={v => setForm(f => ({ ...f, city: v }))} placeholder="Ville" placeholderTextColor="#94a3b8" className="border border-border rounded-xl px-4 py-3 text-text-dark mb-3" />
            <TextInput value={form.suburb ?? ""} onChangeText={v => setForm(f => ({ ...f, suburb: v }))} placeholder="Quartier" placeholderTextColor="#94a3b8" className="border border-border rounded-xl px-4 py-3 text-text-dark mb-3" />
            <View className="flex-row gap-3 mb-3">
              <TextInput value={form.minPrice ? String(form.minPrice) : ""} onChangeText={v => setForm(f => ({ ...f, minPrice: v ? Number(v) : undefined }))} placeholder="Prix min $" placeholderTextColor="#94a3b8" keyboardType="numeric" className="flex-1 border border-border rounded-xl px-4 py-3 text-text-dark" />
              <TextInput value={form.maxPrice ? String(form.maxPrice) : ""} onChangeText={v => setForm(f => ({ ...f, maxPrice: v ? Number(v) : undefined }))} placeholder="Prix max $" placeholderTextColor="#94a3b8" keyboardType="numeric" className="flex-1 border border-border rounded-xl px-4 py-3 text-text-dark" />
            </View>
            <Button onPress={handleCreate} loading={creating} style={{ marginTop: 8 }}>Créer l'alerte</Button>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}
