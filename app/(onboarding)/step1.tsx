import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Key, Home, TrendingUp } from "lucide-react-native";
import { useOnboardingStore, type PropertyIntent } from "../../src/store/useOnboardingStore";
import { Colors } from "../../src/constants/colors";

const { width } = Dimensions.get("window");

const OPTIONS: {
  key: PropertyIntent;
  label: string;
  description: string;
  Icon: React.ComponentType<{ size: number; color: string; strokeWidth?: number }>;
  color: string;
}[] = [
  {
    key: "rent",
    label: "Louer",
    description: "Locations courte ou longue durée",
    Icon: Key,
    color: Colors.primary,
  },
  {
    key: "buy",
    label: "Acheter",
    description: "Biens prêts ou en revente",
    Icon: Home,
    color: "#0F7A6E",
  },
  {
    key: "invest",
    label: "Investir",
    description: "Immobilier sur plan & rentabilité",
    Icon: TrendingUp,
    color: "#B8860B",
  },
];

function OnboardingHeader({ step, total }: { step: number; total: number }) {
  return (
    <View style={styles.headerContainer}>
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

export default function Step1Screen() {
  const { intent, setIntent } = useOnboardingStore();
  const [selected, setSelected] = useState<PropertyIntent>(intent);

  function handleNext() {
    if (!selected) return;
    setIntent(selected);
    router.push("/(onboarding)/step2");
  }

  function handleSkip() {
    router.replace("/(tabs)");
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <StatusBar barStyle="dark-content" />

      <OnboardingHeader step={1} total={3} />

      <View style={styles.body}>
        <Text style={styles.question}>Qu'est-ce qui{"\n"}vous intéresse ?</Text>
        <Text style={styles.hint}>Personnalisez votre expérience</Text>

        <View style={styles.cards}>
          {OPTIONS.map((opt) => {
            const isActive = selected === opt.key;
            return (
              <TouchableOpacity
                key={opt.key}
                activeOpacity={0.85}
                onPress={() => setSelected(opt.key)}
                style={[
                  styles.card,
                  isActive && { borderColor: opt.color, borderWidth: 2 },
                ]}
              >
                <View style={[styles.iconBox, { backgroundColor: isActive ? opt.color : "#F2F4F7" }]}>
                  <opt.Icon
                    size={26}
                    color={isActive ? "#fff" : Colors.mutedFg}
                    strokeWidth={1.8}
                  />
                </View>
                <View style={styles.cardText}>
                  <Text style={[styles.cardLabel, isActive && { color: opt.color }]}>
                    {opt.label}
                  </Text>
                  <Text style={styles.cardDesc}>{opt.description}</Text>
                </View>
                <View
                  style={[
                    styles.radioOuter,
                    isActive && { borderColor: opt.color },
                  ]}
                >
                  {isActive && <View style={[styles.radioInner, { backgroundColor: opt.color }]} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.nextBtn, !selected && styles.nextBtnDisabled]}
          onPress={handleNext}
          disabled={!selected}
          activeOpacity={0.85}
        >
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
  headerContainer: { paddingHorizontal: 24, paddingTop: 16 },
  progressRow: { flexDirection: "row", height: 4 },
  progressSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  progressActive: { backgroundColor: Colors.primary },
  progressInactive: { backgroundColor: "#E2E8F0" },
  body: { flex: 1, paddingHorizontal: 24, paddingTop: 36 },
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
    marginBottom: 36,
  },
  cards: { gap: 14 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FAFBFC",
    borderRadius: 16,
    padding: 18,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    gap: 14,
  },
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  cardText: { flex: 1 },
  cardLabel: {
    fontSize: 17,
    fontFamily: "DMSans_700Bold",
    color: Colors.foreground,
    marginBottom: 2,
  },
  cardDesc: {
    fontSize: 13,
    fontFamily: "DMSans_400Regular",
    color: Colors.mutedFg,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#CBD5E1",
    alignItems: "center",
    justifyContent: "center",
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
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
  nextBtnDisabled: { opacity: 0.45 },
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
