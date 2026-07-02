import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ViewStyle,
} from "react-native";
import { ChevronDown, X, Check } from "lucide-react-native";
import { Colors } from "../../constants/colors";
import { useThemeStore } from "../../store/useThemeStore";
import { useT } from "../../i18n/useT";
import Button from "../ui/Button";

export type Filters = {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  suburb?: string;
  rentalDuration?: "short" | "long" | "both";
  minNightPrice?: number;
  maxNightPrice?: number;
  minStay?: number;
  maxStay?: number;
};

interface PropertyFiltersProps {
  filters: Filters;
  onFiltersChange: (f: Filters) => void;
  /** Set to false to hide the rental duration chip (e.g. on buy listings). Default true. */
  showDuration?: boolean;
}

const PRICE_RANGES = [
  { label: "< 100 000 $", min: 0, max: 100000 },
  { label: "100 000 – 300 000 $", min: 100000, max: 300000 },
  { label: "300 000 – 600 000 $", min: 300000, max: 600000 },
  { label: "> 600 000 $", min: 600000, max: undefined },
];

const BEDROOMS = [1, 2, 3, 4, 5];

type ActiveModal = "type" | "price" | "bedrooms" | "suburb" | "duration" | null;
type LocalDuration = "all" | "short" | "long" | "both";

