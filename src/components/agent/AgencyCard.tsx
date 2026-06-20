import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import type { Agency } from "../../types/agency";
import { Colors } from "../../constants/colors";
import { useThemeStore } from "../../store/useThemeStore";
import { MapPin, Users } from "lucide-react-native";

interface AgencyCardProps {
  agency: Agency;
}

export default function AgencyCard({ agency }: AgencyCardProps) {
  const { theme } = useThemeStore();
  const isDark = theme === "dark";

  const cardBg     = isDark ? Colors.dark.card      : Colors.white;
  const borderColor = isDark ? Colors.dark.border    : Colors.border;
  const textMain   = isDark ? Colors.dark.foreground : Colors.textDark;
  const textMuted  = isDark ? Colors.dark.mutedFg    : Colors.mutedFg;

  return (
    <TouchableOpacity
      onPress={() => router.push(`/agences/${agency.id}` as any)}
      activeOpacity={0.9}
      style={{
        backgroundColor: cardBg,
        borderColor,
        borderWidth: 1,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: isDark ? 0.2 : 0.05,
        shadowRadius: 3,
        elevation: 1,
      }}
    >
      {/* Monogram */}
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: 14,
          backgroundColor: Colors.navy,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ color: Colors.secondary, fontSize: 18, fontWeight: "700" }}>
          {agency.monogram}
        </Text>
      </View>

      <View style={{ flex: 1 }}>
        <Text
          style={{ color: textMain, fontFamily: "DMSans_600SemiBold", fontSize: 15, marginBottom: 2 }}
          numberOfLines={1}
        >
          {agency.name}
        </Text>
        <Text
          style={{ color: textMuted, fontSize: 12, marginBottom: 6 }}
          numberOfLines={1}
        >
          {agency.tagline}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4, flexShrink: 0 }}>
            <Users size={12} color={textMuted} />
            <Text style={{ color: textMuted, fontSize: 12 }}>
              {agency.agentCount} agents
            </Text>
          </View>
          {agency.areasServed?.length > 0 && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4, flexShrink: 1 }}>
              <MapPin size={12} color={textMuted} style={{ flexShrink: 0 }} />
              <Text style={{ color: textMuted, fontSize: 12, flexShrink: 1 }} numberOfLines={1} ellipsizeMode="tail">
                {agency.areasServed.slice(0, 2).join(", ")}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}
