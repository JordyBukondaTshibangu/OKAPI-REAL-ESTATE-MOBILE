import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, FlatList, Linking } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { fetchAgentById } from "../../src/services/agents";
import { fetchProperties } from "../../src/services/properties";
import Loader from "../../src/components/ui/Loader";
import Avatar from "../../src/components/ui/Avatar";
import Badge from "../../src/components/ui/Badge";
import StarRating from "../../src/components/ui/StarRating";
import PropertyCard from "../../src/components/property/PropertyCard";
import { Colors } from "../../src/constants/colors";
import { Phone, MessageCircle, ChevronDown, ChevronUp } from "lucide-react-native";
import { API_URL } from "../../src/constants/api";

export default function AgentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [bioExpanded, setBioExpanded] = useState(false);
  const [propTab, setPropTab] = useState<"sale" | "rent">("sale");

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

  if (isLoading) return <Loader />;
  if (!agent) return null;

  const photoUri = agent.photo
    ? agent.photo.startsWith("http") ? agent.photo : `${API_URL}/${agent.photo}`
    : null;

  const properties = propsData?.data ?? [];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: Colors.backgroundAlt }} showsVerticalScrollIndicator={false}>
      {/* Hero */}
      <View className="bg-navy px-5 pt-6 pb-8 items-center">
        <Avatar name={agent.name} photo={photoUri} size={88} />
        <Text className="text-white text-xl font-sans-bold mt-3">{agent.name}</Text>
        <View className="mt-2 mb-3">
          <Badge label={agent.title} variant={agent.title === "SUPERAGENT" ? "secondary" : agent.title === "AGENT EXCLUSIF" ? "gold" : "muted"} />
        </View>
        <StarRating rating={agent.rating} size={16} />
        <Text className="text-white/60 text-xs mt-1">{agent.ratingsCount} avis</Text>
        <View className="flex-row gap-4 mt-3">
          <Text className="text-white/70 text-xs">{agent.nationality}</Text>
          {agent.languages?.length > 0 && (
            <Text className="text-white/70 text-xs">{agent.languages.join(", ")}</Text>
          )}
        </View>
      </View>

      {/* Contact */}
      {agent.phone && (
        <View className="bg-white px-5 py-4 mb-2 flex-row gap-3">
          <TouchableOpacity
            onPress={() => Linking.openURL(`tel:${agent.phone}`)}
            className="flex-1 flex-row items-center justify-center gap-2 border border-border rounded-xl py-3"
          >
            <Phone size={16} color={Colors.primary} />
            <Text className="text-primary font-sans-medium">Appeler</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              const msg = encodeURIComponent(`Bonjour ${agent.name}, je souhaite vous contacter.`);
              Linking.openURL(`https://wa.me/${agent.phone!.replace(/\D/g, "")}?text=${msg}`);
            }}
            className="flex-1 flex-row items-center justify-center gap-2 bg-green-500 rounded-xl py-3"
          >
            <MessageCircle size={16} color="#fff" />
            <Text className="text-white font-sans-medium">WhatsApp</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Agency */}
      <View className="bg-white px-5 py-4 mb-2 flex-row items-center gap-3">
        <View className="w-12 h-12 rounded-xl bg-navy items-center justify-center">
          <Text style={{ color: Colors.secondary, fontWeight: "700" }}>{agent.agencyMonogram}</Text>
        </View>
        <View>
          <Text className="text-text-dark font-sans-semibold">{agent.agency}</Text>
          <Text className="text-muted-fg text-xs">{agent.yearsExperience} ans d'expérience</Text>
        </View>
      </View>

      {/* Stats */}
      <View className="bg-white px-5 py-4 mb-2">
        <View className="flex-row gap-2">
          {[
            { label: "À vendre", value: agent.forSaleCount },
            { label: "À louer", value: agent.forRentCount },
            { label: "Deals clôturés", value: agent.closedDeals },
          ].map(({ label, value }) => (
            <View key={label} className="flex-1 items-center bg-background-alt rounded-xl py-3">
              <Text className="text-primary text-xl font-sans-bold">{value}</Text>
              <Text className="text-muted-fg text-xs mt-0.5 text-center">{label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Bio */}
      <View className="bg-white px-5 py-4 mb-2">
        <Text className="text-text-dark font-sans-semibold text-base mb-2">À propos</Text>
        <Text className="text-muted-fg text-sm leading-6" numberOfLines={bioExpanded ? undefined : 4}>
          {agent.bio}
        </Text>
        {agent.bio?.length > 200 && (
          <TouchableOpacity onPress={() => setBioExpanded(v => !v)} className="flex-row items-center gap-1 mt-2">
            <Text className="text-primary text-sm">{bioExpanded ? "Réduire" : "Lire plus"}</Text>
            {bioExpanded ? <ChevronUp size={14} color={Colors.primary} /> : <ChevronDown size={14} color={Colors.primary} />}
          </TouchableOpacity>
        )}
      </View>

      {/* Properties */}
      <View className="bg-white px-5 py-4 mb-6">
        <Text className="text-text-dark font-sans-semibold text-base mb-3">Biens de l'agent</Text>
        <View className="flex-row bg-background-alt rounded-xl p-1 mb-4">
          {(["sale", "rent"] as const).map(t => (
            <TouchableOpacity
              key={t}
              onPress={() => setPropTab(t)}
              className={`flex-1 py-2 rounded-lg items-center ${propTab === t ? "bg-white shadow-sm" : ""}`}
            >
              <Text className={`text-sm font-sans-medium ${propTab === t ? "text-primary" : "text-muted-fg"}`}>
                {t === "sale" ? "À vendre" : "À louer"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {properties.length === 0 ? (
          <Text className="text-muted-fg text-sm text-center py-4">Aucun bien disponible</Text>
        ) : (
          properties.map(p => <PropertyCard key={p.id} property={p} />)
        )}
      </View>
    </ScrollView>
  );
}
