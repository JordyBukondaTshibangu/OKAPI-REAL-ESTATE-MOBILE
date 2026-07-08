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
import { loginAgent, getAgentMe } from "../../src/services/agentAuth";
import { useAgentSessionStore } from "../../src/store/useAgentSessionStore";
import { useThemeStore } from "../../src/store/useThemeStore";
import Input from "../../src/components/ui/Input";
import Button from "../../src/components/ui/Button";
import { Colors } from "../../src/constants/colors";
import { Eye, EyeOff, ArrowLeft, UserCheck } from "lucide-react-native";
import { useT } from "../../src/i18n/useT";

export default function AgentConnexionScreen() {
  const t = useT();
  const { setSession } = useAgentSessionStore();
  const { theme } = useThemeStore();
  const isDark = theme === "dark";

  const schema = z.object({
    identifier: z.string().min(3, t.agentAuth.identifierRequired ?? "Identifiant requis"),
    password:   z.string().min(1, t.auth.password),
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: FormData) {
    setLoading(true);
    setError(null);
    try {
      const { access_token } = await loginAgent(data.identifier, data.password);
      const agent = await getAgentMe(access_token);
      setSession(access_token, agent);
      router.replace("/(tabs)/compte");
    } catch (e: any) {
      const msg = e?.response?.data?.message;
      setError(Array.isArray(msg) ? msg[0] : msg ?? t.agentAuth.invalidCredentials);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: pageBg }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 24, paddingBottom: 32 }}>

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
            <View style={{ alignItems: "center", marginBottom: 36 }}>
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
              <Text style={{ color: textMain, fontSize: 22, fontFamily: "DMSans_700Bold", marginBottom: 4 }}>
                {t.agentAuth.title}
              </Text>
              <Text style={{ color: textMut, fontSize: 14, textAlign: "center" }}>
                {t.agentAuth.subtitle}
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
              {error && (
                <View style={{
                  backgroundColor: errBg, borderWidth: 1, borderColor: errBorder,
                  borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 16,
                }}>
                  <Text style={{ color: isDark ? Colors.dark.destructive : Colors.destructive, fontSize: 13 }}>
                    {error}
                  </Text>
                </View>
              )}

              <Controller
                control={control}
                name="identifier"
                render={({ field: { value, onChange, onBlur } }) => (
                  <Input
                    label={t.agentAuth.identifierLabel ?? "E-mail ou téléphone"}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.identifier?.message}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                  />
                )}
              />

              <Controller
                control={control}
                name="password"
                render={({ field: { value, onChange, onBlur } }) => (
                  <View>
                    <Input
                      label={t.auth.password}
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      error={errors.password?.message}
                      secureTextEntry={!showPassword}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(v => !v)}
                      style={{ position: "absolute", right: 14, top: 34 }}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      {showPassword
                        ? <EyeOff size={18} color={textMut} />
                        : <Eye    size={18} color={textMut} />}
                    </TouchableOpacity>
                  </View>
                )}
              />

              <View style={{ height: 8 }} />

              <Button onPress={handleSubmit(onSubmit)} loading={loading} size="lg">
                {loading ? t.agentAuth.loggingIn : t.agentAuth.loginBtn}
              </Button>
            </View>

            {/* Footer */}
            <View style={{ alignItems: "center", marginTop: 24, gap: 8 }}>
              <Text style={{ color: textMut, fontSize: 13 }}>
                {t.agentAuth.notAgent}
              </Text>
              <TouchableOpacity onPress={() => router.push("/(auth)/devenir-agent" as any)}>
                <Text style={{ color: iconC, fontSize: 14, fontFamily: "DMSans_600SemiBold" }}>
                  {t.agentAuth.becomeAgent}
                </Text>
              </TouchableOpacity>
            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
