import React, { useState, useCallback } from "react";
import { View, Text, FlatList, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { fetchProperties } from "../../src/services/properties";
import PropertyCard from "../../src/components/property/PropertyCard";
import PropertyFilters, { type Filters } from "../../src/components/property/PropertyFilters";
import SearchBar from "../../src/components/property/SearchBar";
import Loader from "../../src/components/ui/Loader";
import EmptyState from "../../src/components/ui/EmptyState";
import { Colors } from "../../src/constants/colors";
import { useDebounce } from "../../src/hooks/useDebounce";
import { Home } from "lucide-react-native";

export default function AcheterScreen() {
  const params = useLocalSearchParams<{ category?: string; suburb?: string }>();
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Filters>({
    category: params.category,
    suburb: params.suburb,
  });
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 400);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["properties", "sale", filters, debouncedSearch, page],
    queryFn: () => fetchProperties({
      listingType: "sale",
      ...filters,
      page,
      limit: 10,
    }),
  });

  const properties = data?.data ?? [];
  const meta = data?.meta ?? {};
  const hasMore = page < (meta.totalPages ?? 1);

  const handleFiltersChange = useCallback((f: Filters) => {
    setFilters(f);
    setPage(1);
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.backgroundAlt }} edges={["top"]}>
      <View className="px-5 py-4 bg-white border-b border-border">
        <Text className="text-text-dark text-xl font-sans-bold">Biens à acheter</Text>
        {data && <Text className="text-muted-fg text-xs mt-0.5">{properties.length} résultats</Text>}
      </View>
      <SearchBar value={search} onChangeText={setSearch} />
      <PropertyFilters filters={filters} onFiltersChange={handleFiltersChange} />
      {isLoading ? (
        <Loader />
      ) : properties.length === 0 ? (
        <EmptyState
          title="Aucun bien trouvé"
          subtitle="Essayez de modifier vos filtres."
          icon={Home}
        />
      ) : (
        <FlatList
          data={properties}
          keyExtractor={p => p.id}
          renderItem={({ item }) => <PropertyCard property={item} />}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
          onEndReachedThreshold={0.3}
          onEndReached={() => { if (hasMore && !isFetching) setPage(p => p + 1); }}
          ListFooterComponent={isFetching ? <ActivityIndicator color={Colors.primary} style={{ marginVertical: 16 }} /> : null}
        />
      )}
    </SafeAreaView>
  );
}
