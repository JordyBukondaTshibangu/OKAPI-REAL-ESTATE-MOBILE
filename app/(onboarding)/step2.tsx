import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import {
  Building2,
  Home,
  Castle,
  Hotel,
  Map,
  Layers,
  Briefcase,
  ShoppingBag,
  Warehouse,
  Building,
  ChevronLeft,
} from "lucide-react-native";
import {
  useOnboardingStore,
  type PropertyCategory,
  type PropertyType,
} from "../../src/store/useOnboardingStore";
import { Colors } from "../../src/constants/colors";

const RESIDENTIAL: {
  key: PropertyType;
  label: string;
  Icon: React.ComponentType<{ size: number; color: string; strokeWidth?: number }>;
}[] = [
  { key: "apartment", label: "Appartement", Icon: Building2 },
  { key: "villa",      label: "Villa",        Icon: Castle },
  { key: "house",      label: "Maison",       Icon: Home },
  { key: "studio",     label: "Studio",       Icon: Hotel },
  { key: "penthouse",  label: "Penthouse",    Icon: Layers },
  { key: "land",       label: "Terrain",      Icon: Map },
];

const COMMERCIAL: {
  key: PropertyType;
  label: string;
  Icon: React.ComponentType<{ size: number; color: string; strokeWidth?: number }>;
}[] = [
  { key: "office",    label: "Bureau",     Icon: Briefcase },
  { key: "shop",      label: "Boutique",   Icon: ShoppingBag },
  { key: "warehouse", label: "Entrepôt",   Icon: Warehouse },
  { key: "building",  label: "Immeuble",   Icon: Building },
];

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

export default function Step2Screen() {
  const { propertyCategory, propertyType, setPropertyCategory, setPropertyType, completeOnboarding } = useOnboardingStore();
  const [activeCategory, setActiveCategory] = useState<PropertyCategory>(propertyCategory ?? "residential");
  const [selected, setSelected] = useState<PropertyType>(propertyType);

  const options = activeCategory === "residential" ? RESIDENTIAL : COMMERCIAL;

  function handleCategorySwitch(cat: PropertyCategory) {
    setActiveCategory(cat);
    setSelected(null);
  }

  function handleNext() {
    setPropertyCategory(activeCategory);
    setPropertyType(selected);
    router.push("/(onboarding)/step3");
  }

  function handleSkip() {
    completeOnboarding();
    router.replace("/(tabs)");
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <StatusBar style="dark" />

      <ProgressHeader step={2} total={4} onBack={() => router.back()} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.question}>Quel type de bien{"\n"}vous intéresse ?</Text>
        <Text style={styles.hint}>Vous pouvez modifier cela plus tard</Text>

        {/* Category toggle */}
        <View style={styles.toggle}>
          <TouchableOpacity
            style={[styles.toggleBtn, activeCategory === "residential" && styles.toggleBtnActive]}
            onPress={() => handleCategorySwitch("residential")}
          >
            <Text style={[styles.toggleText, activeCategory === "residential" && styles.toggleTextActive]}>
              Résidentiel
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, activeCategory === "commercial" && styles.toggleBtnActive]}
            onPress={() => handleCategorySwitch("commercial")}
          >
            <Text style={[styles.toggleText, activeCategory === "commercial" && styles.toggleTextActive]}>
              Commercial
            </Text>
          </TouchableOpacity>
        </View>

        {/* Grid */}
        <View style={styles.grid}>
          {options.map((opt) => {
            const isActive = selected === opt.key;
            return (
              <TouchableOpacity
                key={opt.key}
                style={[styles.typeCard, isActive && styles.typeCardActive]}
                onPress={() => setSelected(isActive ? null : opt.key)}
                activeOpacity={0.8}
              >
                <View style={[styles.typeIconBox, isActive && styles.typeIconBoxActive]}>
                  <opt.Icon
                    size={28}
                    color={isActive ? "#fff" : Colors.mutedFg}
                    strokeWidth={1.6}
                  />
                </View>
                <Text style={[styles.typeLabel, isActive && styles.typeLabelActive]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.nextBtn} onPress={handleNext} activeOpacity={0.85}>
          <Text style={styles.nextBtnText}>Suivant</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleSkip} style={styles.skipBtn}>
          <Text style={styles.skipText}>Passer</Text>
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
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 32, paddingBottom: 8 },
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
    marginBottom: 28,
  },
  toggle: {
    flexDirection: "row",
    backgroundColor: "#F2F4F7",
    borderRadius: 12,
    padding: 4,
    marginBottom: 28,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 9,
  },
  toggleBtnActive: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  toggleText: {
    fontSize: 14,
    fontFamily: "DMSans_500Medium",
    color: Colors.mutedFg,
  },
  toggleTextActive: {
    color: Colors.primary,
    fontFamily: "DMSans_600SemiBold",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  typeCard: {
    width: "30%",
    aspectRatio: 1,
    backgroundColor: "#FAFBFC",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    padding: 10,
    gap: 8,
    flexGrow: 1,
    maxWidth: "31%",
  },
  typeCardActive: {
    borderColor: Colors.primary,
    backgroundColor: "#EAF2FB",
  },
  typeIconBox: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: "#F2F4F7",
    alignItems: "center",
    justifyContent: "center",
  },
  typeIconBoxActive: {
    backgroundColor: Colors.primary,
  },
  typeLabel: {
    fontSize: 11,
    fontFamily: "DMSans_500Medium",
    color: Colors.mutedFg,
    textAlign: "center",
  },
  typeLabelActive: {
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
