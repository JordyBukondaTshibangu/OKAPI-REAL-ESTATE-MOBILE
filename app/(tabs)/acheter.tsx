import React, { useState, useCallback, useEffect, useRef } from "react";
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { fetchProperties } from "../../src/services/properties";
import PropertyCard from "../../src/components/property/PropertyCard";
import { useFavouriteIds } from "../../src/hooks/useFavouriteIds";
import PropertyFilters, { type Filters } from "../../src/components/property/PropertyFilters";
import SearchBar from "../../src/components/property/SearchBar";
import Loader from "../../src/components/ui/Loader";
import EmptyState from "../../src/components/ui/EmptyState";
import { Colors } from "../../src/constants/colors";
import { useDebounce } from "../../src/hooks/useDebounce";
import { useThemeStore } from "../../src/store/useThemeStore";
import { useAgentSessionStore } from "../../src/store/useAgentSessionStore";
import { useT } from "../../src/i18n/useT";
import { Home } from "lucide-react-native";
import type { Property } from "../../src/types/property";

type ListingTypeFilter = "all" | "sale" | "rent" | "mine";

export default function AcheterScreen() {
  const t = useT();
  const { theme } = useThemeStore();
  const isDark = theme === "dark";
  const { isAuthenticated: isAgentLoggedIn, agent: agentSession } = useAgentSessionStore();
  const favouriteIds = useFavouriteIds();

  const params = useLocalSearchParams<{ category?: string; suburb?: string; listingType?: string; duration?: "short" | "long" | "both" }>();
  const [search, setSearch] = useState("");
  const [listingType, setListingType] = useState<ListingTypeFilter>(
    (params.listingType as ListingTypeFilter) ?? "all"
  );
  const [filters, setFilters] = useState<Filters>({
    category: params.category,
    suburb: params.suburb,
    rentalDuration: params.duration,
  });
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 400);

  // Accumulated list of all properties loaded across pages.
  const [allProperties, setAllProperties] = useState<Property[]>([]);
  // Track the "reset key" so we know when to clear accumulated data.
  const resetKeyRef = useRef(0);

  // The (tabs) navigator keeps this screen mounted, so re-navigating here
  // (e.g. tapping a neighborhood on the landing page) only updates the
  // route params - it doesn't remount the component or re-run useState's
  // initializer. Sync the filters whenever the incoming params change.
  useEffect(() => {
    if (params.listingType) setListingType(params.listingType as ListingTypeFilter);
    setFilters({ category: params.category, suburb: params.suburb, rentalDuration: params.duration });
    resetKeyRef.current += 1;
    setAllProperties([]);
    setPage(1);
  }, [params.category, params.suburb, params.listingType, params.duration]);

  // Reset pagination whenever the search text changes (keep old results visible
  // while the new query loads — data effect below replaces them once ready).
  useEffect(() => {
    resetKeyRef.current += 1;
    setPage(1);
  }, [debouncedSearch]);

  const handleFiltersChange = useCallback((f: Filters) => {
    setFilters(f);
    resetKeyRef.current += 1;
    // Don't clear allProperties here — keep previous results visible while the
    // new query is in flight; the data effect below replaces them once ready.
    setPage(1);
  }, []);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["properties", listingType, filters, debouncedSearch, page, agentSession?.id],
    queryFn: () => fetchProperties({
      ...(listingType === "mine"
        ? { agentId: agentSession?.id }
        : listingType !== "all"
        ? { listingType }
        : {}),
      ...filters,
      search: debouncedSearch || undefined,
      page,
      limit: 10,
    }),
  });

  // Append newly fetched page to the accumulated list.
  useEffect(() => {
    if (!data?.data) return;
    if (page === 1) {
      setAllProperties(data.data);
    } else {
      setAllProperties((prev) => [...prev, ...data.data]);
    }
  }, [data]);

  const meta = data?.meta ?? {};
  const hasMore = page < (meta.totalPages ?? 1);
  const totalCount = meta.total ?? allProperties.length;

  const bgColor = isDark ? Colors.dark.background : Colors.backgroundAlt;
  const cardBg = isDark ? Colors.dark.card : Colors.white;
  const borderColor = isDark ? Colors.dark.border : Colors.border;
  const primary = isDark ? Colors.dark.primary : Colors.primary;
  const textMain = isDark ? Colors.dark.foreground : Colors.foreground;
  const textMuted = isDark ? Colors.dark.mutedFg : Colors.mutedFg;

  // Derive screen title for agents from the active listing type filter
  const agentTitle =
    listingType === "sale" ? t.listing.buyTitle :
    listingType === "rent" ? t.listing.rentTitle :
    listingType === "mine" ? t.listing.typeMine :
    t.nav.agentBrowse;

  const TYPE_TABS: { key: ListingTypeFilter; label: string }[] = [
    { key: "all",  label: t.listing.typeAll },
    { key: "sale", label: t.listing.typeSale },
    { key: "rent", label: t.listing.typeRent },
    ...(isAgentLoggedIn ? [{ key: "mine" as ListingTypeFilter, label: t.listing.typeMine }] : []),
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bgColor }} edges={["top"]}>
      <View style={{ backgroundColor: cardBg, borderBottomColor: borderColor, borderBottomWidth: 1, paddingHorizontal: 20, paddingTop: 18, paddingBottom: 14 }}>
        <Text style={{ color: textMain, fontSize: 22, fontFamily: "DMSans_700Bold" }}>
          {isAgentLoggedIn ? agentTitle : t.listing.buyTitle}
        </Text>
        {data && (
          <Text style={{ color: textMuted, fontSize: 12, marginTop: 2 }}>
            {totalCount} {t.listing.results}
          </Text>
        )}
        {/* Listing type toggle — all users */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }} contentContainerStyle={{ gap: 8 }}>
          {TYPE_TABS.map(({ key, label }) => {
            const active = listingType === key;
            const isMine = key === "mine";
            return (
              <TouchableOpacity
                key={key}
                onPress={() => { setListingType(key); setPage(1); setAllProperties([]); resetKeyRef.current += 1; }}
                style={{
                  paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20,
                  backgroundColor: active
                    ? (isMine ? Colors.secondary : primary)
                    : (isDark ? Colors.dark.muted : Colors.backgroundAlt),
                  borderWidth: 1,
                  borderColor: active ? (isMine ? Colors.secondary : primary) : borderColor,
                }}
              >
                <Text style={{
                  fontSize: 13, fontFamily: "DMSans_600SemiBold",
                  color: active ? (isMine ? Colors.navy : "#fff") : textMuted,
                }}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
      <View style={{ paddingTop: 12 }}>
        <SearchBar value={search} onChangeText={setSearch} />
      </View>
      <PropertyFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        showDuration={listingType === "rent" || listingType === "all"}
      />
      {allProperties.length === 0 && !isFetching && !isLoading ? (
        <EmptyState
          title={t.listing.noResults}
          subtitle={t.listing.adjustFilters}
          icon={Home}
        />
      ) : allProperties.length === 0 && (isFetching || isLoading) ? (
        <Loader />
      ) : (
        <FlatList
          data={allProperties}
          keyExtractor={(p) => p.id}
          renderItem={({ item }) => <PropertyCard property={item} isFavourite={favouriteIds.has(item.id)} />}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
          onEndReachedThreshold={0.3}
          onEndReached={() => { if (hasMore && !isFetching) setPage((p) => p + 1); }}
          ListFooterComponent={
            isFetching ? (
              <ActivityIndicator
                color={isDark ? Colors.dark.primary : Colors.primary}
                style={{ marginVertical: 16 }}
              />
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}
