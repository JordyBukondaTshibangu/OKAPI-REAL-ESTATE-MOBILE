import React, { useState } from "react";
import { FlatList, RefreshControl, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { Users } from "lucide-react-native";
import AgencyCard from "../../src/components/agent/AgencyCard";
import SearchBar from "../../src/components/property/SearchBar";
import EmptyState from "../../src/components/ui/EmptyState";
import Loader from "../../src/components/ui/Loader";
import { Colors } from "../../src/constants/colors";
import { useDebounce } from "../../src/hooks/useDebounce";
import { useThemeStore } from "../../src/store/useThemeStore";
import { fetchAgencies } from "../../src/services/agencies";
import { useT } from "../../src/i18n/useT";

export default function AgencesScreen() {
  const t = useT();
  const { theme } = useThemeStore();
  const isDark = theme === "dark";

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);

  const bgColor = isDark ? Colors.dark.background : Colors.backgroundAlt;
  const cardBg = isDark ? Colors.dark.card : Colors.white;
  const borderColor = isDark ? Colors.dark.border : Colors.border;
  const textMain = isDark ? Colors.dark.foreground : Colors.textDark;
  const primaryColor = isDark ? Colors.dark.primary : Colors.primary;

  const {
    data: agenciesData,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["agencies", debouncedSearch],
    queryFn: () => fetchAgencies({ name: debouncedSearch || undefined }),
  });

  const agencies = agenciesData?.data ?? [];

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: bgColor }}
      edges={["bottom"]}
    >
      <View
        style={{
          backgroundColor: cardBg,
          borderBottomColor: borderColor,
          borderBottomWidth: 1,
          paddingHorizontal: 20,
          paddingTop: 12,
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
          {t.agency.agenciesTitle}
        </Text>
      </View>

      <SearchBar
        value={search}
        onChangeText={setSearch}
        placeholder={t.agency.searchPlaceholder}
      />

      {isLoading ? (
        <Loader />
      ) : agencies.length === 0 ? (
        <EmptyState title={t.agency.notFound} icon={Users} />
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
