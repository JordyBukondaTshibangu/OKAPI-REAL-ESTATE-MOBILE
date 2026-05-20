import React, { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { registerUser, getMe } from "../../src/services/auth";
import { useAuthStore } from "../../src/store/useAuthStore";
import Input from "../../src/components/ui/Input";
import Button from "../../src/components/ui/Button";
import { Colors } from "../../src/constants/colors";
import { Eye, EyeOff, CheckSquare, Square } from "lucide-react-native";

const schema = z.object({
  firstName: z.string().min(1, "Prénom requis"),
  lastName: z.string().min(1, "Nom requis"),
  email: z.string().email("Email invalide"),
  phoneNumber: z.string().min(1, "Téléphone requis"),
  password: z.string().min(8, "8 caractères minimum"),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, { message: "Les mots de passe ne correspondent pas", path: ["confirmPassword"] });

type FormData = z.infer<typeof schema>;

export default function InscriptionScreen() {
  const { setAuth } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [acceptCGU, setAcceptCGU] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: FormData) {
    if (!acceptCGU) {
      setError("Veuillez accepter les conditions d'utilisation.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { access_token } = await registerUser({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phoneNumber: data.phoneNumber,
        password: data.password,
      });
      const user = await getMe(access_token);
      setAuth(access_token, user);
      router.replace("/(tabs)/compte");
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "Erreur lors de l'inscription. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View className="px-6 pt-10 pb-8">
          <View className="items-center mb-8">
            <View className="w-14 h-14 rounded-2xl bg-navy items-center justify-center mb-3">
              <Text className="text-secondary text-xl font-sans-bold">O</Text>
            </View>
            <Text className="text-text-dark text-2xl font-sans-bold">Créer un compte</Text>
          </View>

          {error && (
            <View className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
              <Text className="text-destructive text-sm">{error}</Text>
            </View>
          )}

          <View className="flex-row gap-3">
            <View className="flex-1">
              <Controller
                control={control}
                name="firstName"
                render={({ field: { value, onChange, onBlur } }) => (
                  <Input label="Prénom" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.firstName?.message} />
                )}
              />
            </View>
            <View className="flex-1">
              <Controller
                control={control}
                name="lastName"
                render={({ field: { value, onChange, onBlur } }) => (
                  <Input label="Nom" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.lastName?.message} />
                )}
              />
            </View>
          </View>

          <Controller
            control={control}
            name="email"
            render={({ field: { value, onChange, onBlur } }) => (
              <Input label="Email" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.email?.message} keyboardType="email-address" autoCapitalize="none" />
            )}
          />

          <Controller
            control={control}
            name="phoneNumber"
            render={({ field: { value, onChange, onBlur } }) => (
              <Input label="Téléphone" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.phoneNumber?.message} keyboardType="phone-pad" />
            )}
          />

          <View>
            <Controller
              control={control}
              name="password"
              render={({ field: { value, onChange, onBlur } }) => (
                <Input label="Mot de passe" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.password?.message} secureTextEntry={!showPassword} />
              )}
            />
            <TouchableOpacity onPress={() => setShowPassword(v => !v)} style={{ position: "absolute", right: 12, top: 32 }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              {showPassword ? <EyeOff size={18} color={Colors.mutedFg} /> : <Eye size={18} color={Colors.mutedFg} />}
            </TouchableOpacity>
          </View>

          <View>
            <Controller
              control={control}
              name="confirmPassword"
              render={({ field: { value, onChange, onBlur } }) => (
                <Input label="Confirmer le mot de passe" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.confirmPassword?.message} secureTextEntry={!showConfirm} />
              )}
            />
            <TouchableOpacity onPress={() => setShowConfirm(v => !v)} style={{ position: "absolute", right: 12, top: 32 }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              {showConfirm ? <EyeOff size={18} color={Colors.mutedFg} /> : <Eye size={18} color={Colors.mutedFg} />}
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={() => setAcceptCGU(v => !v)} className="flex-row items-center gap-3 mb-6">
            {acceptCGU ? <CheckSquare size={20} color={Colors.primary} /> : <Square size={20} color={Colors.mutedFg} />}
            <Text className="text-muted-fg text-sm flex-1">J'accepte les conditions générales d'utilisation</Text>
          </TouchableOpacity>

          <Button onPress={handleSubmit(onSubmit)} loading={loading} size="lg" style={{ marginBottom: 16 }}>
            Créer mon compte
          </Button>

          <View className="flex-row justify-center gap-1">
            <Text className="text-muted-fg text-sm">Déjà inscrit ?</Text>
            <TouchableOpacity onPress={() => router.push("/(auth)/connexion")}>
              <Text className="text-primary text-sm font-sans-medium">Se connecter</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