export default function PropertyFilters({
  filters,
  onFiltersChange,
  showDuration = true,
}: PropertyFiltersProps) {
  const { theme } = useThemeStore();
  const isDark = theme === "dark";
  const t = useT();
  const [modal, setModal] = useState<ActiveModal>(null);
  const [suburbInput, setSuburbInput] = useState(filters.suburb ?? "");

  // Local state for duration modal
  const [localDuration, setLocalDuration] = useState<LocalDuration>(
    filters.rentalDuration ?? "all",
  );
  const [localMinNight, setLocalMinNight] = useState(
    filters.minNightPrice != null ? String(filters.minNightPrice) : "",
  );
  const [localMaxNight, setLocalMaxNight] = useState(
    filters.maxNightPrice != null ? String(filters.maxNightPrice) : "",
  );
  const [localMinStay, setLocalMinStay] = useState(
    filters.minStay != null ? String(filters.minStay) : "",
  );
  const [localMaxStay, setLocalMaxStay] = useState(
    filters.maxStay != null ? String(filters.maxStay) : "",
  );

  const borderC = isDark ? Colors.dark.border : Colors.border;
  const textMain = isDark ? Colors.dark.foreground : Colors.textDark;
  const textMuted = isDark ? Colors.dark.mutedFg : Colors.mutedFg;
  const altBg = isDark ? Colors.dark.muted : Colors.backgroundAlt;
  const accentBg = isDark ? Colors.dark.accent : Colors.accent;
  const primaryColor = isDark ? Colors.dark.primary : Colors.primary;

  const CATEGORIES = [
    { value: "apartment", label: t.onboarding.apartment },
    { value: "villa", label: t.onboarding.villa },
    { value: "studio", label: t.onboarding.studio },
    { value: "townhouse", label: t.onboarding.townhouse },
    { value: "duplex", label: t.onboarding.duplex },
    { value: "penthouse", label: t.onboarding.penthouse },
    { value: "land", label: t.onboarding.land },
    { value: "office", label: t.onboarding.office },
  ];

  const DURATION_OPTIONS: { value: LocalDuration; label: string }[] = [
    { value: "all", label: t.listing.filters.durationAll },
    { value: "long", label: t.listing.filters.durationLongOnly },
    { value: "short", label: t.listing.filters.durationShortOnly },
    { value: "both", label: t.listing.filters.durationBoth },
  ];

  function clearFilter(key: keyof Filters) {
    const next = { ...filters };
    delete next[key];
    if (key === "minPrice") delete next.maxPrice;
    if (key === "rentalDuration") {
      delete next.minNightPrice;
      delete next.maxNightPrice;
      delete next.minStay;
      delete next.maxStay;
    }
    onFiltersChange(next);
  }

  function openDurationModal() {
    setLocalDuration(filters.rentalDuration ?? "all");
    setLocalMinNight(
      filters.minNightPrice != null ? String(filters.minNightPrice) : "",
    );
    setLocalMaxNight(
      filters.maxNightPrice != null ? String(filters.maxNightPrice) : "",
    );
    setLocalMinStay(filters.minStay != null ? String(filters.minStay) : "");
    setLocalMaxStay(filters.maxStay != null ? String(filters.maxStay) : "");
    setModal("duration");
  }

  function applyDuration() {
    const next: Filters = { ...filters };
    if (localDuration === "all") {
      delete next.rentalDuration;
      delete next.minNightPrice;
      delete next.maxNightPrice;
      delete next.minStay;
      delete next.maxStay;
    } else {
      next.rentalDuration = localDuration;
      if (localDuration === "short" || localDuration === "both") {
        next.minNightPrice = localMinNight ? Number(localMinNight) : undefined;
        next.maxNightPrice = localMaxNight ? Number(localMaxNight) : undefined;
        next.minStay = localMinStay ? Number(localMinStay) : undefined;
        next.maxStay = localMaxStay ? Number(localMaxStay) : undefined;
      } else {
        delete next.minNightPrice;
        delete next.maxNightPrice;
        delete next.minStay;
        delete next.maxStay;
      }
    }
    onFiltersChange(next);
    setModal(null);
  }

  const durationPillLabel =
    filters.rentalDuration === "long"
      ? t.listing.filters.durationLongPill
      : filters.rentalDuration === "short"
        ? t.listing.filters.durationShortPill
        : filters.rentalDuration === "both"
          ? t.listing.filters.durationBothPill
          : t.listing.filters.duration;

  const showShortFields = localDuration === "short" || localDuration === "both";

  const activeCount = [
    filters.category,
    filters.minPrice !== undefined || filters.maxPrice !== undefined
      ? true
      : undefined,
    filters.bedrooms,
    filters.suburb,
    filters.rentalDuration,
  ].filter(Boolean).length;

  const inputStyle: ViewStyle & {
    color: string;
    fontFamily: string;
    fontSize: number;
  } = {
    flex: 1,
    borderWidth: 1.5,
    borderColor: borderC,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: textMain,
    backgroundColor: altBg,
    fontFamily: "DMSans_400Regular",
    fontSize: 14,
  };

  return (
    <>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0 }}
        contentContainerStyle={{
          paddingHorizontal: 16,
          gap: 8,
          paddingVertical: 8,
          alignItems: "center",
        }}
      >
        {/* Clear all */}
        {activeCount > 0 && (
          <TouchableOpacity
            onPress={() => onFiltersChange({})}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              borderWidth: 1,
              borderColor: Colors.destructive,
              borderRadius: 20,
              paddingHorizontal: 14,
              height: 36,
              backgroundColor: isDark ? "rgba(224,85,85,0.12)" : "#FEF2F2",
            }}
            activeOpacity={0.7}
          >
            <X
              size={14}
              color={isDark ? Colors.dark.destructive : Colors.destructive}
            />
            <Text
              style={{
                color: isDark ? Colors.dark.destructive : Colors.destructive,
                fontSize: 14,
                fontFamily: "DMSans_500Medium",
              }}
            >
              {t.listing.filters.clear}
            </Text>
          </TouchableOpacity>
        )}

        <FilterChip
          label={
            filters.category
              ? (CATEGORIES.find((c) => c.value === filters.category)?.label ??
                t.listing.filters.type)
              : t.listing.filters.type
          }
          active={!!filters.category}
          isDark={isDark}
          onPress={() => setModal("type")}
          onClear={filters.category ? () => clearFilter("category") : undefined}
        />
        {showDuration && (
          <FilterChip
            label={durationPillLabel}
            active={!!filters.rentalDuration}
            isDark={isDark}
            onPress={openDurationModal}
            onClear={
              filters.rentalDuration
                ? () => clearFilter("rentalDuration")
                : undefined
            }
          />
        )}
        <FilterChip
          label={
            filters.minPrice !== undefined
              ? `${filters.minPrice / 1000}k – ${filters.maxPrice ? filters.maxPrice / 1000 + "k" : "+"} $`
              : t.listing.filters.price
          }
          active={filters.minPrice !== undefined}
          isDark={isDark}
          onPress={() => setModal("price")}
          onClear={
            filters.minPrice !== undefined
              ? () => clearFilter("minPrice")
              : undefined
          }
        />
        <FilterChip
          label={
            filters.bedrooms
              ? `${filters.bedrooms} ${t.property.bedsBadge}`
              : t.listing.filters.bedrooms
          }
          active={!!filters.bedrooms}
          isDark={isDark}
          onPress={() => setModal("bedrooms")}
          onClear={filters.bedrooms ? () => clearFilter("bedrooms") : undefined}
        />
        <FilterChip
          label={filters.suburb ?? t.listing.filters.neighborhood}
          active={!!filters.suburb}
          isDark={isDark}
          onPress={() => setModal("suburb")}
          onClear={filters.suburb ? () => clearFilter("suburb") : undefined}
        />
      </ScrollView>

      {/* Type modal */}
      <FilterModal
        visible={modal === "type"}
        title={t.listing.filters.type}
        onClose={() => setModal(null)}
        isDark={isDark}
      >
        {CATEGORIES.map((c) => (
          <TouchableOpacity
            key={c.value}
            onPress={() => {
              onFiltersChange({ ...filters, category: c.value });
              setModal(null);
            }}
            style={{
              paddingVertical: 12,
              paddingHorizontal: 16,
              borderRadius: 12,
              marginBottom: 8,
              backgroundColor: filters.category === c.value ? accentBg : altBg,
              borderWidth: filters.category === c.value ? 1 : 0,
              borderColor:
                filters.category === c.value ? primaryColor : "transparent",
            }}
          >
            <Text
              style={{
                color: filters.category === c.value ? primaryColor : textMain,
                fontFamily:
                  filters.category === c.value
                    ? "DMSans_600SemiBold"
                    : "DMSans_400Regular",
              }}
            >
              {c.label}
            </Text>
          </TouchableOpacity>
        ))}
      </FilterModal>

      {/* Duration modal */}
      <FilterModal
        visible={modal === "duration"}
        title={t.listing.filters.duration}
        onClose={() => setModal(null)}
        isDark={isDark}
        action={{ label: t.listing.filters.apply, onPress: applyDuration }}
      >
        {/* Duration type options */}
        {DURATION_OPTIONS.map((opt) => {
          const isActive = localDuration === opt.value;
          return (
            <TouchableOpacity
              key={opt.value}
              onPress={() => setLocalDuration(opt.value)}
              style={{
                paddingVertical: 12,
                paddingHorizontal: 16,
                borderRadius: 12,
                marginBottom: 8,
                backgroundColor: isActive ? accentBg : altBg,
                borderWidth: isActive ? 1 : 0,
                borderColor: isActive ? primaryColor : "transparent",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Text
                style={{
                  color: isActive ? primaryColor : textMain,
                  fontFamily: isActive
                    ? "DMSans_600SemiBold"
                    : "DMSans_400Regular",
                }}
              >
                {opt.label}
              </Text>
              {isActive && <Check size={16} color={primaryColor} />}
            </TouchableOpacity>
          );
        })}

        {/* Short-term extra fields: shown when short or both is selected */}
        {showShortFields && (
          <View style={{ marginTop: 8 }}>
            <Text
              style={{
                color: textMuted,
                fontSize: 12,
                fontFamily: "DMSans_500Medium",
                marginBottom: 8,
                marginTop: 4,
              }}
            >
              {t.listing.filters.nightPrice}
            </Text>
            <View style={{ flexDirection: "row", gap: 10, marginBottom: 12 }}>
              <TextInput
                value={localMinNight}
                onChangeText={setLocalMinNight}
                placeholder="Min"
                placeholderTextColor={textMuted}
                keyboardType="numeric"
                style={inputStyle}
              />
              <TextInput
                value={localMaxNight}
                onChangeText={setLocalMaxNight}
                placeholder="Max"
                placeholderTextColor={textMuted}
                keyboardType="numeric"
                style={inputStyle}
              />
            </View>
            <Text
              style={{
                color: textMuted,
                fontSize: 12,
                fontFamily: "DMSans_500Medium",
                marginBottom: 8,
              }}
            >
              {t.listing.filters.stayDuration}
            </Text>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <TextInput
                value={localMinStay}
                onChangeText={setLocalMinStay}
                placeholder="Min"
                placeholderTextColor={textMuted}
                keyboardType="numeric"
                style={inputStyle}
              />
              <TextInput
                value={localMaxStay}
                onChangeText={setLocalMaxStay}
                placeholder="Max"
                placeholderTextColor={textMuted}
                keyboardType="numeric"
                style={inputStyle}
              />
            </View>
          </View>
        )}
      </FilterModal>

      {/* Price modal */}
      <FilterModal
        visible={modal === "price"}
        title={t.listing.filters.priceRange}
        onClose={() => setModal(null)}
        isDark={isDark}
      >
        {PRICE_RANGES.map((r, i) => {
          const active = filters.minPrice === r.min;
          return (
            <TouchableOpacity
              key={i}
              onPress={() => {
                onFiltersChange({
                  ...filters,
                  minPrice: r.min,
                  maxPrice: r.max,
                });
                setModal(null);
              }}
              style={{
                paddingVertical: 12,
                paddingHorizontal: 16,
                borderRadius: 12,
                marginBottom: 8,
                backgroundColor: active ? accentBg : altBg,
                borderWidth: active ? 1 : 0,
                borderColor: active ? primaryColor : "transparent",
              }}
            >
              <Text
                style={{
                  color: active ? primaryColor : textMain,
                  fontFamily: active
                    ? "DMSans_600SemiBold"
                    : "DMSans_400Regular",
                }}
              >
                {r.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </FilterModal>

      {/* Bedrooms modal */}
      <FilterModal
        visible={modal === "bedrooms"}
        title={t.listing.filters.bedroomsTitle}
        onClose={() => setModal(null)}
        isDark={isDark}
      >
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
          {[...BEDROOMS, 6].map((n) => {
            const isActive = filters.bedrooms === n;
            return (
              <TouchableOpacity
                key={n}
                onPress={() => {
                  onFiltersChange({ ...filters, bedrooms: n });
                  setModal(null);
                }}
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 16,
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 1.5,
                  backgroundColor: isActive ? primaryColor : altBg,
                  borderColor: isActive ? primaryColor : borderC,
                }}
              >
                <Text
                  style={{
                    color: isActive ? "#fff" : textMain,
                    fontSize: 18,
                    fontFamily: isActive
                      ? "DMSans_700Bold"
                      : "DMSans_400Regular",
                  }}
                >
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
        title={t.listing.filters.neighborhoodTitle}
        onClose={() => setModal(null)}
        isDark={isDark}
        action={{
          label: t.listing.filters.apply,
          onPress: () => {
            onFiltersChange({ ...filters, suburb: suburbInput || undefined });
            setModal(null);
          },
        }}
      >
        <TextInput
          value={suburbInput}
          onChangeText={setSuburbInput}
          placeholder={t.listing.filters.neighborhoodPlaceholder}
          placeholderTextColor={textMuted}
          style={inputStyle}
          autoFocus
        />
      </FilterModal>
    </>
  );
}

function FilterChip({
  label,
  active,
  isDark,
  onPress,
  onClear,
}: {
  label: string;
  active: boolean;
  isDark: boolean;
  onPress: () => void;
  onClear?: () => void;
}) {
  const bg = active
    ? isDark
      ? Colors.dark.accent
      : Colors.accent
    : isDark
      ? Colors.dark.card
      : Colors.white;
  const borderColor = active
    ? isDark
      ? Colors.dark.primary
      : Colors.primary
    : isDark
      ? Colors.dark.border
      : Colors.border;
  const labelColor = active
    ? isDark
      ? Colors.dark.primary
      : Colors.primary
    : isDark
      ? Colors.dark.foreground
      : Colors.textDark;
  const chevronColor = active
    ? isDark
      ? Colors.dark.primary
      : Colors.primary
    : isDark
      ? Colors.dark.mutedFg
      : Colors.mutedFg;

  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: 14,
        borderRadius: 20,
        borderWidth: 1.5,
        height: 36,
        backgroundColor: bg,
        borderColor,
      }}
      activeOpacity={0.7}
    >
      <Text
        style={{
          fontSize: 13,
          color: labelColor,
          fontFamily: active ? "DMSans_500Medium" : "DMSans_400Regular",
        }}
        numberOfLines={1}
      >
        {label}
      </Text>
      {active && onClear ? (
        <TouchableOpacity
          onPress={onClear}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <X size={13} color={isDark ? Colors.dark.primary : Colors.primary} />
        </TouchableOpacity>
      ) : (
        <ChevronDown size={14} color={chevronColor} />
      )}
    </TouchableOpacity>
  );
}

function FilterModal({
  visible,
  title,
  onClose,
  children,
  action,
  isDark,
}: {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  action?: { label: string; onPress: () => void };
  isDark: boolean;
}) {
  const bg = isDark ? Colors.dark.card : Colors.white;
  const textMain = isDark ? Colors.dark.foreground : Colors.textDark;
  const textMuted = isDark ? Colors.dark.mutedFg : Colors.mutedFg;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)" }}
        activeOpacity={1}
        onPress={onClose}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ position: "absolute", bottom: 0, left: 0, right: 0 }}
      >
        <View
          style={{
            backgroundColor: bg,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingHorizontal: 20,
            paddingTop: 20,
            paddingBottom: 32,
          }}
        >
          {/* Handle */}
          <View
            style={{
              width: 36,
              height: 4,
              borderRadius: 2,
              backgroundColor: isDark ? Colors.dark.border : Colors.border,
              alignSelf: "center",
              marginBottom: 16,
            }}
          />
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 16,
            }}
          >
            <Text
              style={{
                color: textMain,
                fontSize: 17,
                fontFamily: "DMSans_700Bold",
              }}
            >
              {title}
            </Text>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
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
