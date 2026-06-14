import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Modal, TextInput, KeyboardAvoidingView, Platform } from "react-native";
import { ChevronDown, X } from "lucide-react-native";
import { Colors } from "../../constants/colors";
import { useThemeStore } from "../../store/useThemeStore";
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
  const { theme } = useThemeStore();
  const isDark = theme === "dark";
  const [modal, setModal] = useState<ActiveModal>(null);
  const [suburbInput, setSuburbInput] = useState(filters.suburb ?? "");

  const bg = isDark ? Colors.dark.card : Colors.white;
  const borderC = isDark ? Colors.dark.border : Colors.border;
  const textMain = isDark ? Colors.dark.foreground : Colors.textDark;
  const textMuted = isDark ? Colors.dark.mutedFg : Colors.mutedFg;
  const altBg = isDark ? Colors.dark.muted : Colors.backgroundAlt;
  const accentBg = isDark ? Colors.dark.accent : Colors.accent;

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
            style={{
              flexDirection: "row", alignItems: "center", gap: 6,
              borderWidth: 1, borderColor: Colors.destructive,
              borderRadius: 20, paddingHorizontal: 14, height: 36,
              backgroundColor: isDark ? "rgba(224,85,85,0.12)" : "#FEF2F2",
            }}
            activeOpacity={0.7}
          >
            <X size={14} color={isDark ? Colors.dark.destructive : Colors.destructive} />
            <Text style={{ color: isDark ? Colors.dark.destructive : Colors.destructive, fontSize: 14, fontFamily: "DMSans_500Medium" }}>
              Effacer
            </Text>
          </TouchableOpacity>
        )}

        <FilterChip
          label={filters.category ? CATEGORIES.find(c => c.value === filters.category)?.label ?? "Type" : "Type"}
          active={!!filters.category}
          isDark={isDark}
          onPress={() => setModal("type")}
          onClear={filters.category ? () => clearFilter("category") : undefined}
        />
        <FilterChip
          label={filters.minPrice !== undefined ? `${filters.minPrice / 1000}k – ${filters.maxPrice ? filters.maxPrice / 1000 + "k" : "+"} $` : "Prix"}
          active={filters.minPrice !== undefined}
          isDark={isDark}
          onPress={() => setModal("price")}
          onClear={filters.minPrice !== undefined ? () => clearFilter("minPrice") : undefined}
        />
        <FilterChip
          label={filters.bedrooms ? `${filters.bedrooms} ch.` : "Chambres"}
          active={!!filters.bedrooms}
          isDark={isDark}
          onPress={() => setModal("bedrooms")}
          onClear={filters.bedrooms ? () => clearFilter("bedrooms") : undefined}
        />
        <FilterChip
          label={filters.suburb ?? "Quartier"}
          active={!!filters.suburb}
          isDark={isDark}
          onPress={() => setModal("suburb")}
          onClear={filters.suburb ? () => clearFilter("suburb") : undefined}
        />
      </ScrollView>

      {/* Type modal */}
      <FilterModal visible={modal === "type"} title="Type de bien" onClose={() => setModal(null)} isDark={isDark}>
        {CATEGORIES.map(c => (
          <TouchableOpacity
            key={c.value}
            onPress={() => { onFiltersChange({ ...filters, category: c.value }); setModal(null); }}
            style={{
              paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, marginBottom: 8,
              backgroundColor: filters.category === c.value ? accentBg : altBg,
              borderWidth: filters.category === c.value ? 1 : 0,
              borderColor: filters.category === c.value ? (isDark ? Colors.dark.primary : Colors.primary) : "transparent",
            }}
          >
            <Text style={{
              color: filters.category === c.value ? (isDark ? Colors.dark.primary : Colors.primary) : textMain,
              fontFamily: filters.category === c.value ? "DMSans_600SemiBold" : "DMSans_400Regular",
            }}>
              {c.label}
            </Text>
          </TouchableOpacity>
        ))}
      </FilterModal>

      {/* Price modal */}
      <FilterModal visible={modal === "price"} title="Fourchette de prix" onClose={() => setModal(null)} isDark={isDark}>
        {PRICE_RANGES.map((r, i) => {
          const active = filters.minPrice === r.min;
          return (
            <TouchableOpacity
              key={i}
              onPress={() => { onFiltersChange({ ...filters, minPrice: r.min, maxPrice: r.max }); setModal(null); }}
              style={{
                paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, marginBottom: 8,
                backgroundColor: active ? accentBg : altBg,
                borderWidth: active ? 1 : 0,
                borderColor: active ? (isDark ? Colors.dark.primary : Colors.primary) : "transparent",
              }}
            >
              <Text style={{
                color: active ? (isDark ? Colors.dark.primary : Colors.primary) : textMain,
                fontFamily: active ? "DMSans_600SemiBold" : "DMSans_400Regular",
              }}>
                {r.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </FilterModal>

      {/* Bedrooms modal */}
      <FilterModal visible={modal === "bedrooms"} title="Nombre de chambres" onClose={() => setModal(null)} isDark={isDark}>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
          {[...BEDROOMS, 6].map((n, idx) => {
            const isActive = filters.bedrooms === n;
            return (
              <TouchableOpacity
                key={n}
                onPress={() => { onFiltersChange({ ...filters, bedrooms: n }); setModal(null); }}
                style={{
                  width: 56, height: 56, borderRadius: 16, alignItems: "center", justifyContent: "center",
                  borderWidth: 1.5,
                  backgroundColor: isActive ? (isDark ? Colors.dark.primary : Colors.primary) : altBg,
                  borderColor: isActive ? (isDark ? Colors.dark.primary : Colors.primary) : borderC,
                }}
              >
                <Text style={{
                  color: isActive ? "#fff" : textMain,
                  fontSize: 18,
                  fontFamily: isActive ? "DMSans_700Bold" : "DMSans_400Regular",
                }}>
                  {n === 6 ? "6+" : n}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </FilterModal>

      {/* Suburb modal */}
      <FilterModal
        visible={modal === "suburb"}
        title="Quartier / commune"
        onClose={() => setModal(null)}
        isDark={isDark}
        action={{ label: "Appliquer", onPress: () => { onFiltersChange({ ...filters, suburb: suburbInput || undefined }); setModal(null); } }}
      >
        <TextInput
          value={suburbInput}
          onChangeText={setSuburbInput}
          placeholder="Ex: Gombe, Ngaliema…"
          placeholderTextColor={textMuted}
          style={{
            borderWidth: 1.5, borderColor: borderC, borderRadius: 12,
            paddingHorizontal: 16, paddingVertical: 12,
            color: textMain,
            backgroundColor: altBg,
            fontFamily: "DMSans_400Regular",
            fontSize: 14,
          }}
          autoFocus
        />
      </FilterModal>
    </>
  );
}

function FilterChip({ label, active, isDark, onPress, onClear }: {
  label: string; active: boolean; isDark: boolean; onPress: () => void; onClear?: () => void;
}) {
  const bg = active
    ? (isDark ? Colors.dark.accent : Colors.accent)
    : (isDark ? Colors.dark.card : Colors.white);
  const borderColor = active
    ? (isDark ? Colors.dark.primary : Colors.primary)
    : (isDark ? Colors.dark.border : Colors.border);
  const labelColor = active
    ? (isDark ? Colors.dark.primary : Colors.primary)
    : (isDark ? Colors.dark.foreground : Colors.textDark);

  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flexDirection: "row", alignItems: "center", gap: 6,
        paddingHorizontal: 14, borderRadius: 20, borderWidth: 1.5,
        height: 36, backgroundColor: bg, borderColor,
      }}
      activeOpacity={0.7}
    >
      <Text style={{ fontSize: 13, color: labelColor, fontFamily: active ? "DMSans_500Medium" : "DMSans_400Regular" }} numberOfLines={1}>
        {label}
      </Text>
      {active && onClear ? (
        <TouchableOpacity onPress={onClear} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <X size={13} color={isDark ? Colors.dark.primary : Colors.primary} />
        </TouchableOpacity>
      ) : (
        <ChevronDown size={14} color={active ? (isDark ? Colors.dark.primary : Colors.primary) : (isDark ? Colors.dark.mutedFg : Colors.mutedFg)} />
      )}
    </TouchableOpacity>
  );
}

function FilterModal({ visible, title, onClose, children, action, isDark }: {
  visible: boolean; title: string; onClose: () => void;
  children: React.ReactNode; action?: { label: string; onPress: () => void };
  isDark: boolean;
}) {
  const bg = isDark ? Colors.dark.card : Colors.white;
  const textMain = isDark ? Colors.dark.foreground : Colors.textDark;
  const textMuted = isDark ? Colors.dark.mutedFg : Colors.mutedFg;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)" }} activeOpacity={1} onPress={onClose} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ position: "absolute", bottom: 0, left: 0, right: 0 }}
      >
        <View style={{
          backgroundColor: bg, borderTopLeftRadius: 24, borderTopRightRadius: 24,
          paddingHorizontal: 20, paddingTop: 20, paddingBottom: 32,
        }}>
          {/* Handle */}
          <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: isDark ? Colors.dark.border : Colors.border, alignSelf: "center", marginBottom: 16 }} />
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <Text style={{ color: textMain, fontSize: 17, fontFamily: "DMSans_700Bold" }}>{title}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X size={22} color={textMuted} />
            </TouchableOpacity>
          </View>
          {children}
          {action && (
            <View style={{ marginTop: 16 }}>
              <Button onPress={action.onPress}>{action.label}</Button>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
