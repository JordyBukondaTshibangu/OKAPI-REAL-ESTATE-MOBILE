import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import type { Agent } from "../../types/agent";
import Avatar from "../ui/Avatar";
import StarRating from "../ui/StarRating";
import Badge from "../ui/Badge";
import { Colors } from "../../constants/colors";
import { API_URL } from "../../constants/api";

interface AgentCardProps {
  agent: Agent;
}

const titleVariant: Record<string, "secondary" | "gold" | "muted"> = {
  "SUPERAGENT": "secondary",
  "AGENT EXCLUSIF": "gold",
  "AGENT": "muted",
};

export default function AgentCard({ agent }: AgentCardProps) {
  const photoUri = agent.photo
    ? agent.photo.startsWith("http") ? agent.photo : `${API_URL}/${agent.photo}`
    : null;

  return (
    <TouchableOpacity
      onPress={() => router.push(`/agents/${agent.id}` as any)}
      activeOpacity={0.9}
      className="bg-white rounded-2xl border border-border p-4 mb-3 flex-row items-center gap-4"
      style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1 }}
    >
      <Avatar name={agent.name} photo={photoUri} size={56} />
      <View className="flex-1">
        <View className="flex-row items-center gap-2 mb-0.5">
          <Text className="text-text-dark font-sans-semibold text-base flex-1" numberOfLines={1}>{agent.name}</Text>
          <Badge label={agent.title} variant={titleVariant[agent.title] ?? "muted"} />
        </View>
        <Text className="text-muted-fg text-xs mb-1">{agent.specialization}</Text>
        <View className="flex-row items-center gap-2">
          <StarRating rating={agent.rating} size={12} />
          <Text className="text-muted-fg text-xs">({agent.ratingsCount})</Text>
          {agent.agency && (
            <Text className="text-muted-fg text-xs ml-1">· {agent.agency}</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}
