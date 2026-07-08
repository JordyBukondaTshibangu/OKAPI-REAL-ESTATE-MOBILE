import React from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { CheckCircle, Clock, ShieldCheck, Zap } from "lucide-react-native";
import { useThemeStore } from "../../src/store/useThemeStore";
import { Colors } from "../../src/constants/colors";
import { useT } from "../../src/i18n/useT";
import Button from "../../src/components/ui/Button";

const STEPS = [
  { key: "created",  icon: CheckCircle, done: true },
  { key: "verified", icon: CheckCircle, done: true },
  { key: "pending",  icon: Clock,       done: false },
  { key: "active",   icon: Zap,         done: false },
] as const;

export default function AgentEnAttenteScreen() {
  const t = useT();
  const s = t.agentSignup;
  const { theme } = useThemeStore();
  const isDark = theme === "dark";

  const pageBg   = isDark ? Colors.dark.background : Colors.backgroundAlt;
  const cardBg   = isDark ? Colors.dark.card       : Colors.white;
  const textMain = isDark ? Colors.dark.foreground  : Colors.foreground;
  const textMut  = isDark ? Colors.dark.mutedFg     : Colors.mutedFg;
  const borderC  = isDark ? Colors.dark.border      : Colors.border;
  const iconC    = isDark ? Colors.dark.primary     : Colors.primary;

  const stepLabels = [
    { title: "Compte créé",      desc: "Votre profil agent a été enregistré." },
    { title: "E-mail vérifié",   desc: "Votre adresse e-mail a été confirmée." },
    { title: "Validation",       desc: "Notre équipe examine votre dossier. Vous serez notifié par e-mail." },
    { title: "Compte activé",    desc: "Vous pourrez publier vos annonces et apparaître dans l'annuaire." },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: pageBg }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingTop: 48, paddingBottom: 40 }}>

        {/* Icon */}
        <View style={{ alignItems: "center", marginBottom: 28 }}>
          <View style={{
            width: 80, height: 80, borderRadius: 24,
            backgroundColor: Colors.navy,
            alignItems: "center", justifyContent: "center",
            marginBottom: 16,
            shadowColor: Colors.navy,
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.3,
            shadowRadius: 16,
            elevation: 8,
          }}>
            <ShieldCheck size={36} color={Colors.secondary} strokeWidth={1.8} />
          </View>
          <Text style={{ color: textMain, fontSize: 22, fontFamily: "DMSans_700Bold", textAlign: "center", marginBottom: 8 }}>
            {s.pendingTitle}
          </Text>
          <Text style={{ color: textMut, fontSize: 14, textAlign: "center", lineHeight: 22 }}>
            {s.pendingSubtitle}
          </Text>
        </View>

        {/* Steps card */}
        <View style={{
          backgroundColor: cardBg, borderRadius: 20,
          borderWidth: 1, borderColor: borderC,
          padding: 20, marginBottom: 20,
        }}>
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            const isLast = i === STEPS.length - 1;
            return (
              <View key={step.key} style={{ flexDirection: "row", gap: 14, marginBottom: isLast ? 0 : 20 }}>
                {/* Icon + connector */}
                <View style={{ alignItems: "center" }}>
                  <View style={{
                    width: 32, height: 32, borderRadius: 16,
                    backgroundColor: step.done
                      ? (isDark ? Colors.dark.accent : Colors.accent)
                      : (isDark ? Colors.dark.muted : "#f1f5f9"),
                    borderWidth: 2,
                    borderColor: step.done ? iconC : borderC,
                    alignItems: "center", justifyContent: "center",
                  }}>
                    <Icon size={16} color={step.done ? iconC : textMut} />
                  </View>
                  {!isLast && (
                    <View style={{
                      width: 2, flex: 1, marginTop: 4,
                      backgroundColor: step.done ? iconC : borderC,
                      opacity: step.done ? 0.4 : 0.25,
                    }} />
                  )}
                </View>
                {/* Label */}
                <View style={{ flex: 1, paddingTop: 4 }}>
                  <Text style={{
                    color: step.done ? textMain : textMut,
                    fontSize: 14, fontFamily: "DMSans_600SemiBold", marginBottom: 2,
                  }}>
                    {stepLabels[i].title}
                  </Text>
                  <Text style={{ color: textMut, fontSize: 12, lineHeight: 18 }}>
                    {stepLabels[i].desc}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Info box */}
        <View style={{
          backgroundColor: isDark ? Colors.dark.accent : Colors.accent,
          borderRadius: 14, padding: 16,
          borderWidth: 1, borderColor: isDark ? Colors.dark.border : Colors.border,
          marginBottom: 28,
        }}>
          <Text style={{ color: textMut, fontSize: 13, lineHeight: 20 }}>
            ⏱ Délai estimé : <Text style={{ color: textMain, fontFamily: "DMSans_600SemiBold" }}>24–48 h.</Text>
          </Text>
          <Text style={{ color: textMut, fontSize: 13, marginTop: 6, lineHeight: 20 }}>
            📧 Vérifiez votre boîte e-mail (y compris les spams) pour la confirmation de validation.
          </Text>
        </View>

        <Button onPress={() => router.replace("/(tabs)")} size="lg">
          {s.backToHome}
        </Button>

        <TouchableOpacity
          onPress={() => router.push("/(auth)/agent-connexion")}
          style={{ alignItems: "center", marginTop: 16 }}
        >
          <Text style={{ color: iconC, fontSize: 13, fontFamily: "DMSans_600SemiBold" }}>
            {t.agentAuth.loginBtn} →
          </Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}
