import React, { useState } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  KeyboardAvoidingView, Platform,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ChevronLeft, Eye, EyeOff, UserPlus, Building2, LogIn,
} from "lucide-react-native";
import { useOnboardingStore } from "../../src/store/useOnboardingStore";
import { useAuthStore } from "../../src/store/useAuthStore";
import { useAgentSignupStore } from "../../src/store/useAgentSignupStore";
import { useThemeStore } from "../../src/store/useThemeStore";
import { registerUser, getMe } from "../../src/services/auth";
import { registerAgent } from "../../src/services/agentAuth";
import Input from "../../src/components/ui/Input";
import PhoneInput from "../../src/components/ui/PhoneInput";
import { Colors } from "../../src/constants/colors";
import { useT } from "../../src/i18n/useT";

// ─── Progress header ──────────────────────────────────────────────────────────

function ProgressHeader({ step, total, onBack }: { step: number; total: number; onBack: () => void }) {
  const { theme } = useThemeStore();
  const isDark = theme === "dark";
  return (
    <View style={styles.headerContainer}>
      <TouchableOpacity
        onPress={onBack}
        style={[styles.backBtn, { borderColor: isDark ? Colors.dark.border : "#E2E8F0" }]}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <ChevronLeft size={24} color={isDark ? Colors.dark.foreground : Colors.foreground} strokeWidth={2} />
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

// ─── Redirect helper ──────────────────────────────────────────────────────────

function useOnboardingRedirect() {
  const { intent, propertyType, selectedAreas } = useOnboardingStore.getState();
  return function redirectToSearch() {
    const dest = intent === "rent" ? "/(tabs)/louer" : "/(tabs)/acheter";
    const params: Record<string, string> = {};
    if (propertyType) params.category = propertyType;
    if (selectedAreas.length > 0) params.suburb = selectedAreas[0];
    const hasFilters = intent || propertyType || selectedAreas.length > 0;
    if (hasFilters) {
      router.replace({ pathname: dest as any, params });
    } else {
      router.replace("/(tabs)");
    }
  };
}

// ─── Schemas ─────────────────────────────────────────────────────────────────

const passwordRules = z
  .string()
  .min(8,  "Au moins 8 caractères")
  .max(15, "Maximum 15 caractères")
  .regex(/[A-Z]/, "Au moins une majuscule")
  .regex(/[a-z]/, "Au moins une minuscule")
  .regex(/[^A-Za-z0-9]/, "Au moins un caractère spécial (!@#$…)");

const phoneRule = z
  .string()
  .regex(/^\+\d{7,15}$/, "Numéro de téléphone invalide");

const userSchema = z.object({
  firstName:       z.string().min(1, "Prénom requis"),
  lastName:        z.string().min(1, "Nom requis"),
  name:            z.string().optional(),
  email:           z.string().email("Email invalide"),
  phoneNumber:     phoneRule,
  password:        passwordRules,
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

const agentSchema = z.object({
  firstName:       z.string().optional(),
  lastName:        z.string().optional(),
  name:            z.string().min(2, "Nom requis (min. 2 caractères)"),
  email:           z.string().email("Email invalide"),
  phoneNumber:     phoneRule,
  password:        passwordRules,
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

type FormData = {
  firstName?: string;
  lastName?: string;
  name?: string;
  email: string;
  phoneNumber: string;
  password: string;
  confirmPassword: string;
};

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function Step5Screen() {
  const t = useT();
  const { completeOnboarding, accountType } = useOnboardingStore();
  const { setAuth } = useAuthStore();
  const { setSignup } = useAgentSignupStore();
  const { theme } = useThemeStore();
  const isDark = theme === "dark";
  const redirectToSearch = useOnboardingRedirect();

  const isAgent  = accountType === "agent";
  const isAgency = accountType === "agency";
  const isPro    = isAgent || isAgency;

  const bgColor     = isDark ? Colors.dark.background : "#FFFFFF";
  const textMain    = isDark ? Colors.dark.foreground  : Colors.foreground;
  const textMuted   = isDark ? Colors.dark.mutedFg     : Colors.mutedFg;
  const errorBg     = isDark ? "rgba(224,85,85,0.12)"  : "#FEF2F2";
  const errorBorder = isDark ? Colors.dark.destructive : "#FECACA";
  const primary     = isDark ? Colors.dark.primary     : Colors.primary;

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm,  setShowConfirm]  = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState<string | null>(null);

  const schema = isPro ? agentSchema : userSchema;
  const { control, handleSubmit, formState: { errors, isValid } } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    mode: "onChange",
    defaultValues: { phoneNumber: "+243" },
  });

  function finishOnboarding() {
    completeOnboarding();
    redirectToSearch();
  }

  async function onSubmit(data: FormData) {
    setLoading(true);
    setError(null);
    try {
      if (isPro) {
        // Agent or Agency registration
        const agentName = data.name ?? "";
        const result = await registerAgent({
          name: agentName,
          email: data.email,
          phoneNumber: data.phoneNumber,
          password: data.password,
        });
        setSignup(result.access_token, result.agent.name, result.agent.email, data.phoneNumber);
        completeOnboarding();
        router.replace("/(auth)/agent-verification" as any);
      } else {
        // User registration
        const { access_token } = await registerUser({
          firstName: data.firstName ?? "",
          lastName: data.lastName ?? "",
          email: data.email,
          phoneNumber: data.phoneNumber,
          password: data.password,
        });
        const user = await getMe(access_token);
        setAuth(access_token, user);
        completeOnboarding();
        redirectToSearch();
      }
    } catch (e: any) {
      const msg = e?.response?.data?.message;
      setError(Array.isArray(msg) ? msg.join(", ") : (msg ?? t.common.errorGeneric));
    } finally {
      setLoading(false);
    }
  }

  const eyeColor = isDark ? Colors.dark.mutedFg : Colors.mutedFg;

  const ob = t.onboarding;

  // Dynamic labels
  const title     = isAgency ? ob.step5AgencyTitle  : isAgent ? ob.step5AgentTitle  : ob.step4Question;
  const hint      = isAgency ? ob.step5AgencyHint   : isAgent ? ob.step5AgentHint   : ob.step4Hint;
  const btnLabel  = isAgency ? ob.step5CreateAgency : isAgent ? ob.step5CreateAgent : ob.createAccount;
  const nameLabel = isAgency ? ob.step5AgencyNameLabel : ob.step5AgentNameLabel;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]} edges={["top"]}>
      <StatusBar style={isDark ? "light" : "dark"} />

      <ProgressHeader step={5} total={5} onBack={() => router.back()} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 24}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets
        >
          <Text style={[styles.question, { color: textMain }]}>{title}</Text>
          <Text style={[styles.hint, { color: textMuted }]}>{hint}</Text>

          {error && (
            <View style={[styles.errorBox, { backgroundColor: errorBg, borderColor: errorBorder }]}>
              <Text style={[styles.errorText, { color: isDark ? Colors.dark.destructive : Colors.destructive }]}>{error}</Text>
            </View>
          )}

          {/* User: first + last name side by side */}
          {!isPro && (
            <View style={{ flexDirection: "row", gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Controller control={control} name="firstName" render={({ field: { value, onChange, onBlur } }) => (
                  <Input label={t.auth.firstName} value={value ?? ""} onChangeText={onChange} onBlur={onBlur} error={errors.firstName?.message} />
                )} />
              </View>
              <View style={{ flex: 1 }}>
                <Controller control={control} name="lastName" render={({ field: { value, onChange, onBlur } }) => (
                  <Input label={t.auth.lastName} value={value ?? ""} onChangeText={onChange} onBlur={onBlur} error={errors.lastName?.message} />
                )} />
              </View>
            </View>
          )}

          {/* Agent/Agency: single name field */}
          {isPro && (
            <Controller control={control} name="name" render={({ field: { value, onChange, onBlur } }) => (
              <Input label={nameLabel} value={value ?? ""} onChangeText={onChange} onBlur={onBlur} error={errors.name?.message} />
            )} />
          )}

          <Controller control={control} name="email" render={({ field: { value, onChange, onBlur } }) => (
            <Input label={t.auth.email} value={value} onChangeText={onChange} onBlur={onBlur} error={errors.email?.message} keyboardType="email-address" autoCapitalize="none" />
          )} />

          <Controller control={control} name="phoneNumber" render={({ field: { value, onChange, onBlur } }) => (
            <PhoneInput
              label={isPro ? ob.step5PhoneWhatsapp : t.auth.phone}
              value={value ?? ""}
              onChange={onChange}
              onBlur={onBlur}
              error={errors.phoneNumber?.message}
              locked={isPro}
            />
          )} />

          <View>
            <Controller control={control} name="password" render={({ field: { value, onChange, onBlur } }) => (
              <Input label={t.auth.password} value={value} onChangeText={onChange} onBlur={onBlur} error={errors.password?.message} secureTextEntry={!showPassword} />
            )} />
            <TouchableOpacity onPress={() => setShowPassword(v => !v)} style={{ position: "absolute", right: 14, top: 34 }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              {showPassword ? <EyeOff size={18} color={eyeColor} /> : <Eye size={18} color={eyeColor} />}
            </TouchableOpacity>
          </View>

          <View>
            <Controller control={control} name="confirmPassword" render={({ field: { value, onChange, onBlur } }) => (
              <Input label={t.auth.confirmPassword} value={value} onChangeText={onChange} onBlur={onBlur} error={errors.confirmPassword?.message} secureTextEntry={!showConfirm} />
            )} />
            <TouchableOpacity onPress={() => setShowConfirm(v => !v)} style={{ position: "absolute", right: 14, top: 34 }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              {showConfirm ? <EyeOff size={18} color={eyeColor} /> : <Eye size={18} color={eyeColor} />}
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.nextBtn, (!isValid || loading) && { opacity: 0.5 }]}
              onPress={handleSubmit(onSubmit)}
              disabled={!isValid || loading}
              activeOpacity={0.85}
            >
              {isAgency
                ? <Building2 size={18} color="#FFFFFF" strokeWidth={2} />
                : <UserPlus size={18} color="#FFFFFF" strokeWidth={2} />}
              <Text style={styles.nextBtnText}>
                {loading ? t.onboarding.creating : btnLabel}
              </Text>
            </TouchableOpacity>

            {/* Reassurance text for pro accounts */}
            {isPro && (
              <View style={{ alignItems: "center", gap: 2, paddingVertical: 4 }}>
                <Text style={{ color: textMuted, fontSize: 12, fontFamily: "DMSans_500Medium" }}>
                  {ob.step5FreeMonths}
                </Text>
                <Text style={{ color: textMuted, fontSize: 12 }}>
                  {ob.step5NoCard}
                </Text>
              </View>
            )}

            {/* Sign-in shortcut */}
            <TouchableOpacity
              onPress={() => {
                completeOnboarding();
                router.replace(isPro ? "/(auth)/agent-connexion" : "/(auth)/connexion" as any);
              }}
              style={styles.signinBtn}
              disabled={loading}
              activeOpacity={0.7}
            >
              <LogIn size={15} color={primary} strokeWidth={2} />
              <Text style={[styles.signinText, { color: textMuted }]}>
                {t.auth.alreadyRegistered}{" "}
                <Text style={{ color: primary, fontFamily: "DMSans_600SemiBold" }}>
                  {t.auth.login}
                </Text>
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={finishOnboarding} style={styles.skipBtn} disabled={loading}>
              <Text style={[styles.skipText, { color: textMuted }]}>{t.onboarding.later}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerContainer: {
    paddingHorizontal: 20, paddingTop: 16,
    flexDirection: "row", alignItems: "center", gap: 12,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10,
    borderWidth: 1.5, alignItems: "center", justifyContent: "center",
  },
  progressRow: { flex: 1, flexDirection: "row", height: 4 },
  progressSegment: { flex: 1, height: 4, borderRadius: 2 },
  progressActive: { backgroundColor: Colors.primary },
  progressInactive: { backgroundColor: "#E2E8F0" },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 28, paddingBottom: 48 },
  question: { fontSize: 28, fontFamily: "DMSans_700Bold", lineHeight: 34, marginBottom: 8 },
  hint: { fontSize: 13, fontFamily: "DMSans_400Regular", marginBottom: 24 },
  errorBox: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 16 },
  errorText: { fontSize: 13 },
  footer: { marginTop: 24, gap: 10 },
  nextBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, backgroundColor: Colors.navy, borderRadius: 14, height: 54,
  },
  nextBtnText: { color: "#FFFFFF", fontSize: 16, fontFamily: "DMSans_600SemiBold" },
  signinBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, paddingVertical: 14, borderRadius: 14,
    borderWidth: 1.5, borderColor: Colors.primary + "33",
  },
  signinText: { fontSize: 14, fontFamily: "DMSans_500Medium" },
  skipBtn: { alignItems: "center", paddingVertical: 12 },
  skipText: { fontSize: 14, fontFamily: "DMSans_500Medium" },
});
