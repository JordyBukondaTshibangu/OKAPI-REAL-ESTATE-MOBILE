import React, { useState, useRef } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  Modal, FlatList, Pressable, Animated,
  KeyboardAvoidingView, Platform,
} from "react-native";
import { ChevronDown, X, Search, Check } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "../../constants/colors";
import { useThemeStore } from "../../store/useThemeStore";

// ─── Country list ─────────────────────────────────────────────────────────────

export const COUNTRIES = [
  { code: "CD", name: "RD Congo",        dial: "+243", flag: "🇨🇩", priority: true  },
  { code: "CG", name: "Congo",           dial: "+242", flag: "🇨🇬", priority: true  },
  { code: "AO", name: "Angola",          dial: "+244", flag: "🇦🇴", priority: true  },
  { code: "ZM", name: "Zambie",          dial: "+260", flag: "🇿🇲", priority: true  },
  { code: "RW", name: "Rwanda",          dial: "+250", flag: "🇷🇼", priority: true  },
  { code: "UG", name: "Ouganda",         dial: "+256", flag: "🇺🇬", priority: true  },
  { code: "KE", name: "Kenya",           dial: "+254", flag: "🇰🇪", priority: true  },
  { code: "TZ", name: "Tanzanie",        dial: "+255", flag: "🇹🇿", priority: true  },
  { code: "NG", name: "Nigeria",         dial: "+234", flag: "🇳🇬", priority: true  },
  { code: "ZA", name: "Afrique du Sud",  dial: "+27",  flag: "🇿🇦", priority: true  },
  { code: "CM", name: "Cameroun",        dial: "+237", flag: "🇨🇲", priority: true  },
  { code: "CI", name: "Côte d'Ivoire",   dial: "+225", flag: "🇨🇮", priority: true  },
  { code: "SN", name: "Sénégal",         dial: "+221", flag: "🇸🇳", priority: true  },
  { code: "GH", name: "Ghana",           dial: "+233", flag: "🇬🇭", priority: true  },
  { code: "ET", name: "Éthiopie",        dial: "+251", flag: "🇪🇹", priority: true  },
  { code: "FR", name: "France",          dial: "+33",  flag: "🇫🇷", priority: false },
  { code: "BE", name: "Belgique",        dial: "+32",  flag: "🇧🇪", priority: false },
  { code: "US", name: "États-Unis",      dial: "+1",   flag: "🇺🇸", priority: false },
  { code: "GB", name: "Royaume-Uni",     dial: "+44",  flag: "🇬🇧", priority: false },
  { code: "CA", name: "Canada",          dial: "+1",   flag: "🇨🇦", priority: false },
] as const;

type Country = typeof COUNTRIES[number];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parsePhone(full: string): { country: Country; local: string } {
  const sorted = [...COUNTRIES].sort((a, b) => b.dial.length - a.dial.length);
  const match = sorted.find((c) => full.startsWith(c.dial));
  if (match) return { country: match, local: full.slice(match.dial.length) };
  return { country: COUNTRIES[0], local: full.startsWith("+") ? full.slice(4) : full };
}

// ─── Section-aware list item ───────────────────────────────────────────────────

type ListItem =
  | { type: "header"; title: string }
  | { type: "country"; country: Country };

// ─── Component ───────────────────────────────────────────────────────────────

interface PhoneInputProps {
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  error?: string;
  label?: string;
  locked?: boolean;
}

