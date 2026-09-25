import React from "react";
import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft, BarChart2, Eye, MessageSquare, Share2, Home, Smartphone, TrendingUp,
} from "lucide-react-native";
import { useAgentSessionStore } from "../../src/store/useAgentSessionStore";
import { useThemeStore } from "../../src/store/useThemeStore";
import { useT } from "../../src/i18n/useT";
import { Colors } from "../../src/constants/colors";
import { API_URL } from "../../src/constants/api";

type Listing = {
  id: string;
  title: string;
  city: string;
  suburb?: string;
  status: string;
  enquiryCount: number;
  performance: {
    viewed: number;
    shared: number;
    saved: number;
    whatsappClicks: number;
  };
};

const ACTIVE_STATUSES = ["live", "open", "published", "active"];

function StatTile({
  label, value, icon: Icon, color, accent,
}: {
  label: string; value: number | string; icon: any; color: string; accent: string;
}) {
  return (
    <View style={{ flex: 1, backgroundColor: accent, borderRadius: 14, padding: 14, minWidth: "45%" }}>
      <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: color + "22", alignItems: "center", justifyContent: "center", marginBottom: 8 }}>
        <Icon size={17} color={color} />
      </View>
      <Text style={{ color, fontSize: 22, fontFamily: "DMSans_700Bold" }}>{value}</Text>
      <Text style={{ color, fontSize: 11, marginTop: 2, opacity: 0.75 }}>{label}</Text>
    </View>
  );
}

