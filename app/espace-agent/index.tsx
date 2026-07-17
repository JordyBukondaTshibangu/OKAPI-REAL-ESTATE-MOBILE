import React, { useEffect } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import {
  ArrowLeft, Home, Eye, MessageSquare, Plus, User, Zap, ChevronRight,
  AlertCircle, Star,
} from "lucide-react-native";
import { useAgentSessionStore } from "../../src/store/useAgentSessionStore";
import { useCurrentAgentProfile } from "../../src/hooks/useCurrentAgentProfile";
import { useThemeStore } from "../../src/store/useThemeStore";
import { useT } from "../../src/i18n/useT";
import { Colors } from "../../src/constants/colors";
import { API_URL } from "../../src/constants/api";

function formatPrice(price?: number, currency?: string) {
  if (!price) return null;
  return new Intl.NumberFormat("fr-CD").format(price) + " " + (currency ?? "USD");
}

export default function EspaceAgentScreen({ showBackButton = true }: { showBackButton?: boolean }) {
  const { token, agent: storeAgent } = useAgentSessionStore();
  // Fetch fresh profile from server; falls back to Zustand snapshot while loading
  const { agent } = useCurrentAgentProfile();
  const { theme } = useThemeStore();
  const t = useT().espaceAgent;
  const isDark = theme === "dark";

  const bg      = isDark ? Colors.dark.background  : Colors.backgroundAlt;
  const card    = isDark ? Colors.dark.card         : Colors.white;
  const border  = isDark ? Colors.dark.border       : Colors.border;
  const text    = isDark ? Colors.dark.foreground   : Colors.foreground;
  const textMut = isDark ? Colors.dark.mutedFg      : Colors.mutedFg;
  const accent  = isDark ? Colors.dark.accent       : Colors.accent;
  const primary = isDark ? Colors.dark.primary      : Colors.primary;

  useEffect(() => {
    if (!token || !storeAgent) { router.replace("/(tabs)/compte"); }
  }, [token, storeAgent]);

  // TanStack Query: cached + background-refreshed listings
  const agentId = agent?.id ?? storeAgent?.id;
  const { data: listingsData, isLoading: loading } = useQuery({
    queryKey: ["agent-listings", agentId],
    queryFn: () => axios
      .get(`${API_URL}/properties?agentId=${agentId}&limit=5`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((r) => {
        const d = r.data;
        return Array.isArray(d) ? d : (d.data ?? []);
      }),
    enabled: !!token && !!agentId,
    staleTime: 1_000 * 60 * 2,
  });

  const listings: any[] = listingsData ?? [];
  const stats = {
    listings: listings.length,
    views: listings.reduce((s: number, p: any) => s + (p.viewCount ?? 0), 0),
    enquiries: 0,
  };

  const initials = agent?.name
    ? agent.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()
    : "??";

  const profileIncomplete = !agent?.photo && (!agent?.phoneNumber);
  const isPro = agent?.plan === "PRO";

  const STATUS: Record<string, { label: string; color: string; bg: string }> = {
    open:      { label: t.statusActive,  color: "#065f46", bg: "#d1fae5" },
    published: { label: t.statusActive,  color: "#065f46", bg: "#d1fae5" },
    active:    { label: t.statusActive,  color: "#065f46", bg: "#d1fae5" },
    draft:     { label: t.statusDraft,   color: "#92400e", bg: "#fef3c7" },
    pending:   { label: t.statusPending, color: "#1e40af", bg: "#dbeafe" },
    closed:    { label: t.statusClosed,  color: textMut,   bg: isDark ? Colors.dark.muted : "#f1f5f9" },
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={primary} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }} edges={["top"]}>
      {/* Header */}
      <View style={{ backgroundColor: Colors.navy, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20 }}>
        {showBackButton && (
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/compte")}
            style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 16 }}
          >
            <ArrowLeft size={16} color="rgba(255,255,255,0.6)" />
            <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 13 }}>{t.back}</Text>
          </TouchableOpacity>
        )}

        <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
          <View style={{
            width: 52, height: 52, borderRadius: 26,
            backgroundColor: Colors.secondary,
            alignItems: "center", justifyContent: "center",
            borderWidth: 2, borderColor: "rgba(255,255,255,0.25)",
          }}>
            <Text style={{ color: Colors.navy, fontSize: 18, fontFamily: "DMSans_700Bold" }}>{initials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: "rgba(255,255,255,0.55)", fontSize: 11, letterSpacing: 0.8, textTransform: "uppercase" }}>
              {t.dashTitle}
            </Text>
            <Text style={{ color: "#fff", fontSize: 17, fontFamily: "DMSans_700Bold" }}>{agent?.name}</Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push("/espace-agent/profil")}
            style={{ width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" }}
          >
            <User size={18} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, gap: 12 }}>

        {/* Notification: pending account validation */}
        {(agent?.verificationTier ?? storeAgent?.verificationTier) === "NON_VERIFIE" && (
          <View style={{ backgroundColor: isDark ? "#2a1f00" : "#fffbeb", borderRadius: 14, padding: 14, borderWidth: 1, borderColor: isDark ? "#5a3f00" : "#fde68a", flexDirection: "row", gap: 10 }}>
            <AlertCircle size={18} color="#f59e0b" style={{ marginTop: 1 }} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: isDark ? "#fde68a" : "#92400e", fontSize: 13, lineHeight: 18, fontFamily: "DMSans_600SemiBold" }}>
                Compte en cours de validation
              </Text>
              <Text style={{ color: isDark ? "#fcd34d" : "#b45309", fontSize: 12, marginTop: 3, lineHeight: 17 }}>
                Créez des brouillons dès maintenant — ils seront publiés automatiquement dès votre activation.
              </Text>
              <TouchableOpacity onPress={() => router.push("/espace-agent/annonces/nouvelle")} style={{ marginTop: 6 }}>
                <Text style={{ color: "#f59e0b", fontSize: 13, fontFamily: "DMSans_600SemiBold" }}>
                  Créer un brouillon →
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Notification: incomplete profile */}
        {profileIncomplete && (
          <View style={{ backgroundColor: isDark ? "#1a2a40" : "#EFF6FF", borderRadius: 14, padding: 14, borderWidth: 1, borderColor: isDark ? Colors.dark.border : "#BFDBFE", flexDirection: "row", gap: 10 }}>
            <AlertCircle size={18} color={primary} style={{ marginTop: 1 }} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: text, fontSize: 13, lineHeight: 18 }}>{t.notifIncomplete}</Text>
              <TouchableOpacity onPress={() => router.push("/espace-agent/profil")} style={{ marginTop: 6 }}>
                <Text style={{ color: primary, fontSize: 13, fontFamily: "DMSans_600SemiBold" }}>
                  {t.editProfile} →
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* KPI Cards */}
        <View style={{ flexDirection: "row", gap: 10 }}>
          {[
            { label: t.kpiListings,  value: stats.listings,  icon: Home },
            { label: t.kpiViews,     value: stats.views,     icon: Eye },
            { label: t.kpiEnquiries, value: stats.enquiries, icon: MessageSquare },
          ].map(({ label, value, icon: Icon }) => (
            <View key={label} style={{ flex: 1, backgroundColor: card, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: border }}>
              <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: accent, alignItems: "center", justifyContent: "center", marginBottom: 8 }}>
                <Icon size={16} color={primary} />
              </View>
              <Text style={{ color: text, fontSize: 20, fontFamily: "DMSans_700Bold" }}>{value}</Text>
              <Text style={{ color: textMut, fontSize: 11, marginTop: 2 }}>{label}</Text>
            </View>
          ))}
        </View>

        {/* Pro plan badge */}
        {isPro && (
          <View style={{ backgroundColor: isDark ? "#1a2a15" : "#F0FDF4", borderRadius: 14, padding: 14, borderWidth: 1, borderColor: isDark ? "#2d4a1a" : "#BBF7D0", flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Star size={18} color="#16a34a" fill="#16a34a" />
            <View style={{ flex: 1 }}>
              <Text style={{ color: isDark ? "#86efac" : "#15803d", fontSize: 13, fontFamily: "DMSans_700Bold" }}>{t.kpiProLabel}</Text>
              <Text style={{ color: isDark ? "#4ade80" : "#16a34a", fontSize: 12, marginTop: 2 }}>{t.kpiProSubtitle}</Text>
            </View>
          </View>
        )}

        {/* Quick actions */}
        <View style={{ backgroundColor: card, borderRadius: 16, borderWidth: 1, borderColor: border, overflow: "hidden" }}>
          {[
            { label: t.newListing,    icon: Plus,  onPress: () => router.push("/espace-agent/annonces/nouvelle") },
            { label: t.viewAllListings, icon: Home,  onPress: () => router.push("/espace-agent/annonces") },
            { label: t.editProfile,    icon: User,  onPress: () => router.push("/espace-agent/profil") },
          ].map(({ label, icon: Icon, onPress }, i) => (
            <TouchableOpacity
              key={label}
              onPress={onPress}
              style={{
                flexDirection: "row", alignItems: "center", gap: 12,
                paddingHorizontal: 16, paddingVertical: 14,
                borderTopWidth: i === 0 ? 0 : 1, borderTopColor: border,
              }}
            >
              <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: accent, alignItems: "center", justifyContent: "center" }}>
                <Icon size={18} color={primary} />
              </View>
              <Text style={{ flex: 1, color: text, fontSize: 15, fontFamily: "DMSans_500Medium" }}>{label}</Text>
              <ChevronRight size={16} color={textMut} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent listings */}
        <View style={{ backgroundColor: card, borderRadius: 16, borderWidth: 1, borderColor: border, overflow: "hidden" }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: border }}>
            <Text style={{ color: text, fontSize: 14, fontFamily: "DMSans_600SemiBold" }}>
              {t.annoncesTitle}
            </Text>
            <TouchableOpacity onPress={() => router.push("/espace-agent/annonces")}>
              <Text style={{ color: primary, fontSize: 13 }}>{t.viewAllListings}</Text>
            </TouchableOpacity>
          </View>

          {listings.length === 0 ? (
            <View style={{ alignItems: "center", paddingVertical: 28, paddingHorizontal: 20 }}>
              <Home size={36} color={textMut} strokeWidth={1.5} />
              <Text style={{ color: text, fontSize: 14, fontFamily: "DMSans_600SemiBold", marginTop: 10 }}>{t.noAnnonces}</Text>
              <Text style={{ color: textMut, fontSize: 13, textAlign: "center", marginTop: 4 }}>{t.noAnnoncesBody}</Text>
              <TouchableOpacity
                onPress={() => router.push("/espace-agent/annonces/nouvelle")}
                style={{ marginTop: 14, backgroundColor: primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 }}
              >
                <Text style={{ color: "#fff", fontSize: 13, fontFamily: "DMSans_600SemiBold" }}>{t.publishFirstListing}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            listings.slice(0, 3).map((p, i) => {
              const st = STATUS[p.status] ?? { label: p.status, color: textMut, bg: isDark ? Colors.dark.muted : "#f1f5f9" };
              const location = [p.suburb ?? p.neighborhood, p.city].filter(Boolean).join(" · ");
              return (
                <View key={p.id} style={{ paddingHorizontal: 16, paddingVertical: 13, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: border }}>
                  <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 8 }}>
                    <Text style={{ flex: 1, color: text, fontSize: 14, fontFamily: "DMSans_500Medium" }} numberOfLines={1}>{p.title}</Text>
                    <View style={{ paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, backgroundColor: st.bg }}>
                      <Text style={{ color: st.color, fontSize: 10, fontFamily: "DMSans_600SemiBold" }}>{st.label}</Text>
                    </View>
                    {p.boostedUntil && new Date(p.boostedUntil) > new Date() && (
                      <View style={{ paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, backgroundColor: "#fef3c7", flexDirection: "row", alignItems: "center", gap: 3 }}>
                        <Zap size={9} color="#92400e" />
                        <Text style={{ color: "#92400e", fontSize: 10, fontFamily: "DMSans_600SemiBold" }}>{t.statusBoosted}</Text>
                      </View>
                    )}
                  </View>
                  {location ? <Text style={{ color: textMut, fontSize: 12, marginTop: 2 }}>{location}</Text> : null}
                  {p.viewCount !== undefined && (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 }}>
                      <Eye size={11} color={textMut} />
                      <Text style={{ color: textMut, fontSize: 11 }}>{p.viewCount} {t.views}</Text>
                    </View>
                  )}
                </View>
              );
            })
          )}
        </View>

        {/* Coming soon */}
        <View style={{ backgroundColor: card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: border, alignItems: "center" }}>
          <Text style={{ color: textMut, fontSize: 13, textAlign: "center" }}>{t.comingSoon}</Text>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
