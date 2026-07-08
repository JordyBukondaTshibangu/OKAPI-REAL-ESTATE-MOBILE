import React, { useState, useCallback, useEffect, useRef } from "react";
import { View, Text, FlatList, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { fetchProperties } from "../../src/services/properties";
import PropertyCard from "../../src/components/property/PropertyCard";
import { useFavouriteIds } from "../../src/hooks/useFavouriteIds";
import PropertyFilters, { type Filters } from "../../src/components/property/PropertyFilters";
import type { PropertyParams } from "../../src/services/properties";
import SearchBar from "../../src/components/property/SearchBar";
import Loader from "../../src/components/ui/Loader";
import EmptyState from "../../src/components/ui/EmptyState";
import { Colors } from "../../src/constants/colors";
import { useDebounce } from "../../src/hooks/useDebounce";
import { useThemeStore } from "../../src/store/useThemeStore";
import { useT } from "../../src/i18n/useT";
import { Key } from "lucide-react-native";
import type { Property } from "../../src/types/property";
import { useOnboardingStore } from "../../src/store/useOnboardingStore";

export default function LouerScreen() {
  const t = useT();
  const { theme } = useThemeStore();
  const isDark = theme === "dark";
  const favouriteIds = useFavouriteIds();
  // The stay-duration preference collected in onboarding (if any) - used to
  // pre-select the duration filter the first time the user lands here
  // without an explicit `duration` param (e.g. tapping the Rent tab).
  const onboardingStayDuration = useOnboardingStore((s) => s.stayDuration);

  const params = useLocalSearchParams<{ category?: string; suburb?: string; duration?: "short" | "long" | "both" }>();
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Filters>({
    category: params.category,
    suburb: params.suburb,
    rentalDuration: params.duration ?? onboardingStayDuration ?? undefined,
  });
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 400);

  // Accumulated list of all properties loaded across pages.
  const [allProperties, setAllProperties] = useState<Property[]>([]);
  const resetKeyRef = useRef(0);

  // Same reasoning as acheter.tsx: the (tabs) navigator keeps this screen
  // mounted, so navigating here with new params doesn't remount it.
  useEffect(() => {
    setFilters((prev) => ({
      category: params.category,
      suburb: params.suburb,
      // Only an explicit `duration` param overrides whatever the user
      // already picked in the filter sheet; otherwise keep it as-is.
      rentalDuration: params.duration ?? prev.rentalDuration,
    }));
    resetKeyRef.current += 1;
    setAllProperties([]);
    setPage(1);
  }, [params.category, params.suburb, params.duration]);

  // Reset pagination whenever the search text changes (but keep old results visible
  // while the new query loads — only clear once data arrives).
  useEffect(() => {
    resetKeyRef.current += 1;
    setPage(1);
  }, [debouncedSearch]);

  const handleFiltersChange = useCallback((f: Filters) => {
    setFilters(f);
    resetKeyRef.current += 1;
    // Don't clear allProperties here — keep the previous results visible while
    // the new query is in flight; the data effect below replaces them once ready.
    setPage(1);
  }, []);

  // Convert UI rentalDuration enum → backend boolean params the API understands.
  function toApiParams(f: Filters): Omit<PropertyParams, "listingType"> {
    const { rentalDuration, ...rest } = f;
    const extra: Pick<PropertyParams, "isShortTerm" | "isLongTerm"> = {};
    if (rentalDuration === "short") { extra.isShortTerm = true; }
    else if (rentalDuration === "long") { extra.isLongTerm = true; }
    else if (rentalDuration === "both") { extra.isShortTerm = true; extra.isLongTerm = true; }
    return { ...rest, ...extra };
  }

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["properties", "rent", filters, debouncedSearch, page],
    queryFn: () => fetchProperties({ listingType: "rent", ...toApiParams(filters), search: debouncedSearch || undefined, page, limit: 10 }),
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
          {t.listing.rentTitle}
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
      <PropertyFilters filters={filters} onFiltersChange={handleFiltersChange} />
      {allProperties.length === 0 && !isFetching ? (
        <EmptyState
          title={t.listing.noResults}
          subtitle={t.listing.adjustFilters}
          icon={Key}
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
