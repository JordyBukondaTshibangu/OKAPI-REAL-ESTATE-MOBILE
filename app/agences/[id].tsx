import React from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { openURL } from "../../src/utils/linking";
import { useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { fetchAgencyById, fetchAgentsByAgency } from "../../src/services/agencies";
import { useThemeStore } from "../../src/store/useThemeStore";
import { useT } from "../../src/i18n/useT";
import Loader from "../../src/components/ui/Loader";
import AgentCard from "../../src/components/agent/AgentCard";
import { Colors } from "../../src/constants/colors";
import {
  Phone, Mail, MapPin, Globe, CheckCircle, ShieldCheck,
  MessageCircle, Users, Home, Award, TrendingUp, Building2,
} from "lucide-react-native";
import type { RentalFocus } from "../../src/types/agency";

const RENTAL_FOCUS_LABELS: Record<RentalFocus, string> = {
  LONG_TERM:  "Location longue durée",
  SHORT_TERM: "Location courte durée",
  BOTH:       "Vente & Location",
};

function getMonogram(name: string, monogram?: string | null): string {
  if (monogram) return monogram;
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

export default function AgenceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const t = useT();
  const { theme } = useThemeStore();
  const isDark = theme === "dark";

  const pageBg  = isDark ? Colors.dark.background : Colors.backgroundAlt;
  const cardBg  = isDark ? Colors.dark.card        : Colors.white;
  const borderC = isDark ? Colors.dark.border      : Colors.border;
  const textMain= isDark ? Colors.dark.foreground  : Colors.textDark;
  const textMut = isDark ? Colors.dark.mutedFg     : Colors.mutedFg;
  const altBg   = isDark ? Colors.dark.muted       : Colors.backgroundAlt;
  const iconC   = isDark ? Colors.dark.primary     : Colors.primary;
  const chipBg  = isDark ? Colors.dark.muted       : "#f1f5f9";

  const { data: agency, isLoading } = useQuery({
    queryKey: ["agency", id],
    queryFn: () => fetchAgencyById(id!),
    enabled: !!id,
  });

  const { data: agents = [] } = useQuery({
    queryKey: ["agency-agents", id],
    queryFn: () => fetchAgentsByAgency(id!),
    enabled: !!id,
  });

  if (isLoading) return <Loader />;
  if (!agency) return null;

  const section = { backgroundColor: cardBg, paddingHorizontal: 20, paddingVertical: 16, marginBottom: 8 };
  const monogram    = getMonogram(agency.name, agency.monogram);
  const yearsActive = agency.founded ? new Date().getFullYear() - agency.founded : null;
  const waNumber    = (agency.whatsapp ?? agency.phone).replace(/\D/g, "");
  const waMsg       = encodeURIComponent(`Bonjour ${agency.name}, je vous contacte via Okapi Real Estate.`);

  const stats = [
    { label: t.agency.agents,       value: agents.length || agency.agentCount  || 0, color: "#1B4FD8" },
    { label: t.agency.listings,     value: agency.listingCount  || 0,               color: Colors.secondary },
    { label: t.agency.transactions, value: agency.closedDeals   || 0,               color: "#22c55e" },
    ...(yearsActive !== null ? [{ label: t.agency.years, value: yearsActive, color: "#9333ea" }] : []),
  ];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: pageBg }} showsVerticalScrollIndicator={false}>

      {/* Hero */}
      <View style={{ backgroundColor: Colors.navy, paddingHorizontal: 20, paddingTop: 32, paddingBottom: 32, alignItems: "center" }}>
        <View style={{
          width: 80, height: 80, borderRadius: 20,
          backgroundColor: Colors.secondary, alignItems: "center", justifyContent: "center",
          marginBottom: 14,
          shadowColor: Colors.secondary, shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.4, shadowRadius: 12, elevation: 6,
        }}>
          <Text style={{ color: Colors.navy, fontSize: 26, fontFamily: "DMSans_700Bold" }}>{monogram}</Text>
        </View>

        <Text style={{ color: "#fff", fontSize: 22, fontFamily: "DMSans_700Bold", textAlign: "center", marginBottom: 8 }}>
          {agency.name}
        </Text>

        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "center", marginBottom: 8 }}>
          {agency.founded && (
            <View style={{ backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4 }}>
              <Text style={{ color: "rgba(255,255,255,0.75)", fontSize: 12, fontFamily: "DMSans_500Medium" }}>Est. {agency.founded}</Text>
            </View>
          )}
          {agency.rccmNumber && (
            <View style={{ backgroundColor: "rgba(34,197,94,0.2)", borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4, flexDirection: "row", alignItems: "center", gap: 4 }}>
              <ShieldCheck size={11} color="#4ade80" />
              <Text style={{ color: "#4ade80", fontSize: 12, fontFamily: "DMSans_600SemiBold" }}>RCCM vérifié</Text>
            </View>
          )}
        </View>

        {agency.tagline && (
          <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, fontStyle: "italic", textAlign: "center", maxWidth: 300 }}>
            "{agency.tagline}"
          </Text>
        )}

        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 14, justifyContent: "center" }}>
          {agency.email && (
            <TouchableOpacity onPress={() => openURL(`mailto:${agency.email}`)} style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
              <Mail size={12} color="rgba(255,255,255,0.5)" />
              <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 11 }}>{agency.email}</Text>
            </TouchableOpacity>
          )}
          {agency.phone && (
            <TouchableOpacity onPress={() => openURL(`tel:${agency.phone}`)} style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
              <Phone size={12} color="rgba(255,255,255,0.5)" />
              <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 11 }}>{agency.phone}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Stats */}
      <View style={{ ...section, marginTop: -1 }}>
        <View style={{ flexDirection: "row", gap: 8 }}>
          {stats.map(({ label, value, color }) => (
            <View key={label} style={{ flex: 1, alignItems: "center", backgroundColor: altBg, borderRadius: 14, paddingVertical: 14 }}>
              <Text style={{ color, fontSize: 20, fontFamily: "DMSans_700Bold" }}>{value}</Text>
              <Text style={{ color: textMut, fontSize: 11, marginTop: 3, textAlign: "center" }}>{label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* About */}
      {(agency.description || agency.tagline) && (
        <View style={section}>
          <Text style={{ color: textMain, fontFamily: "DMSans_700Bold", fontSize: 16, marginBottom: 8 }}>{t.agency.about}</Text>
          <Text style={{ color: textMut, fontSize: 14, lineHeight: 22 }}>{agency.description || agency.tagline}</Text>
        </View>
      )}

      {/* Activité & Marché */}
      {((agency.communes?.length ?? 0) > 0 || (agency.propertyTypes?.length ?? 0) > 0 || agency.rentalFocus) && (
        <View style={section}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 14 }}>
            <Building2 size={16} color="#1B4FD8" />
            <Text style={{ color: textMain, fontFamily: "DMSans_700Bold", fontSize: 16 }}>Activité & Marché</Text>
          </View>

          {agency.rentalFocus && (
            <View style={{ marginBottom: 12 }}>
              <Text style={{ color: textMut, fontSize: 11, fontFamily: "DMSans_600SemiBold", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 }}>Focus</Text>
              <View style={{ backgroundColor: "#1B4FD810", borderRadius: 99, paddingHorizontal: 14, paddingVertical: 6, alignSelf: "flex-start", borderWidth: 1, borderColor: "#1B4FD830" }}>
                <Text style={{ color: "#1B4FD8", fontSize: 13, fontFamily: "DMSans_600SemiBold" }}>{RENTAL_FOCUS_LABELS[agency.rentalFocus]}</Text>
              </View>
            </View>
          )}

          {(agency.communes?.length ?? 0) > 0 && (
            <View style={{ marginBottom: 12 }}>
              <Text style={{ color: textMut, fontSize: 11, fontFamily: "DMSans_600SemiBold", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 }}>Communes couvertes</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                {agency.communes!.map((c) => (
                  <View key={c} style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: chipBg, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: borderC }}>
                    <MapPin size={10} color={textMut} />
                    <Text style={{ color: textMain, fontSize: 12 }}>{c}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {(agency.propertyTypes?.length ?? 0) > 0 && (
            <View>
              <Text style={{ color: textMut, fontSize: 11, fontFamily: "DMSans_600SemiBold", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 }}>Types de biens</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                {agency.propertyTypes!.map((p) => (
                  <View key={p} style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: `${Colors.secondary}18`, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: `${Colors.secondary}30` }}>
                    <Home size={10} color={Colors.secondary} />
                    <Text style={{ color: Colors.secondary, fontSize: 12, fontFamily: "DMSans_500Medium" }}>{p}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      )}

      {/* Team */}
      {agents.length > 0 && (
        <View style={section}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 14 }}>
            <Users size={16} color={iconC} />
            <Text style={{ color: textMain, fontFamily: "DMSans_700Bold", fontSize: 16 }}>{t.agency.team} ({agents.length})</Text>
          </View>
          {agents.map(a => <AgentCard key={a.id} agent={a} />)}
        </View>
      )}

      {/* Specializations */}
      {(agency.specializations?.length ?? 0) > 0 && (
        <View style={section}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12 }}>
            <Award size={16} color={Colors.secondary} />
            <Text style={{ color: textMain, fontFamily: "DMSans_700Bold", fontSize: 16 }}>{t.agency.specializations}</Text>
          </View>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {agency.specializations!.map((s) => (
              <View key={s} style={{ backgroundColor: `${Colors.secondary}15`, borderRadius: 99, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: `${Colors.secondary}25` }}>
                <Text style={{ color: Colors.secondary, fontSize: 12, fontFamily: "DMSans_500Medium" }}>{s}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Contact */}
      <View style={section}>
        <Text style={{ color: textMain, fontFamily: "DMSans_700Bold", fontSize: 16, marginBottom: 14 }}>{t.agency.contact}</Text>
        {[
          agency.address   && { icon: MapPin,      label: agency.address,                             href: undefined },
          agency.phone     && { icon: Phone,        label: agency.phone,                               href: `tel:${agency.phone}` },
          agency.email     && { icon: Mail,         label: agency.email,                               href: `mailto:${agency.email}` },
          agency.website   && { icon: Globe,        label: agency.website.replace(/^https?:\/\//, ""), href: agency.website },
          agency.rccmNumber && { icon: ShieldCheck, label: `RCCM: ${agency.rccmNumber}`,              href: undefined },
        ].filter(Boolean).map((item: any, i: number) => {
          const { icon: Icon, label, href } = item;
          return (
            <TouchableOpacity key={i} onPress={href ? () => openURL(href) : undefined} disabled={!href}
              style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10 }}>
              <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: altBg, alignItems: "center", justifyContent: "center" }}>
                <Icon size={16} color={href ? iconC : textMut} />
              </View>
              <Text style={{ fontSize: 14, flex: 1, color: href ? iconC : textMain }}>{label}</Text>
            </TouchableOpacity>
          );
        })}

        {(agency.languages?.length ?? 0) > 0 && (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
            {agency.languages!.map((l) => (
              <View key={l} style={{ backgroundColor: altBg, borderRadius: 99, paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1, borderColor: borderC }}>
                <Text style={{ color: textMut, fontSize: 12 }}>{l}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={{ flexDirection: "row", gap: 10, marginTop: 16 }}>
          <TouchableOpacity onPress={() => openURL(`https://wa.me/${waNumber}?text=${waMsg}`)}
            style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#25D366", borderRadius: 14, paddingVertical: 13 }}>
            <MessageCircle size={16} color="#fff" />
            <Text style={{ color: "#fff", fontFamily: "DMSans_600SemiBold", fontSize: 14 }}>WhatsApp</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => openURL(`tel:${agency.phone}`)}
            style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderWidth: 1.5, borderColor: borderC, borderRadius: 14, paddingVertical: 13 }}>
            <Phone size={16} color={iconC} />
            <Text style={{ color: iconC, fontFamily: "DMSans_600SemiBold", fontSize: 14 }}>{t.property.call}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* RCCM badge */}
      {agency.rccmNumber && (
        <View style={{ marginHorizontal: 16, marginBottom: 12, flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: isDark ? "rgba(34,197,94,0.1)" : "#f0fdf4", borderRadius: 16, padding: 14, borderWidth: 1, borderColor: isDark ? "rgba(34,197,94,0.3)" : "#bbf7d0" }}>
          <ShieldCheck size={28} color="#22c55e" />
          <View>
            <Text style={{ color: isDark ? "#4ade80" : "#15803d", fontSize: 13, fontFamily: "DMSans_700Bold" }}>Agence vérifiée</Text>
            <Text style={{ color: isDark ? "#86efac" : "#16a34a", fontSize: 12, marginTop: 1 }}>Enregistrée au RCCM de Kinshasa</Text>
          </View>
        </View>
      )}

      {/* Certifications */}
      {(agency.certifications?.length ?? 0) > 0 && (
        <View style={{ ...section, marginBottom: 32 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12 }}>
            <TrendingUp size={16} color="#22c55e" />
            <Text style={{ color: textMain, fontFamily: "DMSans_700Bold", fontSize: 16 }}>{t.agency.certifications}</Text>
          </View>
          {agency.certifications!.map((c) => (
            <View key={c} style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 7 }}>
              <CheckCircle size={14} color="#22c55e" />
              <Text style={{ color: textMain, fontSize: 14 }}>{c}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}
