import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ChevronLeft, Eye, EyeOff, UserPlus, LogIn } from "lucide-react-native";
import { useOnboardingStore } from "../../src/store/useOnboardingStore";
import { useAuthStore } from "../../src/store/useAuthStore";
import { useThemeStore } from "../../src/store/useThemeStore";
import { registerUser, getMe } from "../../src/services/auth";
import Input from "../../src/components/ui/Input";
import { Colors } from "../../src/constants/colors";
import { useT } from "../../src/i18n/useT";

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

export default function Step4Screen() {
  const t = useT();
  const { completeOnboarding } = useOnboardingStore();
  const { setAuth } = useAuthStore();
  const { theme } = useThemeStore();
  const isDark = theme === "dark";
  const redirectToSearch = useOnboardingRedirect();

  const bgColor     = isDark ? Colors.dark.background : "#FFFFFF";
  const textMain    = isDark ? Colors.dark.foreground  : Colors.foreground;
  const textMuted   = isDark ? Colors.dark.mutedFg     : Colors.mutedFg;
  const errorBg     = isDark ? "rgba(224,85,85,0.12)"  : "#FEF2F2";
  const errorBorder = isDark ? Colors.dark.destructive : "#FECACA";

  const schema = z.object({
    firstName:       z.string().min(1, t.auth.firstName),
    lastName:        z.string().min(1, t.auth.lastName),
    email:           z.string().email(t.auth.email),
    phoneNumber:     z.string().min(1, t.auth.phone),
    password:        z.string().min(8, "8 min"),
    confirmPassword: z.string(),
  }).refine(d => d.password === d.confirmPassword, {
    message: t.auth.confirmPassword,
    path: ["confirmPassword"],
  });
  type FormData = z.infer<typeof schema>;

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm,  setShowConfirm]  = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState<string | null>(null);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  function finishOnboarding() {
    completeOnboarding();
    redirectToSearch();
  }

  async function onSubmit(data: FormData) {
    setLoading(true);
    setError(null);
    try {
      const { access_token } = await registerUser({
        firstName: data.firstName, lastName: data.lastName,
        email: data.email, phoneNumber: data.phoneNumber, password: data.password,
      });
      const user = await getMe(access_token);
      setAuth(access_token, user);
      completeOnboarding();
      redirectToSearch();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? t.common.errorGeneric);
    } finally {
      setLoading(false);
    }
  }

  const eyeColor = isDark ? Colors.dark.mutedFg : Colors.mutedFg;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]} edges={["top"]}>
      <StatusBar style={isDark ? "light" : "dark"} />

      <ProgressHeader step={4} total={4} onBack={() => router.back()} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.question, { color: textMain }]}>{t.onboarding.step4Question}</Text>
        <Text style={[styles.hint, { color: textMuted }]} numberOfLines={1} ellipsizeMode="tail">{t.onboarding.step4Hint}</Text>

        {error && (
          <View style={[styles.errorBox, { backgroundColor: errorBg, borderColor: errorBorder }]}>
            <Text style={[styles.errorText, { color: isDark ? Colors.dark.destructive : Colors.destructive }]}>{error}</Text>
          </View>
        )}

        <View style={{ flexDirection: "row", gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Controller control={control} name="firstName" render={({ field: { value, onChange, onBlur } }) => (
              <Input label={t.auth.firstName} value={value} onChangeText={onChange} onBlur={onBlur} error={errors.firstName?.message} />
            )} />
          </View>
          <View style={{ flex: 1 }}>
            <Controller control={control} name="lastName" render={({ field: { value, onChange, onBlur } }) => (
              <Input label={t.auth.lastName} value={value} onChangeText={onChange} onBlur={onBlur} error={errors.lastName?.message} />
            )} />
          </View>
        </View>

        <Controller control={control} name="email" render={({ field: { value, onChange, onBlur } }) => (
          <Input label={t.auth.email} value={value} onChangeText={onChange} onBlur={onBlur} error={errors.email?.message} keyboardType="email-address" autoCapitalize="none" />
        )} />

        <Controller control={control} name="phoneNumber" render={({ field: { value, onChange, onBlur } }) => (
          <Input label={t.auth.phone} value={value} onChangeText={onChange} onBlur={onBlur} error={errors.phoneNumber?.message} keyboardType="phone-pad" />
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

        {/* Footer inside ScrollView so the keyboard never covers it */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.nextBtn, loading && { opacity: 0.7 }]}
            onPress={handleSubmit(onSubmit)}
            disabled={loading}
            activeOpacity={0.85}
          >
            <UserPlus size={18} color="#FFFFFF" strokeWidth={2} />
            <Text style={styles.nextBtnText}>
              {loading ? t.onboarding.creating : t.onboarding.createAccount}
            </Text>
          </TouchableOpacity>

          {/* Sign-in shortcut for returning users */}
          <TouchableOpacity
            onPress={() => { completeOnboarding(); router.replace("/(auth)/connexion" as any); }}
            style={styles.signinBtn}
            disabled={loading}
            activeOpacity={0.7}
          >
            <LogIn size={15} color={isDark ? Colors.dark.primary : Colors.primary} strokeWidth={2} />
            <Text style={[styles.signinText, { color: textMuted }]}>
              {t.auth.alreadyRegistered}{" "}
              <Text style={{ color: isDark ? Colors.dark.primary : Colors.primary, fontFamily: "DMSans_600SemiBold" }}>
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
  scrollContent: { paddingHorizontal: 24, paddingTop: 28, paddingBottom: 48 },
  question: {
    fontSize: 30,
    fontFamily: "DMSans_700Bold",
    lineHeight: 36,
    marginBottom: 8,
  },
  hint: {
    fontSize: 12,
    fontFamily: "DMSans_400Regular",
    marginBottom: 24,
  },
  errorBox: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
  },
  errorText: { fontSize: 13 },
  footer: {
    marginTop: 24,
    gap: 10,
  },
  nextBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.navy,
    borderRadius: 14,
    height: 54,
  },
  nextBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "DMSans_600SemiBold",
  },
  signinBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.primary + "33",
  },
  signinText: {
    fontSize: 14,
    fontFamily: "DMSans_500Medium",
  },
  skipBtn: {
    alignItems: "center",
    paddingVertical: 12,
  },
  skipText: {
    fontSize: 14,
    fontFamily: "DMSans_500Medium",
  },
});
