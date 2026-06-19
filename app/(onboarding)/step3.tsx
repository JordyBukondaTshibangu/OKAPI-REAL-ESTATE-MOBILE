import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Search, X, ChevronLeft, MapPin, TrendingUp } from "lucide-react-native";
import { useOnboardingStore } from "../../src/store/useOnboardingStore";
import { Colors } from "../../src/constants/colors";
import { useT } from "../../src/i18n/useT";

const POPULAR_AREAS = [
  "Gombe", "Limete", "Ngaliema", "Kintambo", "Barumbu", "Kalamu",
  "Lemba", "Ngiri-Ngiri", "Bandal", "Bumbu", "Makala", "Selembao",
  "Mont-Ngafula", "Ndjili", "Masina", "Kimbanseke", "Nsele", "Maluku",
  "Kinshasa", "Kasavubu",
];

const TRENDING = ["Gombe", "Ngaliema", "Limete", "Kintambo"];

function ProgressHeader({ step, total, onBack }: { step: number; total: number; onBack: () => void }) {
  return (
    <View style={styles.headerContainer}>
      <TouchableOpacity onPress={onBack} style={styles.backBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <ChevronLeft size={24} color={Colors.foreground} strokeWidth={2} />
      </TouchableOpacity>
      <View style={styles.progressRow}>
        {Array.from({ length: total }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.progressSegment,
              i < step ? styles.progressActive : styles.progressInactive,
              i < total - 1 && { marginRight: 6 },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

export default function Step3Screen() {
  const t = useT();
  const { selectedAreas, setSelectedAreas, completeOnboarding } = useOnboardingStore();
  const [selected, setSelected] = useState<string[]>(selectedAreas);
  const [query, setQuery] = useState("");

  const filtered = query.trim()
    ? POPULAR_AREAS.filter((a) => a.toLowerCase().includes(query.toLowerCase()))
    : POPULAR_AREAS;

  function toggleArea(area: string) {
    setSelected((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]
    );
  }

  function handleFinish() {
    setSelectedAreas(selected);
    router.push("/(onboarding)/step4");
  }

  function handleSkip() {
    completeOnboarding();
    router.replace("/(tabs)");
  }

  function getNextLabel() {
    if (selected.length === 0) return t.onboarding.step3ViewAllProperties;
    if (selected.length === 1) return t.onboarding.step3ViewProperties;
    return t.onboarding.step3ViewPropertiesPlural.replace("{{count}}", String(selected.length));
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <StatusBar style="dark" />

      <ProgressHeader step={3} total={4} onBack={() => router.back()} />

      <View style={styles.body}>
        <Text style={styles.question}>{t.onboarding.step3Question}</Text>
        <Text style={styles.hint}>{t.onboarding.step3Hint}</Text>

        <View style={styles.searchBox}>
          <Search size={16} color={Colors.mutedFg} strokeWidth={2} />
          <TextInput
            style={styles.searchInput}
            placeholder={t.onboarding.step3SearchPlaceholder}
            placeholderTextColor={Colors.mutedFg}
            value={query}
            onChangeText={setQuery}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery("")} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
              <X size={14} color={Colors.mutedFg} />
            </TouchableOpacity>
          )}
        </View>

        {selected.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.selectedScroll}
            contentContainerStyle={{ paddingHorizontal: 2, gap: 8 }}
          >
            {selected.map((area) => (
              <TouchableOpacity
                key={area}
                style={styles.selectedChip}
                onPress={() => toggleArea(area)}
              >
                <Text style={styles.selectedChipText}>{area}</Text>
                <X size={12} color={Colors.primary} strokeWidth={2.5} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        <ScrollView
          style={styles.listScroll}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 12 }}
        >
          {!query && (
            <>
              <View style={styles.sectionHeader}>
                <TrendingUp size={14} color={Colors.primary} strokeWidth={2} />
                <Text style={styles.sectionTitle}>{t.onboarding.step3Trending}</Text>
              </View>
              <View style={styles.chipsWrap}>
                {TRENDING.map((area) => {
                  const isActive = selected.includes(area);
                  return (
                    <TouchableOpacity
                      key={area}
                      style={[styles.chip, isActive && styles.chipActive]}
                      onPress={() => toggleArea(area)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                        {area}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.sectionHeader}>
                <MapPin size={14} color={Colors.mutedFg} strokeWidth={2} />
                <Text style={styles.sectionTitle}>{t.onboarding.step3AllAreas}</Text>
              </View>
            </>
          )}

          <View style={styles.chipsWrap}>
            {filtered.map((area) => {
              const isActive = selected.includes(area);
              return (
                <TouchableOpacity
                  key={area}
                  style={[styles.chip, isActive && styles.chipActive]}
                  onPress={() => toggleArea(area)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                    {area}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.nextBtn} onPress={handleFinish} activeOpacity={0.85}>
          <Text style={styles.nextBtnText}>{getNextLabel()}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleSkip} style={styles.skipBtn}>
          <Text style={styles.skipText}>{t.onboarding.skip}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  headerContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  progressRow: { flex: 1, flexDirection: "row", height: 4 },
  progressSegment: { flex: 1, height: 4, borderRadius: 2 },
  progressActive: { backgroundColor: Colors.primary },
  progressInactive: { backgroundColor: "#E2E8F0" },
  body: { flex: 1, paddingHorizontal: 24, paddingTop: 28 },
  question: {
    fontSize: 30,
    fontFamily: "DMSans_700Bold",
    color: Colors.foreground,
    lineHeight: 36,
    marginBottom: 8,
  },
  hint: {
    fontSize: 14,
    fontFamily: "DMSans_400Regular",
    color: Colors.mutedFg,
    marginBottom: 20,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F2F4F7",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: "DMSans_400Regular",
    color: Colors.foreground,
    padding: 0,
  },
  selectedScroll: { marginBottom: 16, maxHeight: 44 },
  selectedChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#EAF2FB",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  selectedChipText: {
    fontSize: 13,
    fontFamily: "DMSans_500Medium",
    color: Colors.primary,
  },
  listScroll: { flex: 1 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: "DMSans_600SemiBold",
    color: Colors.foreground,
  },
  chipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 20,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: "#F2F4F7",
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  chipActive: {
    backgroundColor: "#EAF2FB",
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: 13,
    fontFamily: "DMSans_500Medium",
    color: Colors.mutedFg,
  },
  chipTextActive: {
    color: Colors.primary,
    fontFamily: "DMSans_600SemiBold",
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 8,
    gap: 10,
  },
  nextBtn: {
    backgroundColor: Colors.navy,
    borderRadius: 14,
    height: 54,
    alignItems: "center",
    justifyContent: "center",
  },
  nextBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "DMSans_600SemiBold",
  },
  skipBtn: {
    alignItems: "center",
    paddingVertical: 12,
  },
  skipText: {
    color: Colors.mutedFg,
    fontSize: 14,
    fontFamily: "DMSans_500Medium",
  },
});
