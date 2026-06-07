import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import type { Agent } from "../../types/agent";
import Avatar from "../ui/Avatar";
import StarRating from "../ui/StarRating";
import Badge from "../ui/Badge";
import { Colors } from "../../constants/colors";
import { useThemeStore } from "../../store/useThemeStore";
import { API_URL } from "../../constants/api";

interface AgentCardProps {
  agent: Agent;
}

const titleVariant: Record<string, "secondary" | "gold" | "muted"> = {
  SUPERAGENT: "secondary",
  "AGENT EXCLUSIF": "gold",
  AGENT: "muted",
};

export default function AgentCard({ agent }: AgentCardProps) {
  const { theme } = useThemeStore();
  const isDark = theme === "dark";

  const cardBg = isDark ? Colors.dark.card : Colors.white;
  const borderColor = isDark ? Colors.dark.border : Colors.border;
  const textMain = isDark ? Colors.dark.foreground : Colors.textDark;
  const textMuted = isDark ? Colors.dark.mutedFg : Colors.mutedFg;

  const photoUri = agent.photo
    ? agent.photo.startsWith("http")
      ? agent.photo
      : `${API_URL}/${agent.photo}`
    : null;

  return (
    <TouchableOpacity
      onPress={() => router.push(`/agents/${agent.id}` as any)}
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
        shadowRadius: 4,
        elevation: 1,
      }}
    >
      <Avatar name={agent.name} photo={photoUri} size={56} />
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 2 }}>
          <Text
            style={{ color: textMain, fontFamily: "DMSans_600SemiBold", fontSize: 15, flex: 1 }}
            numberOfLines={1}
          >
            {agent.name}
          </Text>
          <Badge
            label={agent.title}
            variant={titleVariant[agent.title] ?? "muted"}
          />
        </View>
        <Text style={{ color: textMuted, fontSize: 12, marginBottom: 4 }}>
          {agent.specialization}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <StarRating rating={agent.rating} size={12} />
          <Text style={{ color: textMuted, fontSize: 12 }}>({agent.ratingsCount})</Text>
          {agent.agency && (
            <Text style={{ color: textMuted, fontSize: 12, marginLeft: 2 }}>· {agent.agency}</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}
