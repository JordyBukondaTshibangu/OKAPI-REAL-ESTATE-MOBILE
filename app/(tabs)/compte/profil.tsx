import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { router } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import * as ImagePicker from "expo-image-picker";
import { useQueryClient } from "@tanstack/react-query";
import { updateMe, changePassword, uploadAvatar, removeAvatar, deleteAccount } from "../../../src/services/auth";
import { useAuthStore } from "../../../src/store/useAuthStore";
import { useCurrentUser } from "../../../src/hooks/useCurrentUser";
import { useThemeStore } from "../../../src/store/useThemeStore";
import { useAuthGuard } from "../../../src/hooks/useAuthGuard";
import { useT } from "../../../src/i18n/useT";
import Input from "../../../src/components/ui/Input";
import Button from "../../../src/components/ui/Button";
import Avatar from "../../../src/components/ui/Avatar";
import { Colors } from "../../../src/constants/colors";
import { Camera, Trash2 } from "lucide-react-native";
import { API_URL } from "../../../src/constants/api";

type ProfileForm = { firstName: string; lastName: string; email: string; phoneNumber: string };
type PasswordForm = { currentPassword: string; newPassword: string; confirmPassword: string };

export default function ProfilScreen() {
  const t = useT();

  const profileSchema = z.object({
    firstName: z.string().min(1, t.auth.firstName),
    lastName: z.string().min(1, t.auth.lastName),
    email: z.string().email(t.auth.email),
    phoneNumber: z.string().min(1, t.auth.phone),
  });

  const passwordSchema = z.object({
    currentPassword: z.string().min(1, t.user.currentPassword),
    newPassword: z.string().min(8, "8 min"),
    confirmPassword: z.string(),
  }).refine(d => d.newPassword === d.confirmPassword, {
    message: t.auth.confirmPassword,
    path: ["confirmPassword"],
  });
  const isAuth = useAuthGuard();
  const { token, logout } = useAuthStore();
  // useCurrentUser fetches server-fresh profile and keeps Zustand in sync
  const { user } = useCurrentUser();
  const { setUser } = useAuthStore();
  const queryClient = useQueryClient();
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
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(t.common.error, t.user.mediaPermissionError ?? "Permission d'accès à la galerie refusée.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true, aspect: [1, 1], quality: 0.8,
    });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    // Derive a safe filename and mime type (asset.fileName can be null on Android)
    const ext = asset.uri.split(".").pop()?.toLowerCase() ?? "jpg";
    const safeName = asset.fileName ?? `avatar.${ext}`;
    const safeMime = asset.mimeType ?? (ext === "png" ? "image/png" : "image/jpeg");
    setUploadingAvatar(true);
    try {
      const updated = await uploadAvatar(token!, asset.uri, safeName, safeMime);
      setUser(updated);
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
    } catch (err: any) {
      if (err?.response?.status === 401) {
        logout();
        router.replace("/(auth)/connexion");
      } else {
        const detail = err?.message ?? err?.response?.data?.message ?? "";
        Alert.alert(t.common.error, `${t.user.uploadAvatarError}\n\n${detail}`);
      }
    }
    finally { setUploadingAvatar(false); }
  }

  async function handleRemoveAvatar() {
    Alert.alert(t.user.removeAvatarTitle, t.user.removeAvatarMsg, [
      { text: t.common.cancel, style: "cancel" },
      { text: t.common.delete, style: "destructive", onPress: async () => {
        try {
          const updated = await removeAvatar(token!);
          setUser(updated);
          queryClient.invalidateQueries({ queryKey: ["currentUser"] });
        } catch { Alert.alert(t.common.error, t.user.removePhotoError); }
      }},
    ]);
  }

  async function onSaveProfile(data: ProfileForm) {
    setSavingProfile(true);
    try {
      const updated = await updateMe(token!, data);
      setUser(updated);
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      Alert.alert(t.common.success, t.user.saveProfileSuccess);
    }
    catch (err: any) {
      if (err?.response?.status === 401) { logout(); router.replace("/(auth)/connexion"); }
      else { Alert.alert(t.common.error, t.user.saveProfileError); }
    }
    finally { setSavingProfile(false); }
  }

  async function onSavePassword(data: PasswordForm) {
    setSavingPassword(true);
    try {
      await changePassword(token!, { currentPassword: data.currentPassword, newPassword: data.newPassword });
      passwordForm.reset();
      Alert.alert(t.common.success, t.user.changePasswordSuccess);
    } catch { Alert.alert(t.common.error, t.user.changePasswordError); }
    finally { setSavingPassword(false); }
  }

  function handleDeleteAccount() {
    Alert.alert(t.user.deleteAccountTitle, t.user.deleteAccountIrreversible, [
      { text: t.common.cancel, style: "cancel" },
      { text: t.user.deleteAccountConfirmBtn, style: "destructive", onPress: async () => {
        try { await deleteAccount(token!); logout(); router.replace("/(tabs)"); }
        catch { Alert.alert(t.common.error, t.user.deleteAccountError); }
      }},
    ]);
  }

  const section = { backgroundColor: cardBg, paddingHorizontal: 20, paddingVertical: 20, marginBottom: 10 };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
    >
    <ScrollView
      style={{ flex: 1, backgroundColor: pageBg }}
      contentContainerStyle={{ paddingBottom: 80 }}
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
            <Text style={{ color: isDark ? Colors.dark.destructive : Colors.destructive, fontSize: 12 }}>{t.user.removeAvatar}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Personal info */}
      <View style={section}>
        <Text style={{ color: textMain, fontSize: 16, fontFamily: "DMSans_700Bold", marginBottom: 16 }}>
          {t.user.personalInfo}
        </Text>
        <View style={{ flexDirection: "row", gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Controller control={profileForm.control} name="firstName" render={({ field: { value, onChange, onBlur } }) => (
              <Input label={t.auth.firstName} value={value} onChangeText={onChange} onBlur={onBlur} error={profileForm.formState.errors.firstName?.message} />
            )} />
          </View>
          <View style={{ flex: 1 }}>
            <Controller control={profileForm.control} name="lastName" render={({ field: { value, onChange, onBlur } }) => (
              <Input label={t.auth.lastName} value={value} onChangeText={onChange} onBlur={onBlur} error={profileForm.formState.errors.lastName?.message} />
            )} />
          </View>
        </View>
        <Controller control={profileForm.control} name="email" render={({ field: { value, onChange, onBlur } }) => (
          <Input label={t.auth.email} value={value} onChangeText={onChange} onBlur={onBlur} error={profileForm.formState.errors.email?.message} keyboardType="email-address" autoCapitalize="none" />
        )} />
        <Controller control={profileForm.control} name="phoneNumber" render={({ field: { value, onChange, onBlur } }) => (
          <Input label={t.auth.phone} value={value} onChangeText={onChange} onBlur={onBlur} error={profileForm.formState.errors.phoneNumber?.message} keyboardType="phone-pad" />
        )} />
        <Button onPress={profileForm.handleSubmit(onSaveProfile)} loading={savingProfile}>
          {t.user.saveChanges}
        </Button>
      </View>

      {/* Change password */}
      <View style={section}>
        <Text style={{ color: textMain, fontSize: 16, fontFamily: "DMSans_700Bold", marginBottom: 16 }}>
          {t.user.changePassword}
        </Text>
        <Controller control={passwordForm.control} name="currentPassword" render={({ field: { value, onChange, onBlur } }) => (
          <Input label={t.user.currentPassword} value={value} onChangeText={onChange} onBlur={onBlur} error={passwordForm.formState.errors.currentPassword?.message} secureTextEntry />
        )} />
        <Controller control={passwordForm.control} name="newPassword" render={({ field: { value, onChange, onBlur } }) => (
          <Input label={t.user.newPassword} value={value} onChangeText={onChange} onBlur={onBlur} error={passwordForm.formState.errors.newPassword?.message} secureTextEntry />
        )} />
        <Controller control={passwordForm.control} name="confirmPassword" render={({ field: { value, onChange, onBlur } }) => (
          <Input label={t.auth.confirmPassword} value={value} onChangeText={onChange} onBlur={onBlur} error={passwordForm.formState.errors.confirmPassword?.message} secureTextEntry />
        )} />
        <Button onPress={passwordForm.handleSubmit(onSavePassword)} loading={savingPassword} variant="outline">
          {t.user.updatePassword}
        </Button>
      </View>

      {/* Danger zone */}
      <View style={section}>
        <Text style={{ color: isDark ? Colors.dark.destructive : Colors.destructive, fontSize: 16, fontFamily: "DMSans_700Bold", marginBottom: 8 }}>
          {t.user.dangerZone}
        </Text>
        <Text style={{ color: textMut, fontSize: 14, marginBottom: 16, lineHeight: 20 }}>
          {t.user.deleteAccountDesc}
        </Text>
        <Button variant="destructive" onPress={handleDeleteAccount}>
          {t.user.deleteAccount}
        </Button>
      </View>
    </ScrollView>
    </KeyboardAvoidingView>
  );
}
