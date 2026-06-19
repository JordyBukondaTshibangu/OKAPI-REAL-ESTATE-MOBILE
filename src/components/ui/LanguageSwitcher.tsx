import React, { useState } from "react";
import { View, Text, TouchableOpacity, Modal, Pressable } from "react-native";
import { Globe } from "lucide-react-native";
import { useLocaleStore, type Locale } from "../../store/useLocaleStore";
import { useT } from "../../i18n/useT";
import { Colors } from "../../constants/colors";

const LANGUAGES: { code: Locale; flag: string; label: string; short: string }[] = [
  { code: "fr", flag: "🇫🇷", label: "Français", short: "FR" },
  { code: "en", flag: "🇬🇧", label: "English", short: "EN" },
  { code: "ln", flag: "🇨🇩", label: "Lingala", short: "LN" },
];

export default function LanguageSwitcher() {
  const { locale, setLocale } = useLocaleStore();
  const t = useT();
  const [open, setOpen] = useState(false);
  const current = LANGUAGES.find((l) => l.code === locale)!;

  return (
    <>
      <TouchableOpacity
        onPress={() => setOpen(true)}
        className="flex-row items-center gap-1 px-2 py-1 rounded-full bg-background-alt dark:bg-dark-muted"
        activeOpacity={0.7}
      >
        <Globe size={16} color={Colors.mutedFg} />
        <Text className="text-xs font-sans-medium text-muted-fg dark:text-dark-muted-fg">
          {current.flag} {current.short}
        </Text>
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable className="flex-1 bg-black/40 justify-end" onPress={() => setOpen(false)}>
          <Pressable onPress={(e) => e.stopPropagation()}>
            <View className="bg-background dark:bg-dark-background-alt rounded-t-3xl p-6">
              <Text className="text-base font-sans-semibold text-foreground dark:text-dark-foreground mb-4">
                {t.onboarding.chooseLanguage}
              </Text>
              {LANGUAGES.map((lang) => {
                const isActive = lang.code === locale;
                return (
                  <TouchableOpacity
                    key={lang.code}
                    onPress={() => { setLocale(lang.code); setOpen(false); }}
                    className={`flex-row items-center gap-3 p-4 rounded-xl mb-2 ${
                      isActive ? "bg-accent dark:bg-dark-accent" : "bg-background-alt dark:bg-dark-muted"
                    }`}
                    activeOpacity={0.7}
                  >
                    <Text className="text-2xl">{lang.flag}</Text>
                    <Text className={`flex-1 text-sm font-sans-medium ${
                      isActive ? "text-primary dark:text-dark-primary" : "text-foreground dark:text-dark-foreground"
                    }`}>
                      {lang.label}
                    </Text>
                    {isActive && (
                      <View className="w-2 h-2 rounded-full bg-primary dark:bg-dark-primary" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
