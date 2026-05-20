import { useQuery } from "@tanstack/react-query";
import { Users } from "lucide-react-native";
import React, { useState } from "react";
import {
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AgencyCard from "../../src/components/agent/AgencyCard";
import AgentCard from "../../src/components/agent/AgentCard";
import SearchBar from "../../src/components/property/SearchBar";
import EmptyState from "../../src/components/ui/EmptyState";
import Loader from "../../src/components/ui/Loader";
import { Colors } from "../../src/constants/colors";
import { useDebounce } from "../../src/hooks/useDebounce";
import { fetchAgencies } from "../../src/services/agencies";
import { fetchAgents } from "../../src/services/agents";

type Tab = "agents" | "agences";

export default function AgentsScreen() {
  const [tab, setTab] = useState<Tab>("agents");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);

  const {
    data: agentsData,
    isLoading: agentsLoading,
    refetch: refetchAgents,
    isRefetching: isRefetchingAgents,
  } = useQuery({
    queryKey: ["agents", debouncedSearch],
    queryFn: () => fetchAgents({ name: debouncedSearch || undefined }),
    enabled: tab === "agents",
  });

  const {
    data: agenciesData,
    isLoading: agenciesLoading,
    refetch: refetchAgencies,
    isRefetching: isRefetchingAgencies,
  } = useQuery({
    queryKey: ["agencies", debouncedSearch],
    queryFn: () => fetchAgencies({ name: debouncedSearch || undefined }),
    enabled: tab === "agences",
  });

  const agents = agentsData?.data ?? [];
  const agencies = agenciesData?.data ?? [];
  const isLoading = tab === "agents" ? agentsLoading : agenciesLoading;
  const isRefreshing =
    tab === "agents" ? isRefetchingAgents : isRefetchingAgencies;

  function handleRefresh() {
    tab === "agents" ? refetchAgents() : refetchAgencies();
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: Colors.backgroundAlt }}
      edges={["top"]}
    >
      <View className="px-5 py-4 bg-white border-b border-border">
        <Text className="text-text-dark text-xl font-sans-bold mb-3">
          Agents & Agences
        </Text>
        {/* Segmented control */}
        <View className="flex-row bg-background-alt rounded-xl p-1">
          {(["agents", "agences"] as Tab[]).map((t) => (
            <TouchableOpacity
              key={t}
              onPress={() => {
                setTab(t);
                setSearch("");
              }}
              className={
                tab === t
                  ? "flex-1 py-2 rounded-lg items-center bg-white shadow-sm"
                  : "flex-1 py-2 rounded-lg items-center"
              }
            >
              <Text
                className={
                  tab === t
                    ? "text-sm font-sans-medium text-primary"
                    : "text-sm font-sans-medium text-muted-fg"
                }
              >
                {t === "agents" ? "Agents" : "Agences"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <SearchBar
        value={search}
        onChangeText={setSearch}
        placeholder={
          tab === "agents" ? "Rechercher un agent" : "Rechercher une agence"
        }
      />

      {isLoading ? (
        <Loader />
      ) : tab === "agents" ? (
        agents.length === 0 ? (
          <EmptyState title="Aucun agent trouvé" icon={Users} />
        ) : (
          <FlatList
            data={agents}
            keyExtractor={(a) => a.id}
            renderItem={({ item }) => <AgentCard agent={item} />}
            contentContainerStyle={{
              paddingHorizontal: 16,
              paddingTop: 8,
              paddingBottom: 32,
            }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                tintColor={Colors.primary}
              />
            }
          />
        )
      ) : agencies.length === 0 ? (
        <EmptyState title="Aucune agence trouvée" icon={Users} />
      ) : (
        <FlatList
          data={agencies}
          keyExtractor={(a) => a.id}
          renderItem={({ item }) => <AgencyCard agency={item} />}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 8,
            paddingBottom: 32,
          }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={Colors.primary}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}
