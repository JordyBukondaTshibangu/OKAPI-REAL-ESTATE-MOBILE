import React, { useState } from "react";
import { View, Text, FlatList, TouchableOpacity, Alert, Modal, TextInput, ScrollView } from "react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getAlerts, createAlert, deleteAlert, type CreateAlertPayload } from "../../../src/services/auth";
import { useAuthStore } from "../../../src/store/useAuthStore";
import { useThemeStore } from "../../../src/store/useThemeStore";
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
  const { theme } = useThemeStore();
  const isDark = theme === "dark";
  const queryClient = useQueryClient();
  const [createModal, setCreateModal] = useState(false);
  const [form, setForm] = useState<Partial<CreateAlertPayload>>({ active: true });
  const [creating, setCreating] = useState(false);

  const pageBg   = isDark ? Colors.dark.background : Colors.backgroundAlt;
  const cardBg   = isDark ? Colors.dark.card : Colors.white;
  const borderC  = isDark ? Colors.dark.border : Colors.border;
  const textMain = isDark ? Colors.dark.foreground : Colors.textDark;
  const textMut  = isDark ? Colors.dark.mutedFg : Colors.mutedFg;
  const chipBg   = isDark ? Colors.dark.muted : Colors.backgroundAlt;
  const accentBg = isDark ? Colors.dark.accent : Colors.accent;
  const primaryC = isDark ? Colors.dark.primary : Colors.primary;

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
    <View style={{ flex: 1, backgroundColor: pageBg }}>
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
              style={{ backgroundColor: cardBg, borderColor: borderC, borderWidth: 1, borderRadius: 16, marginBottom: 12, padding: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: isDark ? 0.2 : 0.05, shadowRadius: 3, elevation: 1 }}
            >
              <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8 }}>
                <View style={{ flex: 1, marginRight: 12 }}>
                  <Text style={{ color: textMain, fontFamily: "DMSans_600SemiBold" }}>{item.name}</Text>
                  <Text style={{ color: textMut, fontSize: 12, marginTop: 2 }}>{new Date(item.createdAt).toLocaleDateString("fr-FR")}</Text>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Badge label={item.active ? "Active" : "Inactive"} variant={item.active ? "primary" : "muted"} />
                  <TouchableOpacity onPress={() => handleDelete(item.id)}>
                    <Trash2 size={16} color={isDark ? Colors.dark.destructive : Colors.destructive} />
                  </TouchableOpacity>
                </View>
              </View>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {item.listingType && <View style={{ backgroundColor: chipBg, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 }}><Text style={{ fontSize: 12, color: textMut }}>{item.listingType === "sale" ? "Vente" : "Location"}</Text></View>}
                {item.city && <View style={{ backgroundColor: chipBg, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 }}><Text style={{ fontSize: 12, color: textMut }}>{item.city}</Text></View>}
                {item.suburb && <View style={{ backgroundColor: chipBg, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 }}><Text style={{ fontSize: 12, color: textMut }}>{item.suburb}</Text></View>}
                {item.minPrice && <View style={{ backgroundColor: chipBg, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 }}><Text style={{ fontSize: 12, color: textMut }}>≥ {item.minPrice.toLocaleString()} $</Text></View>}
              </View>
            </View>
          )}
        />
      )}

      {/* Create modal */}
      <Modal visible={createModal} transparent animationType="slide" onRequestClose={() => setCreateModal(false)}>
        <TouchableOpacity style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)" }} onPress={() => setCreateModal(false)} />
        <View style={{ backgroundColor: cardBg, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40, position: "absolute", bottom: 0, left: 0, right: 0, maxHeight: "80%" }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <Text style={{ color: textMain, fontSize: 18, fontFamily: "DMSans_600SemiBold" }}>Nouvelle alerte</Text>
            <TouchableOpacity onPress={() => setCreateModal(false)}>
              <X size={22} color={textMut} />
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            <TextInput
              value={form.name ?? ""}
              onChangeText={v => setForm(f => ({ ...f, name: v }))}
              placeholder="Nom de l'alerte *"
              placeholderTextColor={textMut}
              style={{ borderColor: borderC, borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, color: textMain, marginBottom: 12 }}
            />
            {/* Listing type */}
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
              {[{ value: "sale", label: "Vente" }, { value: "rent", label: "Location" }].map(t => {
                const active = form.listingType === t.value;
                return (
                  <TouchableOpacity
                    key={t.value}
                    onPress={() => setForm(f => ({ ...f, listingType: t.value }))}
                    style={{ flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: "center", borderWidth: 1, backgroundColor: active ? accentBg : chipBg, borderColor: active ? primaryC : borderC }}
                  >
                    <Text style={{ color: active ? primaryC : textMut, fontFamily: active ? "DMSans_500Medium" : undefined }}>{t.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <TextInput value={form.city ?? ""} onChangeText={v => setForm(f => ({ ...f, city: v }))} placeholder="Ville" placeholderTextColor={textMut} style={{ borderColor: borderC, borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, color: textMain, marginBottom: 12 }} />
            <TextInput value={form.suburb ?? ""} onChangeText={v => setForm(f => ({ ...f, suburb: v }))} placeholder="Quartier" placeholderTextColor={textMut} style={{ borderColor: borderC, borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, color: textMain, marginBottom: 12 }} />
            <View style={{ flexDirection: "row", gap: 12, marginBottom: 12 }}>
              <TextInput value={form.minPrice ? String(form.minPrice) : ""} onChangeText={v => setForm(f => ({ ...f, minPrice: v ? Number(v) : undefined }))} placeholder="Prix min $" placeholderTextColor={textMut} keyboardType="numeric" style={{ flex: 1, borderColor: borderC, borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, color: textMain }} />
              <TextInput value={form.maxPrice ? String(form.maxPrice) : ""} onChangeText={v => setForm(f => ({ ...f, maxPrice: v ? Number(v) : undefined }))} placeholder="Prix max $" placeholderTextColor={textMut} keyboardType="numeric" style={{ flex: 1, borderColor: borderC, borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, color: textMain }} />
            </View>
            <Button onPress={handleCreate} loading={creating} style={{ marginTop: 8 }}>Créer l'alerte</Button>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}
