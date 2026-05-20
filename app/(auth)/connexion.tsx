import React, { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { loginUser, getMe } from "../../src/services/auth";
import { useAuthStore } from "../../src/store/useAuthStore";
import Input from "../../src/components/ui/Input";
import Button from "../../src/components/ui/Button";
import { Colors } from "../../src/constants/colors";
import { Eye, EyeOff } from "lucide-react-native";

const schema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(1, "Mot de passe requis"),
});
type FormData = z.infer<typeof schema>;

export default function ConnexionScreen() {
  const { setAuth } = useAuthStore();
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
      const { access_token } = await loginUser(data.email, data.password);
      const user = await getMe(access_token);
      setAuth(access_token, user);
      router.replace("/(tabs)/compte");
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "Identifiants incorrects. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View className="flex-1 px-6 pt-12 pb-8">
          {/* Logo placeholder */}
          <View className="items-center mb-10">
            <View className="w-16 h-16 rounded-2xl bg-navy items-center justify-center mb-3">
              <Text className="text-secondary text-2xl font-sans-bold">O</Text>
            </View>
            <Text className="text-text-dark text-2xl font-sans-bold">Okapi Real Estate</Text>
            <Text className="text-muted-fg text-sm mt-1">Connectez-vous à votre compte</Text>
          </View>

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
                  label="Mot de passe"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.password?.message}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(v => !v)}
                  style={{ position: "absolute", right: 12, top: 32 }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  {showPassword ? <EyeOff size={18} color={Colors.mutedFg} /> : <Eye size={18} color={Colors.mutedFg} />}
                </TouchableOpacity>
              </View>
            )}
          />

          <TouchableOpacity
            onPress={() => router.push("/(auth)/mot-de-passe-oublie")}
            className="mb-6 self-end"
          >
            <Text className="text-primary text-sm">Mot de passe oublié ?</Text>
          </TouchableOpacity>

          <Button onPress={handleSubmit(onSubmit)} loading={loading} size="lg" style={{ marginBottom: 16 }}>
            Se connecter
          </Button>

          <View className="flex-row justify-center gap-1">
            <Text className="text-muted-fg text-sm">Pas encore de compte ?</Text>
            <TouchableOpacity onPress={() => router.push("/(auth)/inscription")}>
              <Text className="text-primary text-sm font-sans-medium">S'inscrire</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
