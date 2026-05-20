import React, { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { forgotPassword } from "../../src/services/auth";
import Input from "../../src/components/ui/Input";
import Button from "../../src/components/ui/Button";
import { Colors } from "../../src/constants/colors";
import { CheckCircle, ArrowLeft } from "lucide-react-native";

const schema = z.object({
  email: z.string().email("Email invalide"),
});
type FormData = z.infer<typeof schema>;

export default function ForgotPasswordScreen() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View className="px-6 pt-6 pb-8">
          <TouchableOpacity onPress={() => router.back()} className="flex-row items-center gap-2 mb-8">
            <ArrowLeft size={20} color={Colors.primary} />
            <Text className="text-primary">Retour</Text>
          </TouchableOpacity>

          {success ? (
            <View className="flex-1 items-center justify-center pt-12">
              <CheckCircle size={56} color="#22c55e" />
              <Text className="text-text-dark text-xl font-sans-bold mt-4 text-center">Email envoyé</Text>
              <Text className="text-muted-fg text-sm text-center mt-2 mb-8">
                Vérifiez votre boîte mail et suivez les instructions pour réinitialiser votre mot de passe.
              </Text>
              <Button onPress={() => router.push("/(auth)/connexion")} style={{ width: "100%" }}>
                Retour à la connexion
              </Button>
            </View>
          ) : (
            <>
              <Text className="text-text-dark text-2xl font-sans-bold mb-2">Mot de passe oublié</Text>
              <Text className="text-muted-fg text-sm mb-8">
                Entrez votre email et nous vous enverrons un lien de réinitialisation.
              </Text>

              {error && (
                <View className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
                  <Text className="text-destructive text-sm">{error}</Text>
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

              <Button onPress={handleSubmit(onSubmit)} loading={loading} size="lg" style={{ marginTop: 8 }}>
                Envoyer le lien
              </Button>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