export default function PhoneInput({
  value, onChange, onBlur, error, label, locked = false,
}: PhoneInputProps) {
  const { theme } = useThemeStore();
  const isDark = theme === "dark";
  const insets = useSafeAreaInsets();

  const parsed = parsePhone(value ?? "");
  const [country, setCountry]         = useState<Country>(parsed.country);
  const [localNumber, setLocalNumber] = useState(parsed.local);
  const [showPicker, setShowPicker]   = useState(false);
  const [search, setSearch]           = useState("");
  const [focused, setFocused]         = useState(false);

  // Slide-up animation
  const slideAnim = useRef(new Animated.Value(0)).current;

  function openPicker() {
    if (locked) return;
    setShowPicker(true);
    Animated.spring(slideAnim, {
      toValue: 1, useNativeDriver: true, damping: 22, stiffness: 260,
    }).start();
  }

  function closePicker() {
    Animated.timing(slideAnim, {
      toValue: 0, duration: 220, useNativeDriver: true,
    }).start(() => { setShowPicker(false); setSearch(""); });
  }

  // ── colours ──────────────────────────────────────────────────────────────────
  const labelC  = isDark ? Colors.dark.foreground : Colors.foreground;
  const textC   = isDark ? Colors.dark.foreground : Colors.foreground;
  const bg      = isDark ? Colors.dark.backgroundAlt : Colors.background;
  const mutedC  = isDark ? Colors.dark.mutedFg : "#94a3b8";
  const borderC = error
    ? (isDark ? Colors.dark.destructive : Colors.destructive)
    : focused
      ? (isDark ? Colors.dark.primary : Colors.primary)
      : (isDark ? Colors.dark.border : Colors.border);
  const sheetBg = isDark ? Colors.dark.card : Colors.white;
  const rowHover = isDark ? Colors.dark.muted : "#F8FAFC";
  const sepC    = isDark ? Colors.dark.border : "#F1F5F9";
  const headerC = isDark ? Colors.dark.mutedFg : "#94a3b8";

  // ── handlers ─────────────────────────────────────────────────────────────────
  function handleNumberChange(text: string) {
    const digits = text.replace(/\D/g, "");
    setLocalNumber(digits);
    onChange(country.dial + digits);
  }

  function handleCountrySelect(c: Country) {
    setCountry(c);
    onChange(c.dial + localNumber);
    closePicker();
  }

  // ── build section list ───────────────────────────────────────────────────────
  const query = search.toLowerCase();
  const matchFn = (c: Country) =>
    c.name.toLowerCase().includes(query) || c.dial.includes(search);

  const priorityList  = COUNTRIES.filter((c) => c.priority && matchFn(c));
  const otherList     = COUNTRIES.filter((c) => !c.priority && matchFn(c));
  const showSections  = !search;

  const listData: ListItem[] = [];
  if (showSections) {
    if (priorityList.length) {
      listData.push({ type: "header", title: "Afrique" });
      priorityList.forEach((c) => listData.push({ type: "country", country: c }));
    }
    if (otherList.length) {
      listData.push({ type: "header", title: "International" });
      otherList.forEach((c) => listData.push({ type: "country", country: c }));
    }
  } else {
    [...priorityList, ...otherList].forEach((c) =>
      listData.push({ type: "country", country: c }),
    );
  }

  const sheetTranslate = slideAnim.interpolate({
    inputRange: [0, 1], outputRange: [600, 0],
  });

  return (
    <View style={{ marginBottom: 16 }}>
      {label && (
        <Text style={{ color: labelC, fontSize: 14, fontFamily: "DMSans_500Medium", marginBottom: 6 }}>
          {label}
        </Text>
      )}

      {/* Input row */}
      <View style={{
        flexDirection: "row", height: 48,
        borderWidth: 1.5, borderRadius: 12,
        borderColor: borderC, backgroundColor: bg,
        overflow: "hidden",
      }}>
        {/* Country picker trigger */}
        <TouchableOpacity
          onPress={openPicker}
          activeOpacity={locked ? 1 : 0.7}
          style={{
            flexDirection: "row", alignItems: "center",
            paddingHorizontal: 12, gap: 4,
            borderRightWidth: 1,
            borderRightColor: isDark ? Colors.dark.border : Colors.border,
          }}
        >
          <Text style={{ fontSize: 18 }}>{country.flag}</Text>
          <Text style={{ color: textC, fontSize: 13, fontFamily: "DMSans_600SemiBold" }}>
            {country.dial}
          </Text>
          {!locked && <ChevronDown size={13} color={mutedC} />}
        </TouchableOpacity>

        {/* Number input */}
        <TextInput
          value={localNumber}
          onChangeText={handleNumberChange}
          onBlur={() => { setFocused(false); onBlur?.(); }}
          onFocus={() => setFocused(true)}
          keyboardType="phone-pad"
          style={{
            flex: 1, paddingHorizontal: 12,
            fontSize: 14, fontFamily: "DMSans_400Regular", color: textC,
          }}
          placeholderTextColor={mutedC}
          placeholder="8xx xxx xxx"
        />
      </View>

      {error && (
        <Text style={{ color: isDark ? Colors.dark.destructive : Colors.destructive, fontSize: 12, marginTop: 4 }}>
          {error}
        </Text>
      )}

      {/* ── Bottom-sheet picker ──────────────────────────────────────────────── */}
      <Modal
        visible={showPicker}
        transparent
        animationType="none"
        onRequestClose={closePicker}
      >
        {/* Backdrop */}
        <Pressable
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.45)" }}
          onPress={closePicker}
        />

        {/* Sheet */}
        <Animated.View
          style={{
            position: "absolute", left: 0, right: 0, bottom: 0,
            transform: [{ translateY: sheetTranslate }],
            backgroundColor: sheetBg,
            borderTopLeftRadius: 24, borderTopRightRadius: 24,
            maxHeight: "82%",
            paddingBottom: insets.bottom,
            // shadow
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: isDark ? 0.4 : 0.1,
            shadowRadius: 16,
            elevation: 16,
          }}
        >
          {/* Handle */}
          <View style={{
            width: 36, height: 4,
            backgroundColor: isDark ? Colors.dark.muted : "#E2E8F0",
            borderRadius: 2, alignSelf: "center", marginTop: 10, marginBottom: 4,
          }} />

          {/* Header */}
          <View style={{
            flexDirection: "row", alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 20, paddingVertical: 14,
          }}>
            <Text style={{ color: textC, fontSize: 17, fontFamily: "DMSans_700Bold" }}>
              Code pays
            </Text>
            <TouchableOpacity
              onPress={closePicker}
              hitSlop={12}
              style={{
                width: 30, height: 30, borderRadius: 15,
                backgroundColor: isDark ? Colors.dark.muted : "#F1F5F9",
                alignItems: "center", justifyContent: "center",
              }}
            >
              <X size={15} color={mutedC} />
            </TouchableOpacity>
          </View>

          {/* Search */}
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            <View style={{
              flexDirection: "row", alignItems: "center", gap: 8,
              marginHorizontal: 16, marginBottom: 8,
              paddingHorizontal: 14, height: 44,
              backgroundColor: isDark ? Colors.dark.backgroundAlt : "#F8FAFC",
              borderRadius: 12,
              borderWidth: 1,
              borderColor: isDark ? Colors.dark.border : "#E2E8F0",
            }}>
              <Search size={15} color={mutedC} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Rechercher un pays…"
                placeholderTextColor={mutedC}
                style={{
                  flex: 1, fontSize: 14,
                  fontFamily: "DMSans_400Regular", color: textC,
                }}
                autoCorrect={false}
              />
              {search.length > 0 && (
                <TouchableOpacity onPress={() => setSearch("")} hitSlop={8}>
                  <X size={13} color={mutedC} />
                </TouchableOpacity>
              )}
            </View>

            {/* List */}
            <FlatList
              data={listData}
              keyExtractor={(item, i) =>
                item.type === "header" ? `h-${i}` : item.country.code
              }
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                if (item.type === "header") {
                  return (
                    <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 6 }}>
                      <Text style={{
                        color: headerC,
                        fontSize: 11, fontFamily: "DMSans_600SemiBold",
                        textTransform: "uppercase", letterSpacing: 0.8,
                      }}>
                        {item.title}
                      </Text>
                    </View>
                  );
                }

                const c = item.country;
                const isSelected = c.code === country.code;

                return (
                  <Pressable
                    onPress={() => handleCountrySelect(c)}
                    style={({ pressed }) => ({
                      flexDirection: "row",
                      alignItems: "center",
                      paddingHorizontal: 20,
                      paddingVertical: 13,
                      backgroundColor: pressed
                        ? rowHover
                        : isSelected
                          ? (isDark ? Colors.dark.accent : "#EFF6FF")
                          : "transparent",
                    })}
                  >
                    {/* Flag */}
                    <Text style={{ fontSize: 22, marginRight: 14, lineHeight: 30 }}>
                      {c.flag}
                    </Text>

                    {/* Name */}
                    <Text style={{
                      flex: 1,
                      color: isSelected
                        ? (isDark ? Colors.dark.primary : Colors.primary)
                        : textC,
                      fontSize: 15,
                      fontFamily: isSelected ? "DMSans_600SemiBold" : "DMSans_400Regular",
                    }}>
                      {c.name}
                    </Text>

                    {/* Dial code */}
                    <Text style={{
                      color: isSelected
                        ? (isDark ? Colors.dark.primary : Colors.primary)
                        : mutedC,
                      fontSize: 14,
                      fontFamily: "DMSans_500Medium",
                      marginRight: isSelected ? 10 : 0,
                    }}>
                      {c.dial}
                    </Text>

                    {/* Checkmark */}
                    {isSelected && (
                      <Check size={16} color={isDark ? Colors.dark.primary : Colors.primary} strokeWidth={2.5} />
                    )}
                  </Pressable>
                );
              }}
              ItemSeparatorComponent={({ leadingItem }) => {
                if (!leadingItem || leadingItem.type === "header") return null;
                return (
                  <View style={{ height: 1, backgroundColor: sepC, marginLeft: 56 }} />
                );
              }}
            />
          </KeyboardAvoidingView>
        </Animated.View>
      </Modal>
    </View>
  );
}
