import React, { useState, useCallback } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator,
  Alert, RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import axios from "axios";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft, Plus, Eye, Pencil, Trash2, Zap,
  CheckCircle, Clock, EyeOff, XCircle, AlertCircle,
} from "lucide-react-native";
import { useAgentSessionStore } from "../../../src/store/useAgentSessionStore";
import { useThemeStore } from "../../../src/store/useThemeStore";
import { useT } from "../../../src/i18n/useT";
import { Colors } from "../../../src/constants/colors";
import { API_URL } from "../../../src/constants/api";

type ListingStatus = "DRAFT" | "PENDING" | "LIVE" | "HIDDEN" | "REJECTED" | "EXPIRED";
type Tab = "ALL" | "LIVE" | "PENDING" | "DRAFT" | "HIDDEN";

function formatPrice(price?: number, currency?: string) {
  if (!price) return null;
  return new Intl.NumberFormat("fr-CD").format(price) + " " + (currency ?? "USD");
}

export default function AgentAnnoncesScreen({ showBackButton = true }: { showBackButton?: boolean }) {
  const { token } = useAgentSessionStore();
  const { theme } = useThemeStore();
  const t = useT().espaceAgent;
  const isDark = theme === "dark";

  const bg      = isDark ? Colors.dark.background : Colors.backgroundAlt;
  const card    = isDark ? Colors.dark.card        : Colors.white;
  const border  = isDark ? Colors.dark.border      : Colors.border;
  const text    = isDark ? Colors.dark.foreground  : Colors.foreground;
  const textMut = isDark ? Colors.dark.mutedFg     : Colors.mutedFg;
  const primary = isDark ? Colors.dark.primary     : Colors.primary;

  const [activeTab, setActiveTab] = useState<Tab>("ALL");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Fetch all listings (no filter) for counts
  const { data: allListings = [], isLoading, refetch, isRefetching } = useQuery<any[]>({
    queryKey: ["agent-annonces-mine", token],
    queryFn: async () => {
      const r = await axios.get(`${API_URL}/properties/mine/list`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const d = r.data;
      return Array.isArray(d) ? d : (d.data ?? []);
    },
    enabled: !!token,
    staleTime: 60_000,
  });

  const countOf = (s: ListingStatus) => allListings.filter((l) => l.status === s).length;

  const filtered = activeTab === "ALL"
    ? allListings
    : allListings.filter((l) => l.status === activeTab);

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: "ALL",     label: t.tabAll,     count: allListings.length },
    { key: "LIVE",    label: t.tabLive,    count: countOf("LIVE") },
    { key: "PENDING", label: t.tabPending, count: countOf("PENDING") },
    { key: "DRAFT",   label: t.tabDraft,   count: countOf("DRAFT") },
    { key: "HIDDEN",  label: t.tabHidden,  count: countOf("HIDDEN") },
  ];

  const statusMeta: Record<ListingStatus, { label: string; color: string; bg: string }> = {
    LIVE:     { label: t.statusLive,     color: "#065f46", bg: "#d1fae5" },
    DRAFT:    { label: t.statusDraft,    color: "#92400e", bg: "#fef3c7" },
    PENDING:  { label: t.statusPending,  color: "#1e40af", bg: "#dbeafe" },
    HIDDEN:   { label: t.statusHidden,   color: "#4b5563", bg: isDark ? "#1f2937" : "#f3f4f6" },
    REJECTED: { label: t.statusRejected, color: "#991b1b", bg: "#fee2e2" },
    EXPIRED:  { label: t.statusExpired,  color: "#6b7280", bg: isDark ? "#1f2937" : "#f9fafb" },
  };

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["agent-annonces-mine"] });
    queryClient.invalidateQueries({ queryKey: ["agent-listings"] });
    queryClient.invalidateQueries({ queryKey: ["properties"] });
  }, [queryClient]);

  async function handleDelete(id: string) {
    Alert.alert(t.annoncesTitle, t.deleteConfirm, [
      { text: t.cancelBtn, style: "cancel" },
      {
        text: "Supprimer", style: "destructive",
        onPress: async () => {
          setActionLoading(id + "-delete");
          try {
            await axios.delete(`${API_URL}/properties/mine/${id}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            invalidate();
          } catch {
            Alert.alert("Erreur", t.deleteError);
          } finally {
            setActionLoading(null);
          }
        },
      },
    ]);
  }

  async function handlePublish(id: string) {
    setActionLoading(id + "-publish");
    try {
      await axios.post(`${API_URL}/properties/mine/${id}/publish`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      invalidate();
    } catch {
      Alert.alert("Erreur", t.publishError);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleUnpublish(id: string) {
    setActionLoading(id + "-unpublish");
    try {
      await axios.post(`${API_URL}/properties/mine/${id}/unpublish`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      invalidate();
    } catch {
      Alert.alert("Erreur", t.unpublishError);
    } finally {
      setActionLoading(null);
    }
  }

  const pendingCount = countOf("PENDING");
  const draftCount   = countOf("DRAFT");

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }} edges={["top"]}>
      {/* Header */}
      <View style={{ backgroundColor: Colors.navy, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 18 }}>
        {showBackButton && (
          <TouchableOpacity onPress={() => router.back()} style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10 }}>
            <ArrowLeft size={16} color="rgba(255,255,255,0.6)" />
            <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 13 }}>{t.back}</Text>
          </TouchableOpacity>
        )}
        <View style={{ flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" }}>
          <View>
            <Text style={{ color: "#fff", fontSize: 18, fontFamily: "DMSans_700Bold" }}>{t.annoncesTitle}</Text>
            <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, marginTop: 2 }}>
              {allListings.length} annonce{allListings.length !== 1 ? "s" : ""}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push("/espace-agent/annonces/nouvelle")}
            style={{ backgroundColor: Colors.secondary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, flexDirection: "row", alignItems: "center", gap: 6 }}
          >
            <Plus size={15} color={Colors.navy} />
            <Text style={{ color: Colors.navy, fontSize: 13, fontFamily: "DMSans_600SemiBold" }}>{t.newListing}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Info banners */}
      {(pendingCount > 0 || draftCount > 0) && (
        <View style={{ paddingHorizontal: 16, paddingTop: 10, gap: 6 }}>
          {pendingCount > 0 && (
            <View style={{ backgroundColor: "#dbeafe", borderRadius: 10, padding: 10, flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Clock size={13} color="#1e40af" />
              <Text style={{ color: "#1e40af", fontSize: 12, fontFamily: "DMSans_500Medium", flex: 1 }}>
                {pendingCount} annonce{pendingCount > 1 ? "s" : ""} en cours de vérification (24-48h)
              </Text>
            </View>
          )}
          {draftCount > 0 && (
            <View style={{ backgroundColor: "#fef3c7", borderRadius: 10, padding: 10, flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Pencil size={13} color="#92400e" />
              <Text style={{ color: "#92400e", fontSize: 12, fontFamily: "DMSans_500Medium", flex: 1 }}>
                {draftCount} brouillon{draftCount > 1 ? "s" : ""} — soumettez pour publication
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0, marginTop: 12 }}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingBottom: 4 }}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              style={{
                paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
                backgroundColor: isActive ? primary : card,
                borderWidth: 1.5,
                borderColor: isActive ? primary : border,
                flexDirection: "row", alignItems: "center", gap: 6,
              }}
            >
              <Text style={{ color: isActive ? "#fff" : textMut, fontSize: 13, fontFamily: isActive ? "DMSans_600SemiBold" : "DMSans_400Regular" }}>
                {tab.label}
              </Text>
              {(tab.count ?? 0) > 0 && (
                <View style={{ backgroundColor: isActive ? "rgba(255,255,255,0.25)" : (isDark ? Colors.dark.muted : "#f1f5f9"), borderRadius: 10, paddingHorizontal: 5, paddingVertical: 1 }}>
                  <Text style={{ color: isActive ? "#fff" : textMut, fontSize: 10, fontFamily: "DMSans_600SemiBold" }}>{tab.count}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Content */}
      {isLoading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={primary} size="large" />
        </View>
      ) : filtered.length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 32 }}>
          <Text style={{ color: text, fontSize: 16, fontFamily: "DMSans_700Bold" }}>{t.noAnnonces}</Text>
          <Text style={{ color: textMut, fontSize: 14, textAlign: "center", marginTop: 6 }}>{t.noAnnoncesBody}</Text>
          {activeTab === "ALL" && (
            <TouchableOpacity
              onPress={() => router.push("/espace-agent/annonces/nouvelle")}
              style={{ marginTop: 20, backgroundColor: primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 20 }}
            >
              <Text style={{ color: "#fff", fontSize: 14, fontFamily: "DMSans_600SemiBold" }}>{t.publishFirst}</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 16, gap: 10 }}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={primary} />}
        >
          {filtered.map((p) => {
            const status: ListingStatus = p.status ?? "LIVE";
            const st = statusMeta[status] ?? statusMeta.LIVE;
            const isBoosted = p.boostedUntil && new Date(p.boostedUntil) > new Date();
            const busy = actionLoading?.startsWith(p.id);
            const location = [p.suburb ?? p.neighborhood, p.city].filter(Boolean).join(" · ");
            const price = formatPrice(p.price, p.currency);

            return (
              <View key={p.id} style={{ backgroundColor: card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: border }}>
                {/* Title + badges */}
                <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 8, marginBottom: 6 }}>
                  <Text style={{ flex: 1, color: text, fontSize: 14, fontFamily: "DMSans_600SemiBold" }} numberOfLines={2}>
                    {p.title || "Sans titre"}
                  </Text>
                  <View style={{ flexDirection: "row", gap: 4, flexShrink: 0 }}>
                    <View style={{ paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6, backgroundColor: st.bg }}>
                      <Text style={{ color: st.color, fontSize: 10, fontFamily: "DMSans_600SemiBold" }}>{st.label}</Text>
                    </View>
                    {isBoosted && (
                      <View style={{ paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6, backgroundColor: "#fef3c7", flexDirection: "row", alignItems: "center", gap: 3 }}>
                        <Zap size={9} color="#92400e" />
                        <Text style={{ color: "#92400e", fontSize: 10, fontFamily: "DMSans_600SemiBold" }}>{t.statusBoosted}</Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Info */}
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 8 }}>
                  {!!location && <Text style={{ color: textMut, fontSize: 12 }}>{location}</Text>}
                  {!!price && <Text style={{ color: text, fontSize: 12, fontFamily: "DMSans_600SemiBold" }}>{price}</Text>}
                  {p.viewCount !== undefined && (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                      <Eye size={11} color={textMut} />
                      <Text style={{ color: textMut, fontSize: 12 }}>{p.viewCount} {t.views}</Text>
                    </View>
                  )}
                </View>

                {/* Rejection reason */}
                {status === "REJECTED" && !!p.rejectionReason && (
                  <View style={{ backgroundColor: "#fee2e2", borderRadius: 8, padding: 8, marginBottom: 8, flexDirection: "row", gap: 6 }}>
                    <XCircle size={13} color="#991b1b" style={{ marginTop: 1 }} />
                    <Text style={{ color: "#991b1b", fontSize: 12, flex: 1 }}>{p.rejectionReason}</Text>
                  </View>
                )}

                {/* Pending note */}
                {status === "PENDING" && (
                  <View style={{ backgroundColor: "#eff6ff", borderRadius: 8, padding: 8, marginBottom: 8, flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Clock size={12} color="#1e40af" />
                    <Text style={{ color: "#1e40af", fontSize: 12 }}>{t.pendingNote}</Text>
                  </View>
                )}

                {/* Action buttons */}
                <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
                  {/* Edit */}
                  {["DRAFT", "HIDDEN", "REJECTED", "EXPIRED", "LIVE"].includes(status) && (
                    <TouchableOpacity
                      style={{ flex: 1, minWidth: 80, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: border }}
                      onPress={() => router.push({ pathname: "/espace-agent/annonces/nouvelle", params: { id: p.id } })}
                    >
                      <Pencil size={14} color={primary} />
                      <Text style={{ color: primary, fontSize: 13, fontFamily: "DMSans_500Medium" }}>{t.editBtn}</Text>
                    </TouchableOpacity>
                  )}

                  {/* Submit for review */}
                  {["DRAFT", "REJECTED"].includes(status) && (
                    <TouchableOpacity
                      style={{ flex: 1, minWidth: 80, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 8, borderRadius: 10, backgroundColor: primary, opacity: busy ? 0.6 : 1 }}
                      onPress={() => handlePublish(p.id)}
                      disabled={!!busy}
                    >
                      {actionLoading === p.id + "-publish"
                        ? <ActivityIndicator size="small" color="#fff" />
                        : <CheckCircle size={14} color="#fff" />}
                      <Text style={{ color: "#fff", fontSize: 13, fontFamily: "DMSans_500Medium" }}>{t.submitBtn}</Text>
                    </TouchableOpacity>
                  )}

                  {/* Re-publish hidden */}
                  {status === "HIDDEN" && (
                    <TouchableOpacity
                      style={{ flex: 1, minWidth: 80, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 8, borderRadius: 10, backgroundColor: primary, opacity: busy ? 0.6 : 1 }}
                      onPress={() => handlePublish(p.id)}
                      disabled={!!busy}
                    >
                      {actionLoading === p.id + "-publish"
                        ? <ActivityIndicator size="small" color="#fff" />
                        : <CheckCircle size={14} color="#fff" />}
                      <Text style={{ color: "#fff", fontSize: 13, fontFamily: "DMSans_500Medium" }}>{t.republishBtn}</Text>
                    </TouchableOpacity>
                  )}

                  {/* Unpublish live */}
                  {status === "LIVE" && (
                    <TouchableOpacity
                      style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: border, flexDirection: "row", alignItems: "center", gap: 6, opacity: busy ? 0.6 : 1 }}
                      onPress={() => handleUnpublish(p.id)}
                      disabled={!!busy}
                    >
                      {actionLoading === p.id + "-unpublish"
                        ? <ActivityIndicator size="small" color={textMut} />
                        : <EyeOff size={14} color={textMut} />}
                      <Text style={{ color: textMut, fontSize: 13, fontFamily: "DMSans_500Medium" }}>{t.unpublishBtn}</Text>
                    </TouchableOpacity>
                  )}

                  {/* Delete (non-live) */}
                  {["DRAFT", "HIDDEN", "EXPIRED", "REJECTED"].includes(status) && (
                    <TouchableOpacity
                      style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: isDark ? "#2d1515" : "#FEE2E2", backgroundColor: isDark ? "#1a0a0a" : "#FFF5F5", opacity: busy ? 0.6 : 1 }}
                      onPress={() => handleDelete(p.id)}
                      disabled={!!busy}
                    >
                      {actionLoading === p.id + "-delete"
                        ? <ActivityIndicator size="small" color={isDark ? Colors.dark.destructive : Colors.destructive} />
                        : <Trash2 size={14} color={isDark ? Colors.dark.destructive : Colors.destructive} />}
                    </TouchableOpacity>
                  )}
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
