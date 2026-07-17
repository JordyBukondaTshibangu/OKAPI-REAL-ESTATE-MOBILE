import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ChevronLeft, Key, UserCheck, Building2 } from "lucide-react-native";
import { useOnboardingStore, type AccountType } from "../../src/store/useOnboardingStore";
import { Colors } from "../../src/constants/colors";
import { useT } from "../../src/i18n/useT";

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

export default function Step4Screen() {
  const t = useT().onboarding;
  const { accountType: stored, setAccountType, completeOnboarding } = useOnboardingStore();
  const [selected, setSelected] = useState<AccountType>(stored ?? "user");

  const OPTIONS: {
    value: AccountType;
    Icon: React.ComponentType<{ size: number; color: string }>;
    title: string;
    subtitle: string;
  }[] = [
    { value: "user",   Icon: Key,       title: t.step4RoleUser,   subtitle: t.step4RoleUserDesc },
    { value: "agent",  Icon: UserCheck, title: t.step4RoleAgent,  subtitle: t.step4RoleAgentDesc },
    { value: "agency", Icon: Building2, title: t.step4RoleAgency, subtitle: t.step4RoleAgencyDesc },
  ];

  function handleNext() {
    setAccountType(selected);
    router.push("/(onboarding)/step5");
  }

  function handleSkip() {
    completeOnboarding();
    router.replace("/(tabs)");
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <StatusBar style="dark" />

      <ProgressHeader step={4} total={5} onBack={() => router.back()} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.question}>{t.step4RoleQuestion}</Text>
        <Text style={styles.hint}>{t.step4RoleHint}</Text>

        <View style={{ gap: 14 }}>
          {OPTIONS.map(({ value, Icon, title, subtitle }) => {
            const isActive = selected === value;
            return (
              <TouchableOpacity
                key={value}
                style={[styles.card, isActive && styles.cardActive]}
                onPress={() => setSelected(value)}
                activeOpacity={0.85}
              >
                <View style={[styles.iconBox, isActive && styles.iconBoxActive]}>
                  <Icon size={22} color={isActive ? Colors.primary : Colors.mutedFg} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cardTitle, isActive && styles.cardTitleActive]}>{title}</Text>
                  <Text style={styles.cardSubtitle}>{subtitle}</Text>
                </View>
                <View style={[styles.radio, isActive && styles.radioActive]}>
                  {isActive && <View style={styles.radioDot} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.nextBtn} onPress={handleNext} activeOpacity={0.85}>
          <Text style={styles.nextBtnText}>{t.next} →</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleSkip} style={styles.skipBtn}>
          <Text style={styles.skipText}>{t.skip}</Text>
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
    width: 36, height: 36, borderRadius: 10,
    borderWidth: 1.5, borderColor: "#E2E8F0",
    alignItems: "center", justifyContent: "center",
  },
  progressRow: { flex: 1, flexDirection: "row", height: 4 },
  progressSegment: { flex: 1, height: 4, borderRadius: 2 },
  progressActive: { backgroundColor: Colors.primary },
  progressInactive: { backgroundColor: "#E2E8F0" },
  body: { paddingHorizontal: 24, paddingTop: 28, paddingBottom: 24 },
  question: {
    fontSize: 30, fontFamily: "DMSans_700Bold",
    color: Colors.foreground, lineHeight: 36, marginBottom: 8,
  },
  hint: {
    fontSize: 14, fontFamily: "DMSans_400Regular",
    color: Colors.mutedFg, marginBottom: 28,
  },
  card: {
    flexDirection: "row", alignItems: "center", gap: 14,
    padding: 18, borderRadius: 16,
    borderWidth: 1.5, borderColor: "#E2E8F0",
    backgroundColor: "#FAFAFA",
  },
  cardActive: {
    borderColor: Colors.primary,
    backgroundColor: "#EAF2FB",
  },
  iconBox: {
    width: 46, height: 46, borderRadius: 12,
    backgroundColor: "#F2F4F7",
    alignItems: "center", justifyContent: "center",
  },
  iconBoxActive: { backgroundColor: "#D6E8F8" },
  cardTitle: {
    fontSize: 15, fontFamily: "DMSans_600SemiBold",
    color: Colors.foreground, marginBottom: 2,
  },
  cardTitleActive: { color: Colors.primary },
  cardSubtitle: {
    fontSize: 12, fontFamily: "DMSans_400Regular",
    color: Colors.mutedFg,
  },
  radio: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2, borderColor: "#CBD5E1",
    alignItems: "center", justifyContent: "center",
  },
  radioActive: { borderColor: Colors.primary },
  radioDot: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: Colors.primary,
  },
  footer: { paddingHorizontal: 24, paddingBottom: 8, gap: 10 },
  nextBtn: {
    backgroundColor: Colors.navy, borderRadius: 14,
    height: 54, alignItems: "center", justifyContent: "center",
  },
  nextBtnText: { color: "#FFFFFF", fontSize: 16, fontFamily: "DMSans_600SemiBold" },
  skipBtn: { alignItems: "center", paddingVertical: 12 },
  skipText: { color: Colors.mutedFg, fontSize: 14, fontFamily: "DMSans_500Medium" },
});
