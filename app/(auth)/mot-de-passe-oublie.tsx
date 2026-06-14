import React, { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { forgotPassword } from "../../src/services/auth";
import { useThemeStore } from "../../src/store/useThemeStore";
import Input from "../../src/components/ui/Input";
import Button from "../../src/components/ui/Button";
import { Colors } from "../../src/constants/colors";
import { CheckCircle, ArrowLeft } from "lucide-react-native";

const schema = z.object({ email: z.string().email("Email invalide") });
type FormData = z.infer<typeof schema>;

export default function ForgotPasswordScreen() {
  const { theme } = useThemeStore();
  const isDark = theme === "dark";

  const pageBg   = isDark ? Colors.dark.background : Colors.backgroundAlt;
  const cardBg   = isDark ? Colors.dark.card       : Colors.white;
  const textMain = isDark ? Colors.dark.foreground  : Colors.foreground;
  const textMut  = isDark ? Colors.dark.mutedFg     : Colors.mutedFg;
  const borderC  = isDark ? Colors.dark.border      : Colors.border;
  const iconC    = isDark ? Colors.dark.primary     : Colors.primary;
  const errBg    = isDark ? "rgba(224,85,85,0.12)"  : "#FEF2F2";
  const errBord  = isDark ? Colors.dark.destructive : "#FECACA";

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: FormData) {
    setLoading(true);
    setError(null);
    try {
      await forgotPassword(data.email);
      setSuccess(true);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: pageBg }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View style={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 32 }}>

          <TouchableOpacity onPress={() => router.back()} style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 32 }}>
            <ArrowLeft size={20} color={iconC} />
            <Text style={{ color: iconC, fontSize: 14, fontFamily: "DMSans_500Medium" }}>Retour</Text>
          </TouchableOpacity>

          {success ? (
            <View style={{ alignItems: "center", paddingTop: 48 }}>
              <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: isDark ? "rgba(34,197,94,0.15)" : "#f0fdf4", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
                <CheckCircle size={44} color="#22c55e" />
              </View>
              <Text style={{ color: textMain, fontSize: 22, fontFamily: "DMSans_700Bold", marginBottom: 10 }}>
                Email envoyé
              </Text>
              <Text style={{ color: textMut, fontSize: 14, textAlign: "center", lineHeight: 22, marginBottom: 32, maxWidth: 280 }}>
                Vérifiez votre boîte mail et suivez les instructions pour réinitialiser votre mot de passe.
              </Text>
              <Button onPress={() => router.push("/(auth)/connexion")} style={{ width: "100%" }}>
                Retour à la connexion
              </Button>
            </View>
          ) : (
            <>
              <Text style={{ color: textMain, fontSize: 26, fontFamily: "DMSans_700Bold", marginBottom: 8 }}>
                Mot de passe oublié
              </Text>
              <Text style={{ color: textMut, fontSize: 14, marginBottom: 28, lineHeight: 20 }}>
                Entrez votre email et nous vous enverrons un lien de réinitialisation.
              </Text>

              <View style={{ backgroundColor: cardBg, borderRadius: 20, padding: 24, borderWidth: 1, borderColor: borderC }}>
                {error && (
                  <View style={{ backgroundColor: errBg, borderWidth: 1, borderColor: errBord, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 16 }}>
                    <Text style={{ color: isDark ? Colors.dark.destructive : Colors.destructive, fontSize: 13 }}>{error}</Text>
                  </View>
                )}

                <Controller
                  control={control}
                  name="email"
                  render={({ field: { value, onChange, onBlur } }) => (
                    <Input
                      label="Email"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      error={errors.email?.message}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  )}
                />

                <Button onPress={handleSubmit(onSubmit)} loading={loading} size="lg" style={{ marginTop: 4 }}>
                  Envoyer le lien
                </Button>
              </View>
            </>
          )}
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
