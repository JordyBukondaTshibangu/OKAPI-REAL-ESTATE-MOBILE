import React, { useState, useCallback, useEffect, useRef } from "react";
import { View, Text, FlatList, ActivityIndicator } from "react-native";
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
import { useT } from "../../src/i18n/useT";
import { Home } from "lucide-react-native";
import type { Property } from "../../src/types/property";

export default function AcheterScreen() {
  const t = useT();
  const { theme } = useThemeStore();
  const isDark = theme === "dark";
  const favouriteIds = useFavouriteIds();

  const params = useLocalSearchParams<{ category?: string; suburb?: string }>();
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Filters>({
    category: params.category,
    suburb: params.suburb,
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
    setFilters({ category: params.category, suburb: params.suburb });
    resetKeyRef.current += 1;
    setAllProperties([]);
    setPage(1);
  }, [params.category, params.suburb]);

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
    queryKey: ["properties", "sale", filters, debouncedSearch, page],
    queryFn: () => fetchProperties({ listingType: "sale", ...filters, search: debouncedSearch || undefined, page, limit: 10 }),
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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bgColor }} edges={["top"]}>
      <View style={{ backgroundColor: cardBg, borderBottomColor: borderColor, borderBottomWidth: 1, paddingHorizontal: 20, paddingTop: 18, paddingBottom: 14 }}>
        <Text style={{ color: isDark ? Colors.dark.foreground : Colors.foreground, fontSize: 22, fontFamily: "DMSans_700Bold" }}>
          {t.listing.buyTitle}
        </Text>
        {data && (
          <Text style={{ color: isDark ? Colors.dark.mutedFg : Colors.mutedFg, fontSize: 12, marginTop: 2 }}>
            {totalCount} {t.listing.results}
          </Text>
        )}
      </View>
      <View style={{ paddingTop: 12 }}>
        <SearchBar value={search} onChangeText={setSearch} />
      </View>
      <PropertyFilters filters={filters} onFiltersChange={handleFiltersChange} showDuration={false} />
      {allProperties.length === 0 && !isFetching ? (
        <EmptyState
          title={t.listing.noResults}
          subtitle={t.listing.adjustFilters}
          icon={Home}
        />
      ) : allProperties.length === 0 && isFetching ? (
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
