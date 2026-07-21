import React, { useState } from "react";
import {
  View, Text, TouchableOpacity, ScrollView,
  Alert, KeyboardAvoidingView, Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { registerAgent } from "../../src/services/agentAuth";
import { useAgentSignupStore } from "../../src/store/useAgentSignupStore";
import { useThemeStore } from "../../src/store/useThemeStore";
import Input from "../../src/components/ui/Input";
import PhoneInput from "../../src/components/ui/PhoneInput";
import Button from "../../src/components/ui/Button";
import { Colors } from "../../src/constants/colors";
import { ArrowLeft, Eye, EyeOff, UserCheck } from "lucide-react-native";
import { useT } from "../../src/i18n/useT";

export default function DevenirAgentScreen() {
  const t = useT();
  const s = t.agentSignup;
  const { setSignup } = useAgentSignupStore();
  const { theme } = useThemeStore();
  const isDark = theme === "dark";

  const pageBg    = isDark ? Colors.dark.background : Colors.backgroundAlt;
  const cardBg    = isDark ? Colors.dark.card       : Colors.white;
  const textMain  = isDark ? Colors.dark.foreground  : Colors.foreground;
  const textMut   = isDark ? Colors.dark.mutedFg     : Colors.mutedFg;
  const borderC   = isDark ? Colors.dark.border      : Colors.border;
  const iconC     = isDark ? Colors.dark.primary     : Colors.primary;
  const errBg     = isDark ? "rgba(224,85,85,0.12)"  : "#FEF2F2";
  const errBorder = isDark ? Colors.dark.destructive : "#FECACA";

  // ── Schema ────────────────────────────────────────────────────────────────────
  const schema = z.object({
    name:  z.string().min(2, s.errNameRequired),
    email: z.string().email(s.errEmailInvalid),
    phoneNumber: z
      .string()
      .regex(/^\+\d{7,15}$/, s.errPhoneInvalid),
    password: z
      .string()
      .min(8,  s.errPasswordMin)
      .max(15, s.errPasswordMax)
      .regex(/[A-Z]/, s.errPasswordUppercase)
      .regex(/[a-z]/, s.errPasswordLowercase)
      .regex(/[^A-Za-z0-9]/, s.errPasswordSpecial),
    confirmPassword: z.string(),
  }).refine((d) => d.password === d.confirmPassword, {
    message: s.errPasswordMismatch,
    path: ["confirmPassword"],
  });
  type FormData = z.infer<typeof schema>;

  const [showPwd, setShowPwd]         = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading]         = useState(false);
  const [apiError, setApiError]       = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: { phoneNumber: "+243" },
  });

  async function onSubmit(data: FormData) {
    setLoading(true);
    setApiError(null);
    try {
      const result = await registerAgent({
        name:        data.name,
        email:       data.email,
        phoneNumber: data.phoneNumber,
        password:    data.password,
      });
      setSignup(result.access_token, result.agent.name, result.agent.email, data.phoneNumber);
      router.push("/(auth)/agent-verification");
    } catch (e: any) {
      const status = e?.response?.status;
      const msg    = e?.response?.data?.message;
      if (status === 409) {
        setApiError(
          typeof msg === "string" && msg.toLowerCase().includes("email")
            ? s.errEmailTaken
            : s.errPhoneTaken,
        );
      } else {
        setApiError(s.errGeneric);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: pageBg }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 24}
      >
        <ScrollView
          contentContainerStyle={{ paddingBottom: 48 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          automaticallyAdjustKeyboardInsets
        >
          <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 24, paddingBottom: 40 }}>

            {/* Back */}
            <TouchableOpacity
              onPress={() => router.back()}
              style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 28 }}
            >
              <ArrowLeft size={16} color={iconC} />
              <Text style={{ color: iconC, fontSize: 13, fontFamily: "DMSans_500Medium" }}>
                {t.common.back}
              </Text>
            </TouchableOpacity>

            {/* Header */}
            <View style={{ alignItems: "center", marginBottom: 32 }}>
              <View style={{
                width: 72, height: 72, borderRadius: 20,
                backgroundColor: Colors.navy,
                alignItems: "center", justifyContent: "center",
                marginBottom: 14,
                shadowColor: Colors.navy,
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.3,
                shadowRadius: 12,
                elevation: 6,
              }}>
                <UserCheck size={32} color={Colors.secondary} strokeWidth={1.8} />
              </View>
              <Text style={{ color: textMain, fontSize: 22, fontFamily: "DMSans_700Bold", marginBottom: 4, textAlign: "center" }}>
                {s.registerTitle}
              </Text>
              <Text style={{ color: textMut, fontSize: 13, textAlign: "center", lineHeight: 20 }}>
                {s.registerTagline}
              </Text>
            </View>

            {/* Card */}
            <View style={{
              backgroundColor: cardBg,
              borderRadius: 20, padding: 24,
              borderWidth: 1, borderColor: borderC,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: isDark ? 0.25 : 0.06,
              shadowRadius: 8,
              elevation: 2,
            }}>
              <Text style={{ color: textMut, fontSize: 12, textAlign: "center", marginBottom: 20 }}>
                {s.registerSubtitle}
              </Text>

              {apiError && (
                <View style={{
                  backgroundColor: errBg, borderWidth: 1, borderColor: errBorder,
                  borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 16,
                }}>
                  <Text style={{ color: isDark ? Colors.dark.destructive : Colors.destructive, fontSize: 13 }}>
                    {apiError}
                  </Text>
                </View>
              )}

              {/* Full name */}
              <Controller
                control={control}
                name="name"
                render={({ field: { value, onChange, onBlur } }) => (
                  <Input
                    label={s.labelFullName}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.name?.message}
                    autoCapitalize="words"
                  />
                )}
              />

              {/* Email */}
              <Controller
                control={control}
                name="email"
                render={({ field: { value, onChange, onBlur } }) => (
                  <Input
                    label={s.labelEmail}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.email?.message}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                  />
                )}
              />

              {/* Phone with country picker */}
              <Controller
                control={control}
                name="phoneNumber"
                render={({ field: { value, onChange, onBlur } }) => (
                  <PhoneInput
                    label={s.labelPhone}
                    value={value ?? ""}
                    onChange={onChange}
                    onBlur={onBlur}
                    error={errors.phoneNumber?.message}
                    locked
                  />
                )}
              />

              {/* Password */}
              <Controller
                control={control}
                name="password"
                render={({ field: { value, onChange, onBlur } }) => (
                  <View>
                    <Input
                      label={s.labelPassword}
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      error={errors.password?.message}
                      secureTextEntry={!showPwd}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPwd(v => !v)}
                      style={{ position: "absolute", right: 14, top: 34 }}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      {showPwd ? <EyeOff size={18} color={textMut} /> : <Eye size={18} color={textMut} />}
                    </TouchableOpacity>
                  </View>
                )}
              />

              {/* Confirm password */}
              <Controller
                control={control}
                name="confirmPassword"
                render={({ field: { value, onChange, onBlur } }) => (
                  <View>
                    <Input
                      label={s.labelConfirmPassword}
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      error={errors.confirmPassword?.message}
                      secureTextEntry={!showConfirm}
                    />
                    <TouchableOpacity
                      onPress={() => setShowConfirm(v => !v)}
                      style={{ position: "absolute", right: 14, top: 34 }}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      {showConfirm ? <EyeOff size={18} color={textMut} /> : <Eye size={18} color={textMut} />}
                    </TouchableOpacity>
                  </View>
                )}
              />

              <View style={{ height: 8 }} />

              <Button
                onPress={handleSubmit(onSubmit)}
                loading={loading}
                size="lg"
                disabled={!isValid}
              >
                {loading ? s.creatingAccountBtn : s.createAccountBtn}
              </Button>
            </View>

            {/* Footer links */}
            <View style={{ alignItems: "center", marginTop: 24, gap: 10 }}>
              <View style={{ flexDirection: "row", gap: 4 }}>
                <Text style={{ color: textMut, fontSize: 13 }}>{s.alreadyHaveAccount}</Text>
                <TouchableOpacity onPress={() => router.push("/(auth)/agent-connexion")}>
                  <Text style={{ color: iconC, fontSize: 13, fontFamily: "DMSans_600SemiBold" }}>{s.signIn}</Text>
                </TouchableOpacity>
              </View>
              <View style={{ flexDirection: "row", gap: 4 }}>
                <Text style={{ color: textMut, fontSize: 13 }}>{s.isBuyerOrTenant}</Text>
                <TouchableOpacity onPress={() => router.push("/(auth)/inscription")}>
                  <Text style={{ color: iconC, fontSize: 13, fontFamily: "DMSans_600SemiBold" }}>{s.createUserAccount}</Text>
                </TouchableOpacity>
              </View>
            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
