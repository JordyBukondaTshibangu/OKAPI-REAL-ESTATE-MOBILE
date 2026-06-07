import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert } from "react-native";
import { router } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import * as ImagePicker from "expo-image-picker";
import { updateMe, changePassword, uploadAvatar, removeAvatar, deleteAccount } from "../../../src/services/auth";
import { useAuthStore } from "../../../src/store/useAuthStore";
import { useThemeStore } from "../../../src/store/useThemeStore";
import { useAuthGuard } from "../../../src/hooks/useAuthGuard";
import Input from "../../../src/components/ui/Input";
import Button from "../../../src/components/ui/Button";
import Avatar from "../../../src/components/ui/Avatar";
import { Colors } from "../../../src/constants/colors";
import { Camera, Trash2 } from "lucide-react-native";
import { API_URL } from "../../../src/constants/api";

const profileSchema = z.object({
  firstName: z.string().min(1, "Prénom requis"),
  lastName: z.string().min(1, "Nom requis"),
  email: z.string().email("Email invalide"),
  phoneNumber: z.string().min(1, "Téléphone requis"),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Mot de passe actuel requis"),
  newPassword: z.string().min(8, "8 caractères minimum"),
  confirmPassword: z.string(),
}).refine(d => d.newPassword === d.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

type ProfileForm = z.infer<typeof profileSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

export default function ProfilScreen() {
  const isAuth = useAuthGuard();
  const { token, user, setUser, logout } = useAuthStore();
  const { theme } = useThemeStore();
  const isDark = theme === "dark";

  const pageBg  = isDark ? Colors.dark.background : Colors.backgroundAlt;
  const cardBg  = isDark ? Colors.dark.card : Colors.white;
  const textMain= isDark ? Colors.dark.foreground : Colors.textDark;
  const textMut = isDark ? Colors.dark.mutedFg : Colors.mutedFg;
  const borderC = isDark ? Colors.dark.border : Colors.border;

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName ?? "",
      lastName: user?.lastName ?? "",
      email: user?.email ?? "",
      phoneNumber: user?.phoneNumber ?? "",
    },
  });

  const passwordForm = useForm<PasswordForm>({ resolver: zodResolver(passwordSchema) });

  if (!isAuth || !user) return null;

  const photoUri = user.profileImage
    ? user.profileImage.startsWith("http") ? user.profileImage : `${API_URL}/${user.profileImage}`
    : null;

  async function handlePickAvatar() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [1, 1], quality: 0.8,
    });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    setUploadingAvatar(true);
    try {
      const updated = await uploadAvatar(token!, asset.uri, asset.fileName ?? "avatar.jpg", asset.mimeType ?? "image/jpeg");
      setUser(updated);
    } catch { Alert.alert("Erreur", "Impossible de mettre à jour la photo de profil."); }
    finally { setUploadingAvatar(false); }
  }

  async function handleRemoveAvatar() {
    Alert.alert("Supprimer", "Supprimer votre photo de profil ?", [
      { text: "Annuler", style: "cancel" },
      { text: "Supprimer", style: "destructive", onPress: async () => {
        try { const updated = await removeAvatar(token!); setUser(updated); }
        catch { Alert.alert("Erreur", "Impossible de supprimer la photo."); }
      }},
    ]);
  }

  async function onSaveProfile(data: ProfileForm) {
    setSavingProfile(true);
    try { const updated = await updateMe(token!, data); setUser(updated); Alert.alert("Succès", "Profil mis à jour."); }
    catch { Alert.alert("Erreur", "Impossible de mettre à jour le profil."); }
    finally { setSavingProfile(false); }
  }

  async function onSavePassword(data: PasswordForm) {
    setSavingPassword(true);
    try {
      await changePassword(token!, { currentPassword: data.currentPassword, newPassword: data.newPassword });
      passwordForm.reset();
      Alert.alert("Succès", "Mot de passe modifié.");
    } catch { Alert.alert("Erreur", "Impossible de modifier le mot de passe."); }
    finally { setSavingPassword(false); }
  }

  function handleDeleteAccount() {
    Alert.alert("Supprimer le compte", "Cette action est irréversible.", [
      { text: "Annuler", style: "cancel" },
      { text: "Supprimer définitivement", style: "destructive", onPress: async () => {
        try { await deleteAccount(token!); logout(); router.replace("/(tabs)"); }
        catch { Alert.alert("Erreur", "Impossible de supprimer le compte."); }
      }},
    ]);
  }

  const section = { backgroundColor: cardBg, paddingHorizontal: 20, paddingVertical: 20, marginBottom: 10 };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: pageBg }}
      contentContainerStyle={{ paddingBottom: 40 }}
      keyboardShouldPersistTaps="handled"
    >
      {/* Avatar */}
      <View style={{ ...section, alignItems: "center" }}>
        <View style={{ position: "relative" }}>
          <Avatar name={`${user.firstName} ${user.lastName}`} photo={photoUri} size={88} />
          <TouchableOpacity
            onPress={handlePickAvatar}
            disabled={uploadingAvatar}
            style={{ position: "absolute", bottom: 0, right: 0, backgroundColor: Colors.primary, borderRadius: 14, padding: 6 }}
          >
            <Camera size={14} color="#fff" />
          </TouchableOpacity>
        </View>
        {user.profileImage && (
          <TouchableOpacity onPress={handleRemoveAvatar} style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 10 }}>
            <Trash2 size={13} color={isDark ? Colors.dark.destructive : Colors.destructive} />
            <Text style={{ color: isDark ? Colors.dark.destructive : Colors.destructive, fontSize: 12 }}>Supprimer la photo</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Personal info */}
      <View style={section}>
        <Text style={{ color: textMain, fontSize: 16, fontFamily: "DMSans_700Bold", marginBottom: 16 }}>
          Informations personnelles
        </Text>
        <View style={{ flexDirection: "row", gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Controller control={profileForm.control} name="firstName" render={({ field: { value, onChange, onBlur } }) => (
              <Input label="Prénom" value={value} onChangeText={onChange} onBlur={onBlur} error={profileForm.formState.errors.firstName?.message} />
            )} />
          </View>
          <View style={{ flex: 1 }}>
            <Controller control={profileForm.control} name="lastName" render={({ field: { value, onChange, onBlur } }) => (
              <Input label="Nom" value={value} onChangeText={onChange} onBlur={onBlur} error={profileForm.formState.errors.lastName?.message} />
            )} />
          </View>
        </View>
        <Controller control={profileForm.control} name="email" render={({ field: { value, onChange, onBlur } }) => (
          <Input label="Email" value={value} onChangeText={onChange} onBlur={onBlur} error={profileForm.formState.errors.email?.message} keyboardType="email-address" autoCapitalize="none" />
        )} />
        <Controller control={profileForm.control} name="phoneNumber" render={({ field: { value, onChange, onBlur } }) => (
          <Input label="Téléphone" value={value} onChangeText={onChange} onBlur={onBlur} error={profileForm.formState.errors.phoneNumber?.message} keyboardType="phone-pad" />
        )} />
        <Button onPress={profileForm.handleSubmit(onSaveProfile)} loading={savingProfile}>
          Enregistrer les modifications
        </Button>
      </View>

      {/* Change password */}
      <View style={section}>
        <Text style={{ color: textMain, fontSize: 16, fontFamily: "DMSans_700Bold", marginBottom: 16 }}>
          Changer le mot de passe
        </Text>
        <Controller control={passwordForm.control} name="currentPassword" render={({ field: { value, onChange, onBlur } }) => (
          <Input label="Mot de passe actuel" value={value} onChangeText={onChange} onBlur={onBlur} error={passwordForm.formState.errors.currentPassword?.message} secureTextEntry />
        )} />
        <Controller control={passwordForm.control} name="newPassword" render={({ field: { value, onChange, onBlur } }) => (
          <Input label="Nouveau mot de passe" value={value} onChangeText={onChange} onBlur={onBlur} error={passwordForm.formState.errors.newPassword?.message} secureTextEntry />
        )} />
        <Controller control={passwordForm.control} name="confirmPassword" render={({ field: { value, onChange, onBlur } }) => (
          <Input label="Confirmer le mot de passe" value={value} onChangeText={onChange} onBlur={onBlur} error={passwordForm.formState.errors.confirmPassword?.message} secureTextEntry />
        )} />
        <Button onPress={passwordForm.handleSubmit(onSavePassword)} loading={savingPassword} variant="outline">
          Modifier le mot de passe
        </Button>
      </View>

      {/* Danger zone */}
      <View style={section}>
        <Text style={{ color: isDark ? Colors.dark.destructive : Colors.destructive, fontSize: 16, fontFamily: "DMSans_700Bold", marginBottom: 8 }}>
          Zone de danger
        </Text>
        <Text style={{ color: textMut, fontSize: 14, marginBottom: 16, lineHeight: 20 }}>
          La suppression de votre compte est irréversible. Toutes vos données seront définitivement effacées.
        </Text>
        <Button variant="destructive" onPress={handleDeleteAccount}>
          Supprimer mon compte
        </Button>
      </View>
    </ScrollView>
  );
}
