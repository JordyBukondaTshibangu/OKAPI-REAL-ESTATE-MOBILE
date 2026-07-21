import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  Modal, FlatList, SafeAreaView, Pressable,
} from "react-native";
import { ChevronDown, X, Search } from "lucide-react-native";
import { Colors } from "../../constants/colors";
import { useThemeStore } from "../../store/useThemeStore";

// ─── Country list ─────────────────────────────────────────────────────────────

export const COUNTRIES = [
  { code: "CD", name: "RD Congo",        dial: "+243", flag: "🇨🇩" },
  { code: "CG", name: "Congo",           dial: "+242", flag: "🇨🇬" },
  { code: "AO", name: "Angola",          dial: "+244", flag: "🇦🇴" },
  { code: "ZM", name: "Zambie",          dial: "+260", flag: "🇿🇲" },
  { code: "RW", name: "Rwanda",          dial: "+250", flag: "🇷🇼" },
  { code: "UG", name: "Ouganda",         dial: "+256", flag: "🇺🇬" },
  { code: "KE", name: "Kenya",           dial: "+254", flag: "🇰🇪" },
  { code: "TZ", name: "Tanzanie",        dial: "+255", flag: "🇹🇿" },
  { code: "NG", name: "Nigeria",         dial: "+234", flag: "🇳🇬" },
  { code: "ZA", name: "Afrique du Sud",  dial: "+27",  flag: "🇿🇦" },
  { code: "CM", name: "Cameroun",        dial: "+237", flag: "🇨🇲" },
  { code: "CI", name: "Côte d'Ivoire",   dial: "+225", flag: "🇨🇮" },
  { code: "SN", name: "Sénégal",         dial: "+221", flag: "🇸🇳" },
  { code: "GH", name: "Ghana",           dial: "+233", flag: "🇬🇭" },
  { code: "ET", name: "Éthiopie",        dial: "+251", flag: "🇪🇹" },
  { code: "FR", name: "France",          dial: "+33",  flag: "🇫🇷" },
  { code: "BE", name: "Belgique",        dial: "+32",  flag: "🇧🇪" },
  { code: "US", name: "États-Unis",      dial: "+1",   flag: "🇺🇸" },
  { code: "GB", name: "Royaume-Uni",     dial: "+44",  flag: "🇬🇧" },
  { code: "CA", name: "Canada",          dial: "+1",   flag: "🇨🇦" },
] as const;

type Country = typeof COUNTRIES[number];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parsePhone(full: string): { country: Country; local: string } {
  // Sort by length descending so "+243" matches before "+24"
  const sorted = [...COUNTRIES].sort((a, b) => b.dial.length - a.dial.length);
  const match = sorted.find((c) => full.startsWith(c.dial));
  if (match) return { country: match, local: full.slice(match.dial.length) };
  return { country: COUNTRIES[0], local: full.startsWith("+") ? full.slice(4) : full };
}

// ─── Component ───────────────────────────────────────────────────────────────

interface PhoneInputProps {
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  error?: string;
  label?: string;
  /** When true, country cannot be changed (picker is disabled, chevron hidden) */
  locked?: boolean;
}

