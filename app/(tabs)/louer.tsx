import React, { useState, useCallback, useEffect } from "react";
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
import { Key } from "lucide-react-native";

export default function LouerScreen() {
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

  // Same reasoning as acheter.tsx: the (tabs) navigator keeps this screen
  // mounted, so navigating here with new params doesn't remount it.
  useEffect(() => {
    setFilters({ category: params.category, suburb: params.suburb });
    setPage(1);
  }, [params.category, params.suburb]);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["properties", "rent", filters, debouncedSearch, page],
    queryFn: () => fetchProperties({ listingType: "rent", ...filters, page, limit: 10 }),
  });

  const properties = data?.data ?? [];
  const meta = data?.meta ?? {};
  const hasMore = page < (meta.totalPages ?? 1);

  const handleFiltersChange = useCallback((f: Filters) => {
    setFilters(f);
    setPage(1);
  }, []);

  const bgColor = isDark ? Colors.dark.background : Colors.backgroundAlt;
  const cardBg = isDark ? Colors.dark.card : Colors.white;
  const borderColor = isDark ? Colors.dark.border : Colors.border;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bgColor }} edges={["top"]}>
      <View style={{ backgroundColor: cardBg, borderBottomColor: borderColor, borderBottomWidth: 1, paddingHorizontal: 20, paddingTop: 18, paddingBottom: 14 }}>
        <Text style={{ color: isDark ? Colors.dark.foreground : Colors.foreground, fontSize: 22, fontFamily: "DMSans_700Bold" }}>
          {t.listing.rentTitle}
        </Text>
        {data && (
          <Text style={{ color: isDark ? Colors.dark.mutedFg : Colors.mutedFg, fontSize: 12, marginTop: 2 }}>
            {properties.length} {t.listing.results}
          </Text>
        )}
      </View>
      <View style={{ paddingTop: 12 }}>
        <SearchBar value={search} onChangeText={setSearch} />
      </View>
      <PropertyFilters filters={filters} onFiltersChange={handleFiltersChange} />
      {isLoading ? (
        <Loader />
      ) : properties.length === 0 ? (
        <EmptyState
          title={t.listing.noResults}
          subtitle={t.listing.adjustFilters}
          icon={Key}
        />
      ) : (
        <FlatList
          data={properties}
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
