import React from "react";
import { View, Text, ScrollView, TouchableOpacity, Linking } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { fetchAgencyById } from "../../src/services/agencies";
import { fetchAgents } from "../../src/services/agents";
import { useThemeStore } from "../../src/store/useThemeStore";
import { useT } from "../../src/i18n/useT";
import Loader from "../../src/components/ui/Loader";
import AgentCard from "../../src/components/agent/AgentCard";
import { Colors } from "../../src/constants/colors";
import { Phone, Mail, MapPin, Globe, CheckCircle } from "lucide-react-native";

export default function AgenceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const t = useT();
  const { theme } = useThemeStore();
  const isDark = theme === "dark";

  const pageBg   = isDark ? Colors.dark.background : Colors.backgroundAlt;
  const cardBg   = isDark ? Colors.dark.card : Colors.white;
  const borderC  = isDark ? Colors.dark.border : Colors.border;
  const textMain = isDark ? Colors.dark.foreground : Colors.textDark;
  const textMut  = isDark ? Colors.dark.mutedFg : Colors.mutedFg;
  const altBg    = isDark ? Colors.dark.muted : Colors.backgroundAlt;
  const accentBg = isDark ? Colors.dark.accent : Colors.accent;
  const iconC    = isDark ? Colors.dark.primary : Colors.primary;

  const { data: agency, isLoading } = useQuery({
    queryKey: ["agency", id],
    queryFn: () => fetchAgencyById(id!),
    enabled: !!id,
  });

  const { data: agentsData } = useQuery({
    queryKey: ["agency-agents", id],
    queryFn: () => fetchAgents({}),
    enabled: !!id,
  });

  if (isLoading) return <Loader />;
  if (!agency) return null;

  const agents = (agentsData?.data ?? []).filter(a => a.agency === agency.name).slice(0, 6);
  const section = { backgroundColor: cardBg, paddingHorizontal: 20, paddingVertical: 16, marginBottom: 8 };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: pageBg }} showsVerticalScrollIndicator={false}>

      {/* Hero */}
      <View style={{ backgroundColor: Colors.navy, paddingHorizontal: 20, paddingTop: 32, paddingBottom: 32, alignItems: "center" }}>
        <View style={{ width: 80, height: 80, borderRadius: 20, backgroundColor: "rgba(212,175,55,0.2)", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
          <Text style={{ color: Colors.secondary, fontSize: 28, fontFamily: "DMSans_700Bold" }}>{agency.monogram}</Text>
        </View>
        <Text style={{ color: "#FFFFFF", fontSize: 20, fontFamily: "DMSans_700Bold", textAlign: "center" }}>{agency.name}</Text>
        <Text style={{ color: "rgba(255,255,255,0.65)", fontSize: 13, marginTop: 4, textAlign: "center" }}>{agency.tagline}</Text>
      </View>

      {/* Stats */}
      <View style={section}>
        <View style={{ flexDirection: "row", gap: 8 }}>
          {[
            { label: t.agency.agents,       value: agency.agentCount },
            { label: t.agency.listings,     value: agency.listingCount },
            { label: t.agency.transactions, value: agency.closedDeals },
            { label: t.agency.years,        value: new Date().getFullYear() - agency.founded },
          ].map(({ label, value }) => (
            <View key={label} style={{ flex: 1, alignItems: "center", backgroundColor: altBg, borderRadius: 12, paddingVertical: 12 }}>
              <Text style={{ color: iconC, fontSize: 18, fontFamily: "DMSans_700Bold" }}>{value}</Text>
              <Text style={{ color: textMut, fontSize: 11, marginTop: 2, textAlign: "center" }}>{label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* About */}
      <View style={section}>
        <Text style={{ color: textMain, fontFamily: "DMSans_700Bold", fontSize: 16, marginBottom: 8 }}>{t.agency.about}</Text>
        <Text style={{ color: textMut, fontSize: 14, lineHeight: 22 }}>{agency.description}</Text>
      </View>

      {/* Specializations */}
      {agency.specializations?.length > 0 && (
        <View style={section}>
          <Text style={{ color: textMain, fontFamily: "DMSans_700Bold", fontSize: 16, marginBottom: 12 }}>{t.agency.specializations}</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {agency.specializations.map((s, i) => (
              <View key={i} style={{ backgroundColor: accentBg, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 }}>
                <Text style={{ color: iconC, fontSize: 12, fontFamily: "DMSans_500Medium" }}>{s}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Areas served */}
      {agency.areasServed?.length > 0 && (
        <View style={section}>
          <Text style={{ color: textMain, fontFamily: "DMSans_700Bold", fontSize: 16, marginBottom: 10 }}>{t.agency.areasServed}</Text>
          {agency.areasServed.map((area, i) => (
            <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 6 }}>
              <MapPin size={14} color={iconC} />
              <Text style={{ color: textMain, fontSize: 14 }}>{area}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Team */}
      {agents.length > 0 && (
        <View style={section}>
          <Text style={{ color: textMain, fontFamily: "DMSans_700Bold", fontSize: 16, marginBottom: 12 }}>{t.agency.team}</Text>
          {agents.map(a => <AgentCard key={a.id} agent={a} />)}
        </View>
      )}

      {/* Contact */}
      <View style={section}>
        <Text style={{ color: textMain, fontFamily: "DMSans_700Bold", fontSize: 16, marginBottom: 12 }}>{t.agency.contact}</Text>
        {[
          { icon: MapPin, label: agency.address, onPress: undefined },
          { icon: Phone,  label: agency.phone,   onPress: agency.phone  ? () => Linking.openURL(`tel:${agency.phone}`) : undefined },
          { icon: Mail,   label: agency.email,   onPress: agency.email  ? () => Linking.openURL(`mailto:${agency.email}`) : undefined },
          agency.website ? { icon: Globe, label: agency.website, onPress: () => Linking.openURL(agency.website!) } : null,
        ].filter(Boolean).map(({ icon: Icon, label, onPress }: any, i) => (
          <TouchableOpacity
            key={i}
            onPress={onPress}
            disabled={!onPress}
            style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8 }}
          >
            <Icon size={16} color={iconC} />
            <Text style={{ fontSize: 14, flex: 1, color: onPress ? iconC : textMain }}>{label}</Text>
          </TouchableOpacity>
        ))}
        {agency.languages?.length > 0 && (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
            {agency.languages.map((l, i) => (
              <View key={i} style={{ backgroundColor: altBg, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 }}>
                <Text style={{ color: textMut, fontSize: 12 }}>{l}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Certifications */}
      {agency.certifications?.length > 0 && (
        <View style={{ ...section, marginBottom: 32 }}>
          <Text style={{ color: textMain, fontFamily: "DMSans_700Bold", fontSize: 16, marginBottom: 12 }}>{t.agency.certifications}</Text>
          {agency.certifications.map((c, i) => (
            <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 6 }}>
              <CheckCircle size={14} color="#22c55e" />
              <Text style={{ color: textMain, fontSize: 14 }}>{c}</Text>
            </View>
          ))}
        </View>
      )}

    </ScrollView>
  );
}