export default function StatistiquesScreen() {
  const { token } = useAgentSessionStore();
  const { theme } = useThemeStore();
  const ta = useT().espaceAgent;
  const isDark = theme === "dark";

  const bg      = isDark ? Colors.dark.background : Colors.backgroundAlt;
  const card    = isDark ? Colors.dark.card        : Colors.white;
  const border  = isDark ? Colors.dark.border      : Colors.border;
  const text    = isDark ? Colors.dark.foreground  : Colors.foreground;
  const textMut = isDark ? Colors.dark.mutedFg     : Colors.mutedFg;
  const primary = isDark ? Colors.dark.primary     : Colors.primary;
  const accent  = isDark ? Colors.dark.accent      : Colors.accent;

  const { data: listings = [], isLoading, isRefetching, refetch } = useQuery<Listing[]>({
    queryKey: ["agent-listings-full", token],
    queryFn: async () => {
      const r = await axios.get(`${API_URL}/properties/mine/list`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return r.data;
    },
    enabled: !!token,
    staleTime: 60_000,
  });

  // ── Aggregate stats ──────────────────────────────────────────────────────────
  const totalViews     = listings.reduce((s, p) => s + (p.performance?.viewed ?? 0), 0);
  const totalWhatsapp  = listings.reduce((s, p) => s + (p.performance?.whatsappClicks ?? 0), 0);
  const totalShares    = listings.reduce((s, p) => s + (p.performance?.shared ?? 0), 0);
  const totalEnquiries = listings.reduce((s, p) => s + (p.enquiryCount ?? 0), 0);
  const activeCount    = listings.filter((p) => ACTIVE_STATUSES.includes(p.status?.toLowerCase())).length;
  const conversionRate = totalViews > 0 ? ((totalEnquiries / totalViews) * 100).toFixed(1) : "—";
  const topListing     = listings.length > 0
    ? listings.reduce((best, p) => (p.performance?.viewed ?? 0) > (best.performance?.viewed ?? 0) ? p : best, listings[0])
    : null;

  // Sort listings by views desc for table
  const sorted = [...listings].sort((a, b) => (b.performance?.viewed ?? 0) - (a.performance?.viewed ?? 0));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }} edges={["top"]}>
      {/* Header */}
      <View style={{ backgroundColor: Colors.navy, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20 }}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10 }}
        >
          <ArrowLeft size={16} color="rgba(255,255,255,0.6)" />
          <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 13 }}>{ta.back}</Text>
        </TouchableOpacity>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.12)", alignItems: "center", justifyContent: "center" }}>
            <BarChart2 size={18} color={Colors.secondary} />
          </View>
          <View>
            <Text style={{ color: "#fff", fontSize: 18, fontFamily: "DMSans_700Bold" }}>{ta.statsTitle}</Text>
            <Text style={{ color: "rgba(255,255,255,0.55)", fontSize: 12, marginTop: 1 }}>
              {listings.length} {ta.kpiListings.toLowerCase()}
            </Text>
          </View>
        </View>
      </View>

      {isLoading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={primary} size="large" />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 96 }}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={primary} />}
        >
          {/* KPI tiles — 2×2 grid */}
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
            <StatTile label={ta.statsTotalViews}  value={totalViews}     icon={Eye}        color={primary} accent={accent} />
            <StatTile label={ta.statsWhatsapp}    value={totalWhatsapp}  icon={Smartphone} color="#16a34a" accent={isDark ? "#0a2e17" : "#f0fdf4"} />
            <StatTile label={ta.statsShares}      value={totalShares}    icon={Share2}     color="#7c3aed" accent={isDark ? "#1e0a40" : "#f5f3ff"} />
            <StatTile label={ta.statsActiveCount} value={activeCount}    icon={Home}       color="#d97706" accent={isDark ? "#2a1400" : "#fffbeb"} />
          </View>

          {/* Conversion rate */}
          <View style={{ backgroundColor: card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: border }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <TrendingUp size={16} color={primary} />
              <Text style={{ color: text, fontSize: 14, fontFamily: "DMSans_600SemiBold" }}>{ta.statsConversionRate}</Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 8 }}>
              <Text style={{ color: primary, fontSize: 36, fontFamily: "DMSans_700Bold", lineHeight: 40 }}>
                {conversionRate}{conversionRate !== "—" ? "%" : ""}
              </Text>
              <Text style={{ color: textMut, fontSize: 13, marginBottom: 4 }}>
                {totalEnquiries} {ta.kpiEnquiries.toLowerCase()} · {totalViews} {ta.kpiViews.toLowerCase()}
              </Text>
            </View>
            <View style={{ marginTop: 10, height: 6, borderRadius: 3, backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "#e2e8f0" }}>
              <View style={{
                width: `${Math.min(parseFloat(String(conversionRate)) || 0, 100)}%`,
                height: 6, borderRadius: 3, backgroundColor: primary,
              }} />
            </View>
          </View>

          {/* Best listing */}
          {topListing && (
            <View style={{ backgroundColor: card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: border }}>
              <Text style={{ color: textMut, fontSize: 11, fontFamily: "DMSans_600SemiBold", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>
                {ta.statsBestListing}
              </Text>
              <TouchableOpacity onPress={() => router.push(`/property/${topListing.id}` as any)}>
                <Text style={{ color: text, fontSize: 15, fontFamily: "DMSans_700Bold" }} numberOfLines={2}>
                  {topListing.title}
                </Text>
                <Text style={{ color: textMut, fontSize: 12, marginTop: 2 }}>
                  {[topListing.suburb, topListing.city].filter(Boolean).join(", ")}
                </Text>
              </TouchableOpacity>
              <View style={{ flexDirection: "row", gap: 16, marginTop: 12 }}>
                <View style={{ alignItems: "center" }}>
                  <Text style={{ color: primary, fontSize: 18, fontFamily: "DMSans_700Bold" }}>{topListing.performance?.viewed ?? 0}</Text>
                  <Text style={{ color: textMut, fontSize: 10 }}>{ta.kpiViews}</Text>
                </View>
                <View style={{ alignItems: "center" }}>
                  <Text style={{ color: "#16a34a", fontSize: 18, fontFamily: "DMSans_700Bold" }}>{topListing.performance?.whatsappClicks ?? 0}</Text>
                  <Text style={{ color: textMut, fontSize: 10 }}>WhatsApp</Text>
                </View>
                <View style={{ alignItems: "center" }}>
                  <Text style={{ color: "#7c3aed", fontSize: 18, fontFamily: "DMSans_700Bold" }}>{topListing.performance?.shared ?? 0}</Text>
                  <Text style={{ color: textMut, fontSize: 10 }}>{ta.statsShares}</Text>
                </View>
                <View style={{ alignItems: "center" }}>
                  <Text style={{ color: "#d97706", fontSize: 18, fontFamily: "DMSans_700Bold" }}>{topListing.enquiryCount ?? 0}</Text>
                  <Text style={{ color: textMut, fontSize: 10 }}>{ta.kpiEnquiries}</Text>
                </View>
              </View>
            </View>
          )}

          {/* Per-listing breakdown */}
          {sorted.length > 0 && (
            <View style={{ backgroundColor: card, borderRadius: 16, borderWidth: 1, borderColor: border, overflow: "hidden" }}>
              <View style={{ paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: border }}>
                <Text style={{ color: text, fontSize: 14, fontFamily: "DMSans_600SemiBold" }}>{ta.statsBreakdown}</Text>
              </View>
              {/* Table header */}
              <View style={{ flexDirection: "row", paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: border }}>
                <Text style={{ flex: 1, color: textMut, fontSize: 11, fontFamily: "DMSans_600SemiBold" }}>ANNONCE</Text>
                <Text style={{ width: 38, textAlign: "center", color: textMut, fontSize: 11, fontFamily: "DMSans_600SemiBold" }}>VUES</Text>
                <Text style={{ width: 38, textAlign: "center", color: textMut, fontSize: 11, fontFamily: "DMSans_600SemiBold" }}>WA</Text>
                <Text style={{ width: 38, textAlign: "center", color: textMut, fontSize: 11, fontFamily: "DMSans_600SemiBold" }}>DEM.</Text>
              </View>
              {sorted.map((p, i) => (
                <TouchableOpacity
                  key={p.id}
                  onPress={() => router.push(`/espace-agent/annonces/${p.id}` as any)}
                  style={{
                    flexDirection: "row", alignItems: "center",
                    paddingHorizontal: 16, paddingVertical: 12,
                    borderTopWidth: i === 0 ? 0 : 1, borderTopColor: border,
                  }}
                >
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text style={{ color: text, fontSize: 13, fontFamily: "DMSans_500Medium" }} numberOfLines={1}>{p.title}</Text>
                    <Text style={{ color: textMut, fontSize: 11 }}>
                      {ACTIVE_STATUSES.includes(p.status?.toLowerCase()) ? ta.statusActive : p.status}
                    </Text>
                  </View>
                  <Text style={{ width: 38, textAlign: "center", color: primary, fontSize: 13, fontFamily: "DMSans_600SemiBold" }}>
                    {p.performance?.viewed ?? 0}
                  </Text>
                  <Text style={{ width: 38, textAlign: "center", color: "#16a34a", fontSize: 13, fontFamily: "DMSans_600SemiBold" }}>
                    {p.performance?.whatsappClicks ?? 0}
                  </Text>
                  <Text style={{ width: 38, textAlign: "center", color: "#d97706", fontSize: 13, fontFamily: "DMSans_600SemiBold" }}>
                    {p.enquiryCount ?? 0}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
