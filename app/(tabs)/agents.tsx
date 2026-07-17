import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { Building2, ChevronRight, Users } from "lucide-react-native";
import React, { useState } from "react";
import {
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import EspaceAgentScreen from "../espace-agent/index";
import AgentCard from "../../src/components/agent/AgentCard";
import SearchBar from "../../src/components/property/SearchBar";
import EmptyState from "../../src/components/ui/EmptyState";
import Loader from "../../src/components/ui/Loader";
import { Colors } from "../../src/constants/colors";
import { useDebounce } from "../../src/hooks/useDebounce";
import { useThemeStore } from "../../src/store/useThemeStore";
import { useAgentSessionStore } from "../../src/store/useAgentSessionStore";
import { useT } from "../../src/i18n/useT";
import { fetchAgents } from "../../src/services/agents";

export default function AgentsScreen() {
  const t = useT();
  const { theme } = useThemeStore();
  const isDark = theme === "dark";
  const { isAuthenticated: isAgentLoggedIn } = useAgentSessionStore();

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);

  const bgColor = isDark ? Colors.dark.background : Colors.backgroundAlt;
  const cardBg = isDark ? Colors.dark.card : Colors.white;
  const borderColor = isDark ? Colors.dark.border : Colors.border;
  const textMain = isDark ? Colors.dark.foreground : Colors.textDark;
  const textMuted = isDark ? Colors.dark.mutedFg : Colors.mutedFg;
  const primaryColor = isDark ? Colors.dark.primary : Colors.primary;

  const {
    data: agentsData,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["agents", debouncedSearch],
    queryFn: () => fetchAgents({ name: debouncedSearch || undefined }),
  });

  const agents = agentsData?.data ?? [];

  // Agents pressing the Boosts tab see their dashboard inline (keeps the tab bar).
  if (isAgentLoggedIn) return <EspaceAgentScreen showBackButton={false} />;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bgColor }} edges={["top"]}>
      {/* Header */}
      <View
        style={{
          backgroundColor: cardBg,
          borderBottomColor: borderColor,
          borderBottomWidth: 1,
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 16,
          marginBottom: 16,
        }}
      >
        <Text
          style={{
            color: textMain,
            fontSize: 20,
            fontFamily: "DMSans_700Bold",
            marginBottom: 12,
          }}
        >
          {t.nav.agents}
        </Text>

        {/* Agences shortcut card */}
        <TouchableOpacity
          onPress={() => router.push("/agences" as any)}
          activeOpacity={0.85}
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: isDark ? Colors.dark.muted : Colors.backgroundAlt,
            borderRadius: 14,
            paddingVertical: 12,
            paddingHorizontal: 14,
            borderWidth: 1,
            borderColor,
            gap: 12,
          }}
        >
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              backgroundColor: isDark ? "rgba(255,255,255,0.08)" : Colors.white,
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor,
            }}
          >
            <Building2 size={18} color={primaryColor} />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                color: textMain,
                fontFamily: "DMSans_600SemiBold",
                fontSize: 14,
              }}
            >
              {t.agent.agencies}
            </Text>
            <Text style={{ color: textMuted, fontSize: 12, marginTop: 1 }}>
              {t.agent.discoverAgencies}
            </Text>
          </View>
          <ChevronRight size={18} color={textMuted} />
        </TouchableOpacity>
      </View>

      <SearchBar
        value={search}
        onChangeText={setSearch}
        placeholder={t.agent.searchPlaceholder}
      />

      {isLoading ? (
        <Loader />
      ) : agents.length === 0 ? (
        <EmptyState title={t.agent.notFound} icon={Users} />
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
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={primaryColor}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}
