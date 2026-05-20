import React from "react";
import { View, Text, ScrollView, TouchableOpacity, Linking } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { fetchAgencyById } from "../../src/services/agencies";
import { fetchAgents } from "../../src/services/agents";
import Loader from "../../src/components/ui/Loader";
import AgentCard from "../../src/components/agent/AgentCard";
import { Colors } from "../../src/constants/colors";
import { Phone, Mail, MapPin, Globe, CheckCircle } from "lucide-react-native";

export default function AgenceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

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

  return (
    <ScrollView style={{ flex: 1, backgroundColor: Colors.backgroundAlt }} showsVerticalScrollIndicator={false}>
      {/* Hero */}
      <View className="bg-navy px-5 pt-8 pb-8 items-center">
        <View className="w-20 h-20 rounded-2xl bg-secondary/20 items-center justify-center mb-3">
          <Text style={{ color: Colors.secondary, fontSize: 28, fontWeight: "700" }}>{agency.monogram}</Text>
        </View>
        <Text className="text-white text-xl font-sans-bold text-center">{agency.name}</Text>
        <Text className="text-white/70 text-sm mt-1 text-center">{agency.tagline}</Text>
      </View>

      {/* Stats */}
      <View className="bg-white px-5 py-4 mb-2">
        <View className="flex-row gap-2">
          {[
            { label: "Agents", value: agency.agentCount },
            { label: "Annonces", value: agency.listingCount },
            { label: "Deals", value: agency.closedDeals },
            { label: "Années", value: new Date().getFullYear() - agency.founded },
          ].map(({ label, value }) => (
            <View key={label} className="flex-1 items-center bg-background-alt rounded-xl py-3">
              <Text className="text-primary text-lg font-sans-bold">{value}</Text>
              <Text className="text-muted-fg text-xs mt-0.5 text-center">{label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* About */}
      <View className="bg-white px-5 py-4 mb-2">
        <Text className="text-text-dark font-sans-semibold text-base mb-2">À propos</Text>
        <Text className="text-muted-fg text-sm leading-6">{agency.description}</Text>
      </View>

      {/* Specializations */}
      {agency.specializations?.length > 0 && (
        <View className="bg-white px-5 py-4 mb-2">
          <Text className="text-text-dark font-sans-semibold text-base mb-3">Spécialisations</Text>
          <View className="flex-row flex-wrap gap-2">
            {agency.specializations.map((s, i) => (
              <View key={i} className="bg-accent rounded-full px-3 py-1.5">
                <Text className="text-primary text-xs font-sans-medium">{s}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Areas served */}
      {agency.areasServed?.length > 0 && (
        <View className="bg-white px-5 py-4 mb-2">
          <Text className="text-text-dark font-sans-semibold text-base mb-3">Zones desservies</Text>
          {agency.areasServed.map((area, i) => (
            <View key={i} className="flex-row items-center gap-2 py-1.5">
              <MapPin size={14} color={Colors.primary} />
              <Text className="text-text-dark text-sm">{area}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Team */}
      {agents.length > 0 && (
        <View className="bg-white px-5 py-4 mb-2">
          <Text className="text-text-dark font-sans-semibold text-base mb-3">Équipe</Text>
          {agents.map(a => <AgentCard key={a.id} agent={a} />)}
        </View>
      )}

      {/* Contact */}
      <View className="bg-white px-5 py-4 mb-2">
        <Text className="text-text-dark font-sans-semibold text-base mb-3">Contact</Text>
        {[
          { icon: MapPin, label: agency.address },
          { icon: Phone, label: agency.phone, onPress: () => Linking.openURL(`tel:${agency.phone}`) },
          { icon: Mail, label: agency.email, onPress: () => Linking.openURL(`mailto:${agency.email}`) },
          agency.website ? { icon: Globe, label: agency.website, onPress: () => Linking.openURL(agency.website!) } : null,
        ].filter(Boolean).map(({ icon: Icon, label, onPress }: any, i) => (
          <TouchableOpacity
            key={i}
            onPress={onPress}
            disabled={!onPress}
            className="flex-row items-center gap-3 py-2.5"
          >
            <Icon size={16} color={Colors.primary} />
            <Text className={`text-sm flex-1 ${onPress ? "text-primary" : "text-text-dark"}`}>{label}</Text>
          </TouchableOpacity>
        ))}
        <View className="flex-row flex-wrap gap-2 mt-2">
          {agency.languages?.map((l, i) => (
            <View key={i} className="bg-background-alt rounded-full px-3 py-1">
              <Text className="text-muted-fg text-xs">{l}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Certifications */}
      {agency.certifications?.length > 0 && (
        <View className="bg-white px-5 py-4 mb-6">
          <Text className="text-text-dark font-sans-semibold text-base mb-3">Certifications</Text>
          {agency.certifications.map((c, i) => (
            <View key={i} className="flex-row items-center gap-2 py-1.5">
              <CheckCircle size={14} color="#22c55e" />
              <Text className="text-text-dark text-sm">{c}</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
