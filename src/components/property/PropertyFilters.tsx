import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Modal, TextInput } from "react-native";
import { ChevronDown, X } from "lucide-react-native";
import { Colors } from "../../constants/colors";
import Button from "../ui/Button";

export type Filters = {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  suburb?: string;
};

interface PropertyFiltersProps {
  filters: Filters;
  onFiltersChange: (f: Filters) => void;
}

const CATEGORIES = [
  { value: "apartment", label: "Appartement" },
  { value: "villa", label: "Villa" },
  { value: "studio", label: "Studio" },
  { value: "townhouse", label: "Maison de ville" },
  { value: "duplex", label: "Duplex" },
  { value: "penthouse", label: "Penthouse" },
  { value: "land", label: "Terrain" },
  { value: "office", label: "Bureau" },
];

const PRICE_RANGES = [
  { label: "< 100 000 $", min: 0, max: 100000 },
  { label: "100 000 – 300 000 $", min: 100000, max: 300000 },
  { label: "300 000 – 600 000 $", min: 300000, max: 600000 },
  { label: "> 600 000 $", min: 600000, max: undefined },
];

const BEDROOMS = [1, 2, 3, 4, 5];

type ActiveModal = "type" | "price" | "bedrooms" | "suburb" | null;

export default function PropertyFilters({ filters, onFiltersChange }: PropertyFiltersProps) {
  const [modal, setModal] = useState<ActiveModal>(null);
  const [suburbInput, setSuburbInput] = useState(filters.suburb ?? "");

  function clearFilter(key: keyof Filters) {
    const next = { ...filters };
    delete next[key];
    if (key === "minPrice") delete next.maxPrice;
    onFiltersChange(next);
  }

  const activeCount = [
    filters.category,
    filters.minPrice !== undefined || filters.maxPrice !== undefined ? true : undefined,
    filters.bedrooms,
    filters.suburb,
  ].filter(Boolean).length;

  return (
    <>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0 }}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingVertical: 8, alignItems: "center" }}
      >
        {/* Clear all */}
        {activeCount > 0 && (
          <TouchableOpacity
            onPress={() => onFiltersChange({})}
            className="flex-row items-center gap-1.5 border border-destructive rounded-full px-3.5"
            style={{ height: 36, backgroundColor: "#FEF2F2" }}
            activeOpacity={0.7}
          >
            <X size={14} color={Colors.destructive} />
            <Text className="text-destructive text-sm font-sans-medium">Effacer</Text>
          </TouchableOpacity>
        )}

        <FilterChip
          label={filters.category ? CATEGORIES.find(c => c.value === filters.category)?.label ?? "Type" : "Type"}
          active={!!filters.category}
          onPress={() => setModal("type")}
          onClear={filters.category ? () => clearFilter("category") : undefined}
        />
        <FilterChip
          label={filters.minPrice !== undefined ? `${filters.minPrice / 1000}k – ${filters.maxPrice ? filters.maxPrice / 1000 + "k" : "+"} $` : "Prix"}
          active={filters.minPrice !== undefined}
          onPress={() => setModal("price")}
          onClear={filters.minPrice !== undefined ? () => clearFilter("minPrice") : undefined}
        />
        <FilterChip
          label={filters.bedrooms ? `${filters.bedrooms} ch.` : "Chambres"}
          active={!!filters.bedrooms}
          onPress={() => setModal("bedrooms")}
          onClear={filters.bedrooms ? () => clearFilter("bedrooms") : undefined}
        />
        <FilterChip
          label={filters.suburb ?? "Quartier"}
          active={!!filters.suburb}
          onPress={() => setModal("suburb")}
          onClear={filters.suburb ? () => clearFilter("suburb") : undefined}
        />
      </ScrollView>

      {/* Type modal */}
      <FilterModal visible={modal === "type"} title="Type de bien" onClose={() => setModal(null)}>
        {CATEGORIES.map(c => (
          <TouchableOpacity
            key={c.value}
            onPress={() => { onFiltersChange({ ...filters, category: c.value }); setModal(null); }}
            className={`py-3 px-4 rounded-xl mb-2 ${filters.category === c.value ? "bg-accent border border-primary" : "bg-background-alt"}`}
          >
            <Text className={filters.category === c.value ? "text-primary font-sans-semibold" : "text-text-dark"}>{c.label}</Text>
          </TouchableOpacity>
        ))}
      </FilterModal>

      {/* Price modal */}
      <FilterModal visible={modal === "price"} title="Fourchette de prix" onClose={() => setModal(null)}>
        {PRICE_RANGES.map((r, i) => {
          const active = filters.minPrice === r.min;
          return (
            <TouchableOpacity
              key={i}
              onPress={() => { onFiltersChange({ ...filters, minPrice: r.min, maxPrice: r.max }); setModal(null); }}
              className={`py-3 px-4 rounded-xl mb-2 ${active ? "bg-accent border border-primary" : "bg-background-alt"}`}
            >
              <Text className={active ? "text-primary font-sans-semibold" : "text-text-dark"}>{r.label}</Text>
            </TouchableOpacity>
          );
        })}
      </FilterModal>

      {/* Bedrooms modal */}
      <FilterModal visible={modal === "bedrooms"} title="Nombre de chambres" onClose={() => setModal(null)}>
        <View className="flex-row flex-wrap gap-3">
          {BEDROOMS.map(n => (
            <TouchableOpacity
              key={n}
              onPress={() => { onFiltersChange({ ...filters, bedrooms: n }); setModal(null); }}
              className={`w-14 h-14 rounded-2xl items-center justify-center border ${filters.bedrooms === n ? "bg-primary border-primary" : "bg-background-alt border-border"}`}
            >
              <Text className={filters.bedrooms === n ? "text-white font-sans-bold text-lg" : "text-text-dark text-lg"}>{n}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            onPress={() => { onFiltersChange({ ...filters, bedrooms: 6 }); setModal(null); }}
            className={`w-14 h-14 rounded-2xl items-center justify-center border ${filters.bedrooms === 6 ? "bg-primary border-primary" : "bg-background-alt border-border"}`}
          >
            <Text className={filters.bedrooms === 6 ? "text-white font-sans-bold" : "text-text-dark"}>6+</Text>
          </TouchableOpacity>
        </View>
      </FilterModal>

      {/* Suburb modal */}
      <FilterModal
        visible={modal === "suburb"}
        title="Quartier / commune"
        onClose={() => setModal(null)}
        action={{ label: "Appliquer", onPress: () => { onFiltersChange({ ...filters, suburb: suburbInput || undefined }); setModal(null); } }}
      >
        <TextInput
          value={suburbInput}
          onChangeText={setSuburbInput}
          placeholder="Ex: Gombe, Ngaliema…"
          placeholderTextColor="#94a3b8"
          className="border border-border rounded-xl px-4 py-3 text-text-dark"
          autoFocus
        />
      </FilterModal>
    </>
  );
}

function FilterChip({ label, active, onPress, onClear }: { label: string; active: boolean; onPress: () => void; onClear?: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className={`flex-row items-center gap-1.5 px-3.5 rounded-full border ${active ? "bg-accent border-primary" : "bg-white border-border"}`}
      style={{ height: 36 }}
      activeOpacity={0.7}
    >
      <Text className={`text-sm ${active ? "text-primary font-sans-medium" : "text-text-dark"}`} numberOfLines={1}>{label}</Text>
      {active && onClear ? (
        <TouchableOpacity onPress={onClear} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <X size={13} color={Colors.primary} />
        </TouchableOpacity>
      ) : (
        <ChevronDown size={14} color={active ? Colors.primary : Colors.mutedFg} />
      )}
    </TouchableOpacity>
  );
}

function FilterModal({ visible, title, onClose, children, action }: {
  visible: boolean; title: string; onClose: () => void;
  children: React.ReactNode; action?: { label: string; onPress: () => void };
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)" }} activeOpacity={1} onPress={onClose} />
      <View className="bg-white rounded-t-3xl px-5 pt-5 pb-8" style={{ position: "absolute", bottom: 0, left: 0, right: 0 }}>
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-text-dark text-lg font-sans-semibold">{title}</Text>
          <TouchableOpacity onPress={onClose}>
            <X size={22} color={Colors.mutedFg} />
          </TouchableOpacity>
        </View>
        {children}
        {action && (
          <Button onPress={action.onPress} className="mt-4">{action.label}</Button>
        )}
      </View>
    </Modal>
  );
}
