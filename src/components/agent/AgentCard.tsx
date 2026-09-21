import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import type { Agent, AgentGrade, AgentType } from "../../types/agent";
import Avatar from "../ui/Avatar";
import Badge from "../ui/Badge";
import { Colors } from "../../constants/colors";
import { useThemeStore } from "../../store/useThemeStore";
import { useT } from "../../i18n/useT";
import { API_URL } from "../../constants/api";

const GRADE_CONFIG: Record<string, { label: string; emoji: string; bg: string; text: string; border: string }> = {
  ACTIF:  { label: "Agent Actif",  emoji: "🟢", bg: "#d1fae5", text: "#065f46", border: "#6ee7b7" },
  FIABLE: { label: "Agent Fiable", emoji: "🔵", bg: "#dbeafe", text: "#1e3a8a", border: "#93c5fd" },
  EXPERT: { label: "Agent Expert", emoji: "⭐", bg: "#fef3c7", text: "#92400e", border: "#fcd34d" },
};

function GradeBadge({ grade }: { grade?: AgentGrade | null }) {
  if (!grade || grade === "NOUVEAU" || !GRADE_CONFIG[grade]) return null;
  const c = GRADE_CONFIG[grade];
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: c.bg, borderRadius: 99, paddingHorizontal: 7, paddingVertical: 2, borderWidth: 1, borderColor: c.border }}>
      <Text style={{ fontSize: 9 }}>{c.emoji}</Text>
      <Text style={{ color: c.text, fontSize: 10, fontFamily: "DMSans_600SemiBold" }}>{c.label}</Text>
    </View>
  );
}

interface AgentCardProps {
  agent: Agent;
}

const AGENT_TYPE_LABELS: Record<AgentType, string> = {
  COMMISSIONNAIRE: "Commissionnaire",
  AGENT: "Agent immo.",
  AGENCY_OWNER: "Propriétaire d'agence",
  OTHER: "Autre",
};

const AGENT_TYPE_VARIANT: Record<AgentType, "secondary" | "gold" | "muted"> = {
  COMMISSIONNAIRE: "muted",
  AGENT: "secondary",
  AGENCY_OWNER: "gold",
  OTHER: "muted",
};

export default function AgentCard({ agent }: AgentCardProps) {
  const { theme } = useThemeStore();
  const t = useT();
  const isDark = theme === "dark";

  const cardBg = isDark ? Colors.dark.card : Colors.white;
  const borderColor = isDark ? Colors.dark.border : Colors.border;
  const textMain = isDark ? Colors.dark.foreground : Colors.textDark;
  const textMuted = isDark ? Colors.dark.mutedFg : Colors.mutedFg;
  const chipBg = isDark ? Colors.dark.muted : Colors.backgroundAlt;

  const photoUri = agent.photo
    ? agent.photo.startsWith("http")
      ? agent.photo
      : `${API_URL}/${agent.photo}`
    : null;

  // Use new agentType if available, fall back to legacy title
  const typeLabel = agent.agentType
    ? AGENT_TYPE_LABELS[agent.agentType]
    : (agent.title ?? "Agent");
  const typeVariant = agent.agentType
    ? AGENT_TYPE_VARIANT[agent.agentType]
    : "muted";

  // Show up to 2 communes as chips
  const communes = agent.communes?.slice(0, 2) ?? [];

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
        alignItems: "flex-start",
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
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <Text
            style={{ color: textMain, fontFamily: "DMSans_600SemiBold", fontSize: 15, flex: 1 }}
            numberOfLines={1}
          >
            {agent.name}
          </Text>
          <Badge label={typeLabel} variant={typeVariant} />
        </View>

        {/* Agency, specialization, or "Independent" fallback */}
        <Text style={{ color: textMuted, fontSize: 12, marginBottom: agent.grade && agent.grade !== "NOUVEAU" ? 4 : 4 }} numberOfLines={1}>
          {agent.agency || agent.specialization || t.agent.independent}
        </Text>

        {/* Grade badge */}
        {agent.grade && agent.grade !== "NOUVEAU" && (
          <View style={{ marginBottom: 4 }}>
            <GradeBadge grade={agent.grade} />
          </View>
        )}

        {/* Commune chips */}
        {communes.length > 0 && (
          <View style={{ flexDirection: "row", gap: 4, flexWrap: "wrap" }}>
            {communes.map((c) => (
              <View key={c} style={{ backgroundColor: chipBg, borderRadius: 99, paddingHorizontal: 8, paddingVertical: 2 }}>
                <Text style={{ color: textMuted, fontSize: 11 }}>{c}</Text>
              </View>
            ))}
            {(agent.communes?.length ?? 0) > 2 && (
              <View style={{ backgroundColor: chipBg, borderRadius: 99, paddingHorizontal: 8, paddingVertical: 2 }}>
                <Text style={{ color: textMuted, fontSize: 11 }}>+{(agent.communes?.length ?? 0) - 2}</Text>
              </View>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}
