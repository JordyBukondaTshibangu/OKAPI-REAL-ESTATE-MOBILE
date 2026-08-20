import React, { useEffect } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import {
  ArrowLeft, Home, Eye, Plus, Pencil, ChevronRight, Users, Building2, CreditCard, Star,
} from "lucide-react-native";
import { useAgentSessionStore } from "../../src/store/useAgentSessionStore";
import { useCurrentAgentProfile } from "../../src/hooks/useCurrentAgentProfile";
import { useThemeStore } from "../../src/store/useThemeStore";
import { useT } from "../../src/i18n/useT";
import { getMyAgentProfile } from "../../src/services/agentAuth";
import { Colors } from "../../src/constants/colors";
import { API_URL } from "../../src/constants/api";

export default function EspaceAgenceScreen() {
  const { token, agent: storeAgent } = useAgentSessionStore();
  // Fresh agent profile from server (with Zustand fallback)
  const { agent } = useCurrentAgentProfile();
  const { theme } = useThemeStore();
  const t = useT().espaceAgence;
  const isDark = theme === "dark";

  const bg      = isDark ? Colors.dark.background  : Colors.backgroundAlt;
  const card    = isDark ? Colors.dark.card         : Colors.white;
  const border  = isDark ? Colors.dark.border       : Colors.border;
  const text    = isDark ? Colors.dark.foreground   : Colors.foreground;
  const textMut = isDark ? Colors.dark.mutedFg      : Colors.mutedFg;
  const accent  = isDark ? Colors.dark.accent       : Colors.accent;
  const primary = isDark ? Colors.dark.primary      : Colors.primary;

  const STATUS: Record<string, { label: string; color: string; bg: string }> = {
    open:      { label: t.statusActive,  color: "#065f46", bg: "#d1fae5" },
    published: { label: t.statusActive,  color: "#065f46", bg: "#d1fae5" },
    active:    { label: t.statusActive,  color: "#065f46", bg: "#d1fae5" },
    draft:     { label: t.statusDraft,   color: "#92400e", bg: "#fef3c7" },
    pending:   { label: t.statusPending, color: "#1e40af", bg: "#dbeafe" },
    closed:    { label: t.statusClosed,  color: textMut,   bg: isDark ? Colors.dark.muted : "#f1f5f9" },
  };

  useEffect(() => {
    if (!token || !storeAgent) { router.replace("/(tabs)/compte"); return; }
    if (storeAgent.agentType !== "AGENCY_OWNER") { router.replace("/espace-agent"); return; }
  }, [token, storeAgent]);

  const agentId = agent?.id ?? storeAgent?.id;

  // Agency profile — same cache key as the profil edit screen
  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ["agentProfile", token],
    queryFn:  () => getMyAgentProfile(token!),
    enabled:  !!token,
    staleTime: 1_000 * 60 * 5,
  });
  const agency = (profileData as any)?.agency ?? null;

  // Recent listings
  const { data: listingsData, isLoading: listingsLoading } = useQuery({
    queryKey: ["agency-listings", agentId],
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
  const loading = profileLoading && listingsLoading;

  const isAgencyPlan = agent?.plan === "AGENCY";
  const subscriptionEndsAt = (agent as any)?.subscriptionEndsAt;

  const agencyInitials = (agency?.name ?? agent?.name ?? "")
    .split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();

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
        <TouchableOpacity
          onPress={() => router.push("/(tabs)/compte")}
          style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 16 }}
        >
          <ArrowLeft size={16} color="rgba(255,255,255,0.6)" />
          <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 13 }}>{t.back}</Text>
        </TouchableOpacity>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
          <View style={{
            width: 52, height: 52, borderRadius: 14,
            backgroundColor: Colors.secondary,
            alignItems: "center", justifyContent: "center",
            borderWidth: 2, borderColor: "rgba(255,255,255,0.25)",
          }}>
            <Text style={{ color: Colors.navy, fontSize: 18, fontFamily: "DMSans_700Bold" }}>{agencyInitials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: "rgba(255,255,255,0.55)", fontSize: 11, letterSpacing: 0.8, textTransform: "uppercase" }}>
              {t.dashTitle}
            </Text>
            <Text style={{ color: "#fff", fontSize: 17, fontFamily: "DMSans_700Bold" }} numberOfLines={1}>
              {agency?.name ?? agent?.name}
            </Text>
            {agency?.tagline ? (
              <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, marginTop: 1 }} numberOfLines={1}>{agency.tagline}</Text>
            ) : null}
          </View>
          <TouchableOpacity
            onPress={() => router.push("/espace-agence/profil")}
            style={{ width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" }}
          >
            <Pencil size={16} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, gap: 12 }}>

        {/* Agency info card */}
        {agency && (
          <View style={{ backgroundColor: card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: border, gap: 8 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Building2 size={16} color={primary} />
              <Text style={{ color: text, fontSize: 14, fontFamily: "DMSans_600SemiBold" }}>{agency.name}</Text>
            </View>
            {agency.address ? <Text style={{ color: textMut, fontSize: 13 }}>{agency.address}</Text> : null}
            {agency.communes?.length > 0 && (
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                {agency.communes.slice(0, 4).map((c: string) => (
                  <View key={c} style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, backgroundColor: accent, borderWidth: 1, borderColor: border }}>
                    <Text style={{ color: primary, fontSize: 12 }}>{c}</Text>
                  </View>
                ))}
                {agency.communes.length > 4 && (
                  <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, backgroundColor: accent, borderWidth: 1, borderColor: border }}>
                    <Text style={{ color: primary, fontSize: 12 }}>+{agency.communes.length - 4}</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        )}

        {/* Agency plan badge */}
        {isAgencyPlan && subscriptionEndsAt && (
          <View style={{ backgroundColor: isDark ? "#1a2a15" : "#F0FDF4", borderRadius: 14, padding: 14, borderWidth: 1, borderColor: isDark ? "#2d4a1a" : "#BBF7D0", flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Star size={18} color="#16a34a" fill="#16a34a" />
            <View style={{ flex: 1 }}>
              <Text style={{ color: isDark ? "#86efac" : "#15803d", fontSize: 13, fontFamily: "DMSans_700Bold" }}>{t.agencyPlanBadge}</Text>
              <Text style={{ color: isDark ? "#4ade80" : "#16a34a", fontSize: 12, marginTop: 2 }}>
                {t.agencySubsActiveUntil} {new Date(subscriptionEndsAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push("/espace-agence/abonnement" as any)}
              style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: "#16a34a" }}
            >
              <Text style={{ color: "#16a34a", fontSize: 12, fontFamily: "DMSans_600SemiBold" }}>{t.agencySubsRenewBtn}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Upgrade CTA card — shown when not on AGENCY plan */}
        {!isAgencyPlan && (
          <View style={{ borderRadius: 14, padding: 16, borderWidth: 1, borderColor: "#C9A84C40", backgroundColor: isDark ? "#0d1a2e" : "#0B1D3A" }}>
            <View style={{ flexDirection: "row", gap: 12, alignItems: "flex-start" }}>
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(201,168,76,0.15)", alignItems: "center", justifyContent: "center" }}>
                <Star size={18} color="#C9A84C" fill="#C9A84C" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: "#fff", fontSize: 14, fontFamily: "DMSans_700Bold", marginBottom: 4 }}>{t.upgradeAgencyTitle}</Text>
                <Text style={{ color: "#A0B0C8", fontSize: 12, lineHeight: 18, marginBottom: 12 }}>{t.upgradeAgencyBody}</Text>
                <TouchableOpacity
                  onPress={() => router.push("/espace-agence/abonnement" as any)}
                  style={{ backgroundColor: "#C9A84C", paddingHorizontal: 16, paddingVertical: 9, borderRadius: 10, alignSelf: "flex-start" }}
                >
                  <Text style={{ color: "#0B1D3A", fontSize: 13, fontFamily: "DMSans_700Bold" }}>{t.upgradeAgencyCta}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Quick actions */}
        <View style={{ backgroundColor: card, borderRadius: 16, borderWidth: 1, borderColor: border, overflow: "hidden" }}>
          {[
            { label: t.newListing,    icon: Plus,       onPress: () => router.push("/espace-agence/annonces/index" as any) },
            { label: t.annoncesTitle, icon: Home,       onPress: () => router.push("/espace-agence/annonces/index" as any) },
            { label: t.editProfile,   icon: Pencil,     onPress: () => router.push("/espace-agence/profil") },
            { label: t.mySubscription, icon: CreditCard, onPress: () => router.push("/espace-agence/abonnement" as any) },
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
            <Text style={{ color: text, fontSize: 14, fontFamily: "DMSans_600SemiBold" }}>{t.annoncesTitle}</Text>
            <TouchableOpacity onPress={() => router.push("/espace-agence/annonces/index" as any)}>
              <Text style={{ color: primary, fontSize: 13 }}>Voir tout</Text>
            </TouchableOpacity>
          </View>

          {listings.length === 0 ? (
            <View style={{ alignItems: "center", paddingVertical: 28, paddingHorizontal: 20 }}>
              <Home size={36} color={textMut} strokeWidth={1.5} />
              <Text style={{ color: text, fontSize: 14, fontFamily: "DMSans_600SemiBold", marginTop: 10 }}>{t.noAnnonces}</Text>
              <Text style={{ color: textMut, fontSize: 13, textAlign: "center", marginTop: 4 }}>{t.noAnnoncesBody}</Text>
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
                  </View>
                  {location ? <Text style={{ color: textMut, fontSize: 12, marginTop: 2 }}>{location}</Text> : null}
                  {p.viewCount !== undefined && (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 3 }}>
                      <Eye size={11} color={textMut} />
                      <Text style={{ color: textMut, fontSize: 11 }}>{p.viewCount} {t.views}</Text>
                    </View>
                  )}
                </View>
              );
            })
          )}
        </View>

        {/* Team section */}
        <View style={{ backgroundColor: card, borderRadius: 16, borderWidth: 1, borderColor: border, overflow: "hidden" }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: border }}>
            <Users size={16} color={primary} />
            <Text style={{ color: text, fontSize: 14, fontFamily: "DMSans_600SemiBold" }}>{t.teamSection}</Text>
          </View>
          <View style={{ paddingHorizontal: 16, paddingVertical: 20, alignItems: "center" }}>
            <Text style={{ color: textMut, fontSize: 13, textAlign: "center" }}>{t.teamEmpty}</Text>
          </View>
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
