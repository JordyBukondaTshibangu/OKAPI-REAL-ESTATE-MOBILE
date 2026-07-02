import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Key, Home, TrendingUp, ArrowRight, SkipForward, Moon, Calendar, Repeat } from "lucide-react-native";
import { useOnboardingStore, type PropertyIntent, type StayDuration } from "../../src/store/useOnboardingStore";
import { Colors } from "../../src/constants/colors";
import { useT } from "../../src/i18n/useT";
import LanguageSwitcher from "../../src/components/ui/LanguageSwitcher";

const { width } = Dimensions.get("window");

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
      <LanguageSwitcher />
    </View>
  );
}

export default function Step1Screen() {
  const t = useT();
  const { intent, stayDuration, setIntent, setStayDuration, completeOnboarding } = useOnboardingStore();
  const [selected, setSelected] = useState<PropertyIntent>(intent);
  // Only meaningful once "Louer" is selected - defaults to "both" so it never
  // blocks Continue, but the user can narrow it down right here.
  const [duration, setDuration] = useState<StayDuration>(stayDuration ?? "both");

  const OPTIONS: {
    key: PropertyIntent;
    label: string;
    description: string;
    Icon: React.ComponentType<{ size: number; color: string; strokeWidth?: number }>;
    color: string;
  }[] = [
    {
      key: "rent",
      label: t.onboarding.intentRent,
      description: t.onboarding.intentRentDesc,
      Icon: Key,
      color: Colors.primary,
    },
    {
      key: "buy",
      label: t.onboarding.intentBuy,
      description: t.onboarding.intentBuyDesc,
      Icon: Home,
      color: "#0F7A6E",
    },
    {
      key: "invest",
      label: t.onboarding.intentInvest,
      description: t.onboarding.intentInvestDesc,
      Icon: TrendingUp,
      color: "#B8860B",
    },
  ];

  const DURATION_OPTIONS: {
    key: Exclude<StayDuration, null>;
    label: string;
    desc: string;
    Icon: React.ComponentType<{ size: number; color: string; strokeWidth?: number }>;
  }[] = [
    { key: "short", label: t.onboarding.stayDurationShort, desc: t.onboarding.stayDurationShortDesc, Icon: Moon },
    { key: "long", label: t.onboarding.stayDurationLong, desc: t.onboarding.stayDurationLongDesc, Icon: Calendar },
    { key: "both", label: t.onboarding.stayDurationBoth, desc: t.onboarding.stayDurationBothDesc, Icon: Repeat },
  ];

  function handleNext() {
    if (!selected) return;
    setIntent(selected);
    setStayDuration(selected === "rent" ? duration : null);
    router.push("/(onboarding)/step2");
  }

  function handleSkip() {
    completeOnboarding();
    router.replace("/(tabs)");
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <StatusBar style="dark" />

      <OnboardingHeader step={1} total={4} />

      <ScrollView
        style={styles.body}
        contentContainerStyle={{ paddingBottom: 16 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.question}>{t.onboarding.step1Question}</Text>
        <Text style={styles.hint}>{t.onboarding.step1Hint}</Text>

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

        {/* Stay-duration sub-choice - only relevant once "Louer" is picked */}
        {selected === "rent" && (
          <View style={styles.durationBlock}>
            <Text style={styles.durationQuestion}>{t.onboarding.stayDurationQuestion}</Text>
            <View style={styles.durationRow}>
              {DURATION_OPTIONS.map((opt) => {
                const isActive = duration === opt.key;
                return (
                  <TouchableOpacity
                    key={opt.key}
                    activeOpacity={0.85}
                    onPress={() => setDuration(opt.key)}
                    style={[
                      styles.durationPill,
                      isActive && { borderColor: Colors.primary, backgroundColor: "#EAF2FB" },
                    ]}
                  >
                    <opt.Icon size={18} color={isActive ? Colors.primary : Colors.mutedFg} strokeWidth={1.8} />
                    <Text style={[styles.durationLabel, isActive && { color: Colors.primary, fontFamily: "DMSans_600SemiBold" }]}>
                      {opt.label}
                    </Text>
                    <Text style={styles.durationDesc}>{opt.desc}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.footerRow}>
          {/* Skip — outlined, always visible */}
          <TouchableOpacity
            style={styles.skipBtn}
            onPress={handleSkip}
            activeOpacity={0.75}
          >
            <SkipForward size={15} color={Colors.mutedFg} strokeWidth={2} />
            <Text style={styles.skipText}>{t.onboarding.skip}</Text>
          </TouchableOpacity>

          {/* Continue — filled, disabled until a choice is made */}
          <TouchableOpacity
            style={[styles.nextBtn, !selected && styles.nextBtnDisabled]}
            onPress={handleNext}
            disabled={!selected}
            activeOpacity={0.85}
          >
            <Text style={styles.nextBtnText}>{t.onboarding.next}</Text>
            <ArrowRight size={16} color="#FFFFFF" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        {/* Subtle hint so the user knows selecting unlocks Continue */}
        {!selected && (
          <Text style={styles.selectionHint}>{t.onboarding.step1Hint2 ?? "Sélectionnez une option pour continuer"}</Text>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  headerContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  progressRow: { flex: 1, flexDirection: "row", height: 4 },
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
  durationBlock: { marginTop: 24 },
  durationQuestion: {
    fontSize: 14,
    fontFamily: "DMSans_600SemiBold",
    color: Colors.foreground,
    marginBottom: 10,
  },
  durationRow: { flexDirection: "row", gap: 10 },
  durationPill: {
    flex: 1,
    alignItems: "center",
    gap: 4,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    backgroundColor: "#FAFBFC",
  },
  durationLabel: {
    fontSize: 12,
    fontFamily: "DMSans_500Medium",
    color: Colors.foreground,
    textAlign: "center",
  },
  durationDesc: {
    fontSize: 10,
    fontFamily: "DMSans_400Regular",
    color: Colors.mutedFg,
    textAlign: "center",
  },
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
    gap: 8,
  },
  footerRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  skipBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 54,
    flex: 1,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#D1D9E6",
    backgroundColor: "#F8FAFC",
  },
  skipText: {
    color: Colors.mutedFg,
    fontSize: 15,
    fontFamily: "DMSans_500Medium",
  },
  nextBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.navy,
    borderRadius: 14,
    height: 54,
    flex: 2,
  },
  nextBtnDisabled: { opacity: 0.4 },
  nextBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "DMSans_600SemiBold",
  },
  selectionHint: {
    textAlign: "center",
    color: Colors.mutedFg,
    fontSize: 12,
    fontFamily: "DMSans_400Regular",
    paddingBottom: 4,
  },
});
