import React, { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { registerUser, getMe } from "../../src/services/auth";
import { useAuthStore } from "../../src/store/useAuthStore";
import { useThemeStore } from "../../src/store/useThemeStore";
import Input from "../../src/components/ui/Input";
import Button from "../../src/components/ui/Button";
import { Colors } from "../../src/constants/colors";
import { Eye, EyeOff, CheckSquare, Square, Home } from "lucide-react-native";
import { useT } from "../../src/i18n/useT";

export default function InscriptionScreen() {
  const t = useT();
  const { setAuth } = useAuthStore();
  const { theme } = useThemeStore();
  const isDark = theme === "dark";

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

  const pageBg   = isDark ? Colors.dark.background : Colors.backgroundAlt;
  const cardBg   = isDark ? Colors.dark.card       : Colors.white;
  const textMain = isDark ? Colors.dark.foreground  : Colors.foreground;
  const textMut  = isDark ? Colors.dark.mutedFg     : Colors.mutedFg;
  const borderC  = isDark ? Colors.dark.border      : Colors.border;
  const iconC    = isDark ? Colors.dark.primary     : Colors.primary;
  const errBg    = isDark ? "rgba(224,85,85,0.12)"  : "#FEF2F2";
  const errBorder= isDark ? Colors.dark.destructive : "#FECACA";

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm,  setShowConfirm]  = useState(false);
  const [acceptCGU,    setAcceptCGU]    = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState<string | null>(null);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: FormData) {
    if (!acceptCGU) { setError(t.auth.acceptCGU); return; }
    setLoading(true);
    setError(null);
    try {
      const { access_token } = await registerUser({
        firstName: data.firstName, lastName: data.lastName,
        email: data.email, phoneNumber: data.phoneNumber, password: data.password,
      });
      const user = await getMe(access_token);
      setAuth(access_token, user);
      router.replace("/(tabs)/compte");
    } catch (e: any) {
      setError(e?.response?.data?.message ?? t.common.errorGeneric);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: pageBg }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View style={{ paddingHorizontal: 24, paddingTop: 40, paddingBottom: 32 }}>

          <TouchableOpacity
            onPress={() => router.replace("/(tabs)")}
            style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 28 }}
          >
            <Home size={16} color={iconC} />
            <Text style={{ color: iconC, fontSize: 13, fontFamily: "DMSans_500Medium" }}>
              {t.auth.backToHome}
            </Text>
          </TouchableOpacity>

          <View style={{ alignItems: "center", marginBottom: 32 }}>
            <View style={{
              width: 64, height: 64, borderRadius: 18,
              backgroundColor: Colors.navy, alignItems: "center", justifyContent: "center",
              marginBottom: 12, shadowColor: Colors.navy,
              shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5,
            }}>
              <Home size={28} color={Colors.secondary} strokeWidth={1.8} />
            </View>
            <Text style={{ color: textMain, fontSize: 22, fontFamily: "DMSans_700Bold" }}>
              {t.auth.createAccountTitle}
            </Text>
          </View>

          <View style={{
            backgroundColor: cardBg, borderRadius: 20, padding: 24,
            borderWidth: 1, borderColor: borderC,
            shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
            shadowOpacity: isDark ? 0.25 : 0.06, shadowRadius: 8, elevation: 2,
          }}>
            {error && (
              <View style={{ backgroundColor: errBg, borderWidth: 1, borderColor: errBorder, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 16 }}>
                <Text style={{ color: isDark ? Colors.dark.destructive : Colors.destructive, fontSize: 13 }}>{error}</Text>
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
                {showPassword ? <EyeOff size={18} color={textMut} /> : <Eye size={18} color={textMut} />}
              </TouchableOpacity>
            </View>

            <View>
              <Controller control={control} name="confirmPassword" render={({ field: { value, onChange, onBlur } }) => (
                <Input label={t.auth.confirmPassword} value={value} onChangeText={onChange} onBlur={onBlur} error={errors.confirmPassword?.message} secureTextEntry={!showConfirm} />
              )} />
              <TouchableOpacity onPress={() => setShowConfirm(v => !v)} style={{ position: "absolute", right: 14, top: 34 }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                {showConfirm ? <EyeOff size={18} color={textMut} /> : <Eye size={18} color={textMut} />}
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={() => setAcceptCGU(v => !v)} style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 20 }}>
              {acceptCGU
                ? <CheckSquare size={20} color={iconC} />
                : <Square      size={20} color={textMut} />}
              <Text style={{ color: textMut, fontSize: 13, flex: 1 }}>
                {t.auth.acceptCGU}
              </Text>
            </TouchableOpacity>

            <Button onPress={handleSubmit(onSubmit)} loading={loading} size="lg">
              {t.auth.createMyAccount}
            </Button>
          </View>

          <View style={{ flexDirection: "row", justifyContent: "center", gap: 4, marginTop: 24 }}>
            <Text style={{ color: textMut, fontSize: 14 }}>{t.auth.alreadyRegistered}</Text>
            <TouchableOpacity onPress={() => router.push("/(auth)/connexion")}>
              <Text style={{ color: iconC, fontSize: 14, fontFamily: "DMSans_600SemiBold" }}>{t.auth.login}</Text>
            </TouchableOpacity>
          </View>

        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
