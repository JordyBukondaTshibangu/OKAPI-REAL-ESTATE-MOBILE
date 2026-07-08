import React, { useEffect, useRef, useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  ActivityIndicator, KeyboardAvoidingView, Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { verifyAgentEmail, resendAgentVerification } from "../../src/services/agentAuth";
import { useAgentSignupStore } from "../../src/store/useAgentSignupStore";
import { useThemeStore } from "../../src/store/useThemeStore";
import { Colors } from "../../src/constants/colors";
import { ArrowLeft, Mail } from "lucide-react-native";
import { useT } from "../../src/i18n/useT";
import Button from "../../src/components/ui/Button";

const CODE_LENGTH = 6;

export default function AgentVerificationScreen() {
  const t = useT();
  const s = t.agentSignup;
  const { token, agentEmail, clear } = useAgentSignupStore();
  const { theme } = useThemeStore();
  const isDark = theme === "dark";

  const pageBg    = isDark ? Colors.dark.background : Colors.backgroundAlt;
  const cardBg    = isDark ? Colors.dark.card       : Colors.white;
  const textMain  = isDark ? Colors.dark.foreground  : Colors.foreground;
  const textMut   = isDark ? Colors.dark.mutedFg     : Colors.mutedFg;
  const borderC   = isDark ? Colors.dark.border      : Colors.border;
  const iconC     = isDark ? Colors.dark.primary     : Colors.primary;
  const inputBg   = isDark ? Colors.dark.muted       : Colors.backgroundAlt;
  const errBg     = isDark ? "rgba(224,85,85,0.12)"  : "#FEF2F2";
  const errBorder = isDark ? Colors.dark.destructive : "#FECACA";

  const [codes, setCodes]               = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const [error, setError]               = useState<string | null>(null);
  const [submitting, setSubmitting]     = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resending, setResending]       = useState(false);
  const inputRefs = useRef<(TextInput | null)[]>(Array(CODE_LENGTH).fill(null));

  // Redirect back if no token (e.g. user navigated here directly)
  useEffect(() => {
    if (!token) router.replace("/(auth)/devenir-agent");
  }, [token]);

  // Cooldown countdown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  function handleChange(idx: number, val: string) {
    const digit = val.replace(/\D/g, "").slice(-1);
    const next = [...codes];
    next[idx] = digit;
    setCodes(next);
    if (digit && idx < CODE_LENGTH - 1) {
      inputRefs.current[idx + 1]?.focus();
    }
  }

  function handleKeyPress(idx: number, key: string) {
    if (key === "Backspace" && !codes[idx] && idx > 0) {
      const next = [...codes];
      next[idx - 1] = "";
      setCodes(next);
      inputRefs.current[idx - 1]?.focus();
    }
  }

  async function handleVerify() {
    if (!token) return;
    const code = codes.join("");
    if (code.length < CODE_LENGTH) { setError(s.verifyCodeRequired); return; }
    setError(null);
    setSubmitting(true);
    try {
      await verifyAgentEmail(token, code);
      clear();
      router.replace("/(auth)/agent-en-attente");
    } catch (e: any) {
      const msg = e?.response?.data?.message;
      setError(typeof msg === "string" ? msg : s.verifyError);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResend() {
    if (!token || resendCooldown > 0 || resending) return;
    setResending(true);
    try {
      await resendAgentVerification(token);
      setResendCooldown(60);
    } catch {
      setError(s.resendError);
    } finally {
      setResending(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: pageBg }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
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
                <Mail size={32} color={Colors.secondary} strokeWidth={1.8} />
              </View>
              <Text style={{ color: textMain, fontSize: 22, fontFamily: "DMSans_700Bold", marginBottom: 8, textAlign: "center" }}>
                {s.verifyTitle}
              </Text>
              <Text style={{ color: textMut, fontSize: 13, textAlign: "center", lineHeight: 20 }}>
                {s.verifySentTo}{"\n"}
                <Text style={{ color: textMain, fontFamily: "DMSans_600SemiBold" }}>
                  {agentEmail || s.verifyEmailFallback}
                </Text>
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
                  borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 20,
                }}>
                  <Text style={{ color: isDark ? Colors.dark.destructive : Colors.destructive, fontSize: 13 }}>
                    {error}
                  </Text>
                </View>
              )}

              {/* OTP boxes */}
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 28 }}>
                {codes.map((digit, idx) => (
                  <TextInput
                    key={idx}
                    ref={(r) => { inputRefs.current[idx] = r; }}
                    value={digit}
                    onChangeText={(v) => handleChange(idx, v)}
                    onKeyPress={({ nativeEvent }) => handleKeyPress(idx, nativeEvent.key)}
                    keyboardType="number-pad"
                    maxLength={1}
                    style={{
                      width: 44, height: 54,
                      backgroundColor: digit ? (isDark ? Colors.dark.accent : Colors.accent) : inputBg,
                      borderWidth: 1.5,
                      borderColor: digit ? iconC : borderC,
                      borderRadius: 12,
                      textAlign: "center",
                      fontSize: 22,
                      fontFamily: "DMSans_700Bold",
                      color: textMain,
                    }}
                  />
                ))}
              </View>

              <Button
                onPress={handleVerify}
                loading={submitting}
                size="lg"
              >
                {submitting ? s.verifyingBtn : s.verifyBtn}
              </Button>
            </View>

            {/* Resend */}
            <View style={{ alignItems: "center", marginTop: 28, gap: 8 }}>
              <Text style={{ color: textMut, fontSize: 13 }}>{s.resendPrompt}</Text>
              {resendCooldown > 0 ? (
                <Text style={{ color: textMut, fontSize: 13, fontFamily: "DMSans_500Medium" }}>
                  {s.resendCooldown.replace("{n}", String(resendCooldown))}
                </Text>
              ) : (
                <TouchableOpacity onPress={handleResend} disabled={resending}>
                  {resending
                    ? <ActivityIndicator size="small" color={iconC} />
                    : <Text style={{ color: iconC, fontSize: 13, fontFamily: "DMSans_600SemiBold" }}>{s.resendBtn}</Text>
                  }
                </TouchableOpacity>
              )}

              <View style={{ marginTop: 8, flexDirection: "row", gap: 4 }}>
                <Text style={{ color: textMut, fontSize: 13 }}>{s.wrongAddress}</Text>
                <TouchableOpacity onPress={() => { clear(); router.replace("/(auth)/devenir-agent"); }}>
                  <Text style={{ color: iconC, fontSize: 13, fontFamily: "DMSans_600SemiBold" }}>{s.restart}</Text>
                </TouchableOpacity>
              </View>
            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
