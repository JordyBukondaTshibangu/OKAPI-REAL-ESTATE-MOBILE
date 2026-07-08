import React, { useEffect, useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import axios from "axios";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Plus, Eye, Pencil, Trash2, Home, Zap } from "lucide-react-native";
import { useAgentSessionStore } from "../../../src/store/useAgentSessionStore";
import { useThemeStore } from "../../../src/store/useThemeStore";
import { useT } from "../../../src/i18n/useT";
import { Colors } from "../../../src/constants/colors";
import { API_URL } from "../../../src/constants/api";

function formatPrice(price?: number, currency?: string) {
  if (!price) return null;
  return new Intl.NumberFormat("fr-CD").format(price) + " " + (currency ?? "USD");
}

export default function AgenceAnnoncesScreen() {
  const { token, agent } = useAgentSessionStore();
  const { theme } = useThemeStore();
  const t = useT().espaceAgence;
  const isDark = theme === "dark";

  const bg      = isDark ? Colors.dark.background  : Colors.backgroundAlt;
  const card    = isDark ? Colors.dark.card         : Colors.white;
  const border  = isDark ? Colors.dark.border       : Colors.border;
  const text    = isDark ? Colors.dark.foreground   : Colors.foreground;
  const textMut = isDark ? Colors.dark.mutedFg      : Colors.mutedFg;
  const primary = isDark ? Colors.dark.primary      : Colors.primary;

  const STATUS: Record<string, { label: string; color: string; bg: string }> = {
    open:      { label: t.statusActive,  color: "#065f46", bg: "#d1fae5" },
    published: { label: t.statusActive,  color: "#065f46", bg: "#d1fae5" },
    active:    { label: t.statusActive,  color: "#065f46", bg: "#d1fae5" },
    draft:     { label: t.statusDraft,   color: "#92400e", bg: "#fef3c7" },
    pending:   { label: t.statusPending, color: "#1e40af", bg: "#dbeafe" },
    closed:    { label: t.statusClosed,  color: textMut,   bg: isDark ? Colors.dark.muted : "#f1f5f9" },
  };

  const queryClient = useQueryClient();
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !agent) { router.replace("/(tabs)/compte"); }
  }, [token, agent]);

  const { data: listingsData, isLoading: loading } = useQuery({
    queryKey: ["agency-annonces", agent?.id],
    queryFn: () => axios
      .get(`${API_URL}/properties?agentId=${agent!.id}&limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((r) => {
        const d = r.data;
        return Array.isArray(d) ? d : (d.data ?? []);
      }),
    enabled: !!token && !!agent?.id,
    staleTime: 1_000 * 60 * 2,
  });

  const listings: any[] = listingsData ?? [];

  async function handleDelete(id: string) {
    Alert.alert(t.annoncesTitle, t.deleteConfirm, [
      { text: t.cancelBtn, style: "cancel" },
      {
        text: "Supprimer", style: "destructive",
        onPress: async () => {
          setDeleting(id);
          try {
            await axios.delete(`${API_URL}/properties/${id}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            queryClient.invalidateQueries({ queryKey: ["agency-annonces"] });
            queryClient.invalidateQueries({ queryKey: ["agency-listings"] });
            queryClient.invalidateQueries({ queryKey: ["properties"] });
          } catch {
            Alert.alert("Erreur", t.deleteError);
          } finally {
            setDeleting(null);
          }
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }} edges={["top"]}>
      <View style={{ backgroundColor: Colors.navy, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 18, flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" }}>
        <View>
          <TouchableOpacity onPress={() => router.back()} style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10 }}>
            <ArrowLeft size={16} color="rgba(255,255,255,0.6)" />
            <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 13 }}>{t.back}</Text>
          </TouchableOpacity>
          <Text style={{ color: "#fff", fontSize: 18, fontFamily: "DMSans_700Bold" }}>{t.annoncesTitle}</Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push("/espace-agent/annonces/nouvelle")}
          style={{ backgroundColor: Colors.secondary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, flexDirection: "row", alignItems: "center", gap: 6 }}
        >
          <Plus size={15} color={Colors.navy} />
          <Text style={{ color: Colors.navy, fontSize: 13, fontFamily: "DMSans_600SemiBold" }}>{t.newListing}</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={primary} size="large" />
        </View>
      ) : listings.length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 32 }}>
          <Home size={48} color={textMut} strokeWidth={1.5} />
          <Text style={{ color: text, fontSize: 16, fontFamily: "DMSans_700Bold", marginTop: 14 }}>{t.noAnnonces}</Text>
          <Text style={{ color: textMut, fontSize: 14, textAlign: "center", marginTop: 6 }}>{t.noAnnoncesBody}</Text>
          <TouchableOpacity
            onPress={() => router.push("/espace-agent/annonces/nouvelle")}
            style={{ marginTop: 20, backgroundColor: primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 20 }}
          >
            <Text style={{ color: "#fff", fontSize: 14, fontFamily: "DMSans_600SemiBold" }}>{t.publishFirst}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, gap: 10 }}>
          {listings.map((p) => {
            const st = STATUS[p.status] ?? { label: p.status, color: textMut, bg: isDark ? Colors.dark.muted : "#f1f5f9" };
            const location = [p.suburb ?? p.neighborhood, p.city].filter(Boolean).join(" · ");
            const price = formatPrice(p.price, p.currency);
            const isBoosted = p.boostedUntil && new Date(p.boostedUntil) > new Date();
            const isDeleting = deleting === p.id;
            return (
              <View key={p.id} style={{ backgroundColor: card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: border }}>
                <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 8, marginBottom: 6 }}>
                  <Text style={{ flex: 1, color: text, fontSize: 14, fontFamily: "DMSans_600SemiBold" }} numberOfLines={2}>{p.title}</Text>
                  <View style={{ paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, backgroundColor: st.bg }}>
                    <Text style={{ color: st.color, fontSize: 10, fontFamily: "DMSans_600SemiBold" }}>{st.label}</Text>
                  </View>
                  {isBoosted && (
                    <View style={{ paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, backgroundColor: "#fef3c7", flexDirection: "row", alignItems: "center", gap: 3 }}>
                      <Zap size={9} color="#92400e" />
                      <Text style={{ color: "#92400e", fontSize: 10, fontFamily: "DMSans_600SemiBold" }}>{t.statusBoosted}</Text>
                    </View>
                  )}
                </View>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
                  {location ? <Text style={{ color: textMut, fontSize: 12 }}>{location}</Text> : null}
                  {price ? <Text style={{ color: text, fontSize: 12, fontFamily: "DMSans_600SemiBold" }}>{price}</Text> : null}
                  {p.viewCount !== undefined && (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                      <Eye size={11} color={textMut} />
                      <Text style={{ color: textMut, fontSize: 12 }}>{p.viewCount} {t.views}</Text>
                    </View>
                  )}
                </View>
                <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
                  <TouchableOpacity
                    style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: border }}
                    onPress={() => {}}
                  >
                    <Pencil size={14} color={primary} />
                    <Text style={{ color: primary, fontSize: 13, fontFamily: "DMSans_500Medium" }}>{t.editBtn}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: isDark ? "#2d1515" : "#FEE2E2", backgroundColor: isDark ? "#1a0a0a" : "#FFF5F5", flexDirection: "row", alignItems: "center", gap: 6, opacity: isDeleting ? 0.6 : 1 }}
                    onPress={() => handleDelete(p.id)}
                    disabled={isDeleting}
                  >
                    {isDeleting
                      ? <ActivityIndicator size="small" color={isDark ? Colors.dark.destructive : Colors.destructive} />
                      : <Trash2 size={14} color={isDark ? Colors.dark.destructive : Colors.destructive} />
                    }
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
          <View style={{ height: 24 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
