import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { openURL } from "../../src/utils/linking";
import { useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { fetchAgentById } from "../../src/services/agents";
import { fetchProperties } from "../../src/services/properties";
import { useThemeStore } from "../../src/store/useThemeStore";
import { useT } from "../../src/i18n/useT";
import Loader from "../../src/components/ui/Loader";
import Avatar from "../../src/components/ui/Avatar";
import Badge from "../../src/components/ui/Badge";
import StarRating from "../../src/components/ui/StarRating";
import PropertyCard from "../../src/components/property/PropertyCard";
import { Colors } from "../../src/constants/colors";
import { Phone, MessageCircle, ChevronDown, ChevronUp } from "lucide-react-native";
import { API_URL } from "../../src/constants/api";

export default function AgentDetailScreen() {
  const t = useT();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme } = useThemeStore();
  const isDark = theme === "dark";
  const [bioExpanded, setBioExpanded] = useState(false);
  const [propTab, setPropTab] = useState<"sale" | "rent">("sale");

  const pageBg   = isDark ? Colors.dark.background : Colors.backgroundAlt;
  const cardBg   = isDark ? Colors.dark.card : Colors.white;
  const borderC  = isDark ? Colors.dark.border : Colors.border;
  const textMain = isDark ? Colors.dark.foreground : Colors.textDark;
  const textMut  = isDark ? Colors.dark.mutedFg : Colors.mutedFg;
  const altBg    = isDark ? Colors.dark.muted : Colors.backgroundAlt;
  const iconC    = isDark ? Colors.dark.primary : Colors.primary;

  const { data: agent, isLoading } = useQuery({
    queryKey: ["agent", id],
    queryFn: () => fetchAgentById(id!),
    enabled: !!id,
  });

  const { data: propsData } = useQuery({
    queryKey: ["agent-properties", id, propTab],
    queryFn: () => fetchProperties({ agentId: id!, listingType: propTab }),
    enabled: !!id,
  });

  const { data: saleData } = useQuery({
    queryKey: ["agent-sale-count", id],
    queryFn: () => fetchProperties({ agentId: id!, listingType: "sale" }),
    enabled: !!id,
  });

  const { data: rentData } = useQuery({
    queryKey: ["agent-rent-count", id],
    queryFn: () => fetchProperties({ agentId: id!, listingType: "rent" }),
    enabled: !!id,
  });

  if (isLoading) return <Loader />;
  if (!agent) return null;

  const photoUri = agent.photo
    ? agent.photo.startsWith("http") ? agent.photo : `${API_URL}/${agent.photo}`
    : null;

  const properties = propsData?.data ?? [];

  // Resolve total from meta (backend may use different key names) or fall back to data length
  function resolveTotal(result?: { data: any[]; meta: any }) {
    if (!result) return undefined;
    const m = result.meta;
    return m?.total ?? m?.totalItems ?? m?.totalCount ?? m?.count ?? result.data.length;
  }

  // Prefer live property query counts; fall back to agent fields (handling both camelCase & snake_case)
  const forSaleCount = resolveTotal(saleData) ?? (agent as any).for_sale_count ?? agent.forSaleCount ?? 0;
  const forRentCount = resolveTotal(rentData) ?? (agent as any).for_rent_count ?? agent.forRentCount ?? 0;
  const closedDeals  = (agent as any).closed_deals ?? agent.closedDeals ?? 0;

  const section = { backgroundColor: cardBg, paddingHorizontal: 20, paddingVertical: 16, marginBottom: 8 };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: pageBg }} showsVerticalScrollIndicator={false}>

      {/* ── Hero ────────────────────────────────────── */}
      <View style={{ backgroundColor: Colors.navy, paddingHorizontal: 20, paddingTop: 28, paddingBottom: 32, alignItems: "center" }}>
        <Avatar name={agent.name} photo={photoUri} size={88} />
        <Text style={{ color: "#FFFFFF", fontSize: 20, fontFamily: "DMSans_700Bold", marginTop: 12 }}>
          {agent.name}
        </Text>
        <View style={{ marginTop: 8, marginBottom: 10 }}>
          <Badge
            label={agent.title}
            variant={agent.title === "SUPERAGENT" ? "secondary" : agent.title === "AGENT EXCLUSIF" ? "gold" : "muted"}
          />
        </View>
        <StarRating rating={agent.rating} size={16} />
        <Text style={{ color: "rgba(255,255,255,0.55)", fontSize: 12, marginTop: 4 }}>{agent.ratingsCount} {t.agent.ratingsCount}</Text>
        <View style={{ flexDirection: "row", gap: 16, marginTop: 10 }}>
          {agent.nationality && (
            <Text style={{ color: "rgba(255,255,255,0.65)", fontSize: 12 }}>{agent.nationality}</Text>
          )}
          {agent.languages?.length > 0 && (
            <Text style={{ color: "rgba(255,255,255,0.65)", fontSize: 12 }}>{agent.languages.join(", ")}</Text>
          )}
        </View>
      </View>

      {/* ── Contact buttons ──────────────────────────── */}
      {agent.phone && (
        <View style={{ ...section, flexDirection: "row", gap: 12 }}>
          <TouchableOpacity
            onPress={() => openURL(`tel:${agent.phone}`)}
            style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderWidth: 1.5, borderColor: borderC, borderRadius: 14, paddingVertical: 13 }}
          >
            <Phone size={16} color={iconC} />
            <Text style={{ color: iconC, fontFamily: "DMSans_600SemiBold", fontSize: 14 }}>{t.property.call}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              const msg = encodeURIComponent(t.agent.whatsappGreeting.replace("{{name}}", agent.name));
              openURL(`https://wa.me/${agent.phone!.replace(/\D/g, "")}?text=${msg}`);
            }}
            style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#25D366", borderRadius: 14, paddingVertical: 13 }}
          >
            <MessageCircle size={16} color="#fff" />
            <Text style={{ color: "#fff", fontFamily: "DMSans_600SemiBold", fontSize: 14 }}>WhatsApp</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Agency ───────────────────────────────────── */}
      <View style={{ ...section, flexDirection: "row", alignItems: "center", gap: 14 }}>
        <View style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: Colors.navy, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: Colors.secondary, fontFamily: "DMSans_700Bold", fontSize: 15 }}>{agent.agencyMonogram}</Text>
        </View>
        <View>
          <Text style={{ color: textMain, fontFamily: "DMSans_600SemiBold", fontSize: 15 }}>{agent.agency}</Text>
          <Text style={{ color: textMut, fontSize: 12, marginTop: 2 }}>{agent.yearsExperience} {t.agent.experience}</Text>
        </View>
      </View>

      {/* ── Stats ────────────────────────────────────── */}
      <View style={section}>
        <View style={{ flexDirection: "row", gap: 10 }}>
          {[
            { label: t.agent.forSale,    value: forSaleCount  },
            { label: t.agent.forRent,    value: forRentCount  },
            { label: t.agent.dealsCount, value: closedDeals   },
          ].map(({ label, value }) => (
            <View key={label} style={{ flex: 1, alignItems: "center", backgroundColor: altBg, borderRadius: 14, paddingVertical: 14 }}>
              <Text style={{ color: iconC, fontSize: 22, fontFamily: "DMSans_700Bold" }}>{value}</Text>
              <Text style={{ color: textMut, fontSize: 11, marginTop: 3, textAlign: "center" }}>{label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* ── Bio ──────────────────────────────────────── */}
      <View style={section}>
        <Text style={{ color: textMain, fontFamily: "DMSans_700Bold", fontSize: 16, marginBottom: 10 }}>{t.agent.aboutSection}</Text>
        <Text style={{ color: textMut, fontSize: 14, lineHeight: 22 }} numberOfLines={bioExpanded ? undefined : 4}>
          {agent.bio}
        </Text>
        {agent.bio?.length > 200 && (
          <TouchableOpacity
            onPress={() => setBioExpanded(v => !v)}
            style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 8 }}
          >
            <Text style={{ color: iconC, fontSize: 13, fontFamily: "DMSans_500Medium" }}>
              {bioExpanded ? t.agent.readLess : t.agent.readMore}
            </Text>
            {bioExpanded
              ? <ChevronUp size={14} color={iconC} />
              : <ChevronDown size={14} color={iconC} />
            }
          </TouchableOpacity>
        )}
      </View>

      {/* ── Properties ───────────────────────────────── */}
      <View style={{ ...section, marginBottom: 32 }}>
        <Text style={{ color: textMain, fontFamily: "DMSans_700Bold", fontSize: 16, marginBottom: 14 }}>
          {t.agent.listingsSection}
        </Text>

        {/* Tab switcher */}
        <View style={{ flexDirection: "row", backgroundColor: altBg, borderRadius: 14, padding: 4, marginBottom: 16 }}>
          {(["sale", "rent"] as const).map(tab => (
            <TouchableOpacity
              key={tab}
              onPress={() => setPropTab(tab)}
              style={{
                flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: "center",
                backgroundColor: propTab === tab ? cardBg : "transparent",
                shadowColor: propTab === tab ? "#000" : "transparent",
                shadowOpacity: 0.08,
                shadowRadius: 4,
                elevation: propTab === tab ? 2 : 0,
              }}
            >
              <Text style={{
                fontSize: 14,
                fontFamily: propTab === tab ? "DMSans_600SemiBold" : "DMSans_400Regular",
                color: propTab === tab ? iconC : textMut,
              }}>
                {tab === "sale" ? t.agent.forSaleTab : t.agent.forRentTab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {properties.length === 0 ? (
          <Text style={{ color: textMut, fontSize: 14, textAlign: "center", paddingVertical: 20 }}>
            {t.agent.noProperties}
          </Text>
        ) : (
          properties.map(p => <PropertyCard key={p.id} property={p} />)
        )}
      </View>

    </ScrollView>
  );
}
