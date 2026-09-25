import React, { useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator,
  RefreshControl, Linking, Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft, MessageSquare, Mail, Phone, Home, Clock, ChevronRight,
} from "lucide-react-native";
import { useAgentSessionStore } from "../../../src/store/useAgentSessionStore";
import { useThemeStore } from "../../../src/store/useThemeStore";
import { useT } from "../../../src/i18n/useT";
import { Colors } from "../../../src/constants/colors";
import { API_URL } from "../../../src/constants/api";

type Enquiry = {
  id: string;
  message: string;
  createdAt: string;
  property: { id: string; title: string; suburb?: string; city: string };
  user: { id: string; firstName?: string; lastName?: string; email?: string; phoneNumber?: string };
};

function timeAgo(dateStr: string): string {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return "À l'instant";
  if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `Il y a ${Math.floor(diff / 86400)}j`;
  return new Date(dateStr).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

export default function DemandesScreen() {
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

  const [expanded, setExpanded] = useState<string | null>(null);

  const { data: enquiries = [], isLoading, isRefetching, refetch } = useQuery<Enquiry[]>({
    queryKey: ["agent-enquiries", token],
    queryFn: async () => {
      const r = await axios.get(`${API_URL}/properties/mine/enquiries`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return r.data;
    },
    enabled: !!token,
    staleTime: 60_000,
  });

  function userName(u: Enquiry["user"]) {
    if (u.firstName || u.lastName) return [u.firstName, u.lastName].filter(Boolean).join(" ");
    if (u.email) return u.email;
    return "Utilisateur";
  }

  function handleEmail(email?: string) {
    if (!email) return;
    Linking.openURL(`mailto:${email}`).catch(() =>
      Alert.alert("Erreur", "Impossible d'ouvrir le client email."),
    );
  }

  function handlePhone(phone?: string) {
    if (!phone) return;
    Linking.openURL(`tel:${phone}`).catch(() =>
      Alert.alert("Erreur", "Impossible de lancer l'appel."),
    );
  }

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
            <MessageSquare size={18} color={Colors.secondary} />
          </View>
          <View>
            <Text style={{ color: "#fff", fontSize: 18, fontFamily: "DMSans_700Bold" }}>{ta.demandesTitle}</Text>
            <Text style={{ color: "rgba(255,255,255,0.55)", fontSize: 12, marginTop: 1 }}>
              {enquiries.length} {ta.kpiEnquiries.toLowerCase()}
            </Text>
          </View>
        </View>
      </View>

      {isLoading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={primary} size="large" />
        </View>
      ) : enquiries.length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 32 }}>
          <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: accent, alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
            <MessageSquare size={28} color={primary} />
          </View>
          <Text style={{ color: text, fontSize: 16, fontFamily: "DMSans_700Bold", textAlign: "center" }}>
            {ta.demandesEmpty}
          </Text>
          <Text style={{ color: textMut, fontSize: 13, textAlign: "center", marginTop: 6, lineHeight: 20 }}>
            {ta.demandesEmptyDesc}
          </Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 16, paddingBottom: 96, gap: 10 }}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={primary} />}
        >
          {enquiries.map((eq) => {
            const isOpen = expanded === eq.id;
            const name = userName(eq.user);
            const location = [eq.property.suburb, eq.property.city].filter(Boolean).join(", ");

            return (
              <View
                key={eq.id}
                style={{ backgroundColor: card, borderRadius: 16, borderWidth: 1, borderColor: border, overflow: "hidden" }}
              >
                {/* Row header */}
                <TouchableOpacity
                  onPress={() => setExpanded(isOpen ? null : eq.id)}
                  activeOpacity={0.75}
                  style={{ padding: 14, flexDirection: "row", alignItems: "flex-start", gap: 12 }}
                >
                  {/* Avatar */}
                  <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: accent, alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Text style={{ color: primary, fontSize: 15, fontFamily: "DMSans_700Bold" }}>
                      {name.charAt(0).toUpperCase()}
                    </Text>
                  </View>

                  <View style={{ flex: 1, gap: 3 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                      <Text style={{ color: text, fontSize: 14, fontFamily: "DMSans_600SemiBold" }} numberOfLines={1}>
                        {name}
                      </Text>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                        <Clock size={11} color={textMut} />
                        <Text style={{ color: textMut, fontSize: 11 }}>{timeAgo(eq.createdAt)}</Text>
                      </View>
                    </View>

                    {/* Property ref */}
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                      <Home size={11} color={primary} />
                      <Text style={{ color: primary, fontSize: 12, fontFamily: "DMSans_500Medium" }} numberOfLines={1}>
                        {eq.property.title}
                      </Text>
                    </View>
                    {!!location && (
                      <Text style={{ color: textMut, fontSize: 11 }}>{location}</Text>
                    )}

                    {/* Message preview */}
                    <Text style={{ color: textMut, fontSize: 12, marginTop: 2, lineHeight: 17 }} numberOfLines={isOpen ? undefined : 2}>
                      {eq.message}
                    </Text>
                  </View>

                  <ChevronRight
                    size={16}
                    color={textMut}
                    style={{ transform: [{ rotate: isOpen ? "90deg" : "0deg" }], marginTop: 4 }}
                  />
                </TouchableOpacity>

                {/* Expanded actions */}
                {isOpen && (
                  <View style={{ borderTopWidth: 1, borderTopColor: border, padding: 12, gap: 8 }}>
                    {/* Full message */}
                    <View style={{ backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "#f8fafc", borderRadius: 10, padding: 12 }}>
                      <Text style={{ color: textMut, fontSize: 11, fontFamily: "DMSans_600SemiBold", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>
                        {ta.demandesFullMessage}
                      </Text>
                      <Text style={{ color: text, fontSize: 13, lineHeight: 19 }}>{eq.message}</Text>
                    </View>

                    {/* Contact buttons */}
                    <View style={{ flexDirection: "row", gap: 8 }}>
                      {eq.user.email && (
                        <TouchableOpacity
                          onPress={() => handleEmail(eq.user.email)}
                          style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, borderRadius: 10, borderWidth: 1.5, borderColor: primary }}
                        >
                          <Mail size={14} color={primary} />
                          <Text style={{ color: primary, fontSize: 13, fontFamily: "DMSans_600SemiBold" }}>{ta.demandesEmail}</Text>
                        </TouchableOpacity>
                      )}
                      {eq.user.phoneNumber && (
                        <TouchableOpacity
                          onPress={() => handlePhone(eq.user.phoneNumber)}
                          style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, borderRadius: 10, backgroundColor: "#25D366" }}
                        >
                          <Phone size={14} color="#fff" />
                          <Text style={{ color: "#fff", fontSize: 13, fontFamily: "DMSans_600SemiBold" }}>{ta.demandesCall}</Text>
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity
                        onPress={() => router.push(`/property/${eq.property.id}` as any)}
                        style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, borderRadius: 10, backgroundColor: accent }}
                      >
                        <Home size={14} color={primary} />
                        <Text style={{ color: primary, fontSize: 13, fontFamily: "DMSans_600SemiBold" }}>{ta.demandesGoToListing}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