export default function PhoneInput({ value, onChange, onBlur, error, label, locked = false }: PhoneInputProps) {
  const { theme } = useThemeStore();
  const isDark = theme === "dark";

  const parsed = parsePhone(value ?? "");
  const [country, setCountry]       = useState<Country>(parsed.country);
  const [localNumber, setLocalNumber] = useState(parsed.local);
  const [showPicker, setShowPicker] = useState(false);
  const [search, setSearch]         = useState("");
  const [focused, setFocused]       = useState(false);

  // ── colours ─────────────────────────────────────────────────────────────────
  const labelC  = isDark ? Colors.dark.foreground : Colors.foreground;
  const textC   = isDark ? Colors.dark.foreground : Colors.foreground;
  const bg      = isDark ? Colors.dark.backgroundAlt : Colors.background;
  const mutedC  = isDark ? Colors.dark.mutedFg : "#94a3b8";
  const borderC = error
    ? (isDark ? Colors.dark.destructive : Colors.destructive)
    : focused
      ? (isDark ? Colors.dark.primary : Colors.primary)
      : (isDark ? Colors.dark.border : Colors.border);
  const modalBg = isDark ? Colors.dark.card : Colors.white;
  const itemBg  = isDark ? Colors.dark.background : Colors.backgroundAlt;

  // ── handlers ─────────────────────────────────────────────────────────────────
  function handleNumberChange(text: string) {
    const digits = text.replace(/\D/g, "");
    setLocalNumber(digits);
    onChange(country.dial + digits);
  }

  function handleCountrySelect(c: Country) {
    setCountry(c);
    setShowPicker(false);
    setSearch("");
    onChange(c.dial + localNumber);
  }

  const filtered = COUNTRIES.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.dial.includes(search),
  );

  return (
    <View style={{ marginBottom: 16 }}>
      {label && (
        <Text style={{ color: labelC, fontSize: 14, fontFamily: "DMSans_500Medium", marginBottom: 6 }}>
          {label}
        </Text>
      )}

      {/* Input row */}
      <View style={{
        flexDirection: "row",
        height: 48,
        borderWidth: 1.5,
        borderRadius: 12,
        borderColor: borderC,
        backgroundColor: bg,
        overflow: "hidden",
      }}>
        {/* Country picker trigger */}
        <TouchableOpacity
          onPress={() => !locked && setShowPicker(true)}
          activeOpacity={locked ? 1 : 0.7}
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 12,
            gap: 4,
            borderRightWidth: 1,
            borderRightColor: isDark ? Colors.dark.border : Colors.border,
          }}
        >
          <Text style={{ fontSize: 18 }}>{country.flag}</Text>
          <Text style={{ color: textC, fontSize: 13, fontFamily: "DMSans_500Medium" }}>
            {country.dial}
          </Text>
          {!locked && <ChevronDown size={14} color={mutedC} />}
        </TouchableOpacity>

        {/* Number input */}
        <TextInput
          value={localNumber}
          onChangeText={handleNumberChange}
          onBlur={() => { setFocused(false); onBlur?.(); }}
          onFocus={() => setFocused(true)}
          keyboardType="phone-pad"
          style={{
            flex: 1,
            paddingHorizontal: 12,
            fontSize: 14,
            fontFamily: "DMSans_400Regular",
            color: textC,
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

      {/* Country picker modal */}
      <Modal visible={showPicker} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={{ flex: 1, backgroundColor: modalBg }}>
          {/* Header */}
          <View style={{
            flexDirection: "row", alignItems: "center", justifyContent: "space-between",
            paddingHorizontal: 20, paddingVertical: 16,
            borderBottomWidth: 1, borderBottomColor: isDark ? Colors.dark.border : Colors.border,
          }}>
            <Text style={{ color: textC, fontSize: 16, fontFamily: "DMSans_700Bold" }}>
              Indicatif pays
            </Text>
            <TouchableOpacity onPress={() => { setShowPicker(false); setSearch(""); }}>
              <X size={22} color={mutedC} />
            </TouchableOpacity>
          </View>

          {/* Search */}
          <View style={{
            flexDirection: "row", alignItems: "center", gap: 10,
            margin: 16, paddingHorizontal: 14,
            backgroundColor: itemBg, borderRadius: 12,
            borderWidth: 1, borderColor: isDark ? Colors.dark.border : Colors.border,
          }}>
            <Search size={16} color={mutedC} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Rechercher un pays…"
              placeholderTextColor={mutedC}
              style={{ flex: 1, height: 44, fontSize: 14, fontFamily: "DMSans_400Regular", color: textC }}
            />
          </View>

          {/* List */}
          <FlatList
            data={filtered}
            keyExtractor={(c) => c.code}
            renderItem={({ item: c }) => (
              <Pressable
                onPress={() => handleCountrySelect(c)}
                style={({ pressed }) => ({
                  flexDirection: "row", alignItems: "center", gap: 14,
                  paddingHorizontal: 20, paddingVertical: 14,
                  backgroundColor: pressed
                    ? (isDark ? Colors.dark.muted : "#f1f5f9")
                    : (c.code === country.code ? (isDark ? Colors.dark.accent : "#EFF6FF") : "transparent"),
                  borderBottomWidth: 1,
                  borderBottomColor: isDark ? Colors.dark.border : Colors.border,
                })}
              >
                <Text style={{ fontSize: 22 }}>{c.flag}</Text>
                <Text style={{ flex: 1, color: textC, fontSize: 14, fontFamily: "DMSans_500Medium" }}>
                  {c.name}
                </Text>
                <Text style={{ color: mutedC, fontSize: 13, fontFamily: "DMSans_400Regular" }}>
                  {c.dial}
                </Text>
              </Pressable>
            )}
          />
        </SafeAreaView>
      </Modal>
    </View>
  );
}
