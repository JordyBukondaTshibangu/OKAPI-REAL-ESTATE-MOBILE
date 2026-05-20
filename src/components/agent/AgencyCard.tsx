import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import type { Agency } from "../../types/agency";
import { Colors } from "../../constants/colors";
import { MapPin, Users } from "lucide-react-native";

interface AgencyCardProps {
  agency: Agency;
}

export default function AgencyCard({ agency }: AgencyCardProps) {
  return (
    <TouchableOpacity
      onPress={() => router.push(`/agences/${agency.id}` as any)}
      activeOpacity={0.9}
      className="bg-white rounded-2xl border border-border p-4 mb-3 flex-row items-center gap-4"
      style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1 }}
    >
      {/* Monogram */}
      <View
        className="rounded-xl items-center justify-center"
        style={{ width: 56, height: 56, backgroundColor: Colors.navy }}
      >
        <Text style={{ color: Colors.secondary, fontSize: 18, fontWeight: "700" }}>{agency.monogram}</Text>
      </View>

      <View className="flex-1">
        <Text className="text-text-dark font-sans-semibold text-base" numberOfLines={1}>{agency.name}</Text>
        <Text className="text-muted-fg text-xs mb-1.5" numberOfLines={1}>{agency.tagline}</Text>
        <View className="flex-row items-center gap-3">
          <View className="flex-row items-center gap-1">
            <Users size={12} color={Colors.mutedFg} />
            <Text className="text-muted-fg text-xs">{agency.agentCount} agents</Text>
          </View>
          {agency.areasServed?.length > 0 && (
            <View className="flex-row items-center gap-1">
              <MapPin size={12} color={Colors.mutedFg} />
              <Text className="text-muted-fg text-xs" numberOfLines={1}>{agency.areasServed.slice(0, 2).join(", ")}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}
