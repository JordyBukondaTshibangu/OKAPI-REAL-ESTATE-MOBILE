import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Switch,
  Alert,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import {
  Sun,
  Moon,
  Globe,
  Bell,
  Shield,
  FileText,
  Info,
  ChevronRight,
  RefreshCw,
  Mail,
  Smartphone,
} from "lucide-react-native";
import { Colors } from "../../../src/constants/colors";
import { useThemeStore } from "../../../src/store/useThemeStore";
import { useLocaleStore } from "../../../src/store/useLocaleStore";
import { useOnboardingStore } from "../../../src/store/useOnboardingStore";
import Constants from "expo-constants";

const APP_VERSION = Constants.expoConfig?.version ?? "1.0.0";

type RowProps = {
  icon: React.ReactNode;
  label: string;
  subtitle?: string;
  right?: React.ReactNode;
  onPress?: () => void;
  destructive?: boolean;
  isDark: boolean;
};

function Row({
  icon,
  label,
  subtitle,
  right,
  onPress,
  destructive,
  isDark,
}: RowProps) {
  const textMain = isDark ? Colors.dark.foreground : Colors.foreground;
  const textMuted = isDark ? Colors.dark.mutedFg : Colors.mutedFg;
  const borderC = isDark ? Colors.dark.border : Colors.border;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress && !right}
      activeOpacity={onPress ? 0.7 : 1}
      style={[styles.row, { borderBottomColor: borderC }]}
    >
      <View style={styles.rowLeft}>
        {icon}
        <View style={{ flex: 1 }}>
          <Text
            style={[
              styles.rowLabel,
              {
                color: destructive
                  ? isDark
                    ? Colors.dark.destructive
                    : Colors.destructive
                  : textMain,
              },
            ]}
          >
            {label}
          </Text>
          {subtitle && (
            <Text style={[styles.rowSubtitle, { color: textMuted }]}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>
      {right ?? (onPress ? <ChevronRight size={18} color={textMuted} /> : null)}
    </TouchableOpacity>
  );
}

function SectionHeader({ title, isDark }: { title: string; isDark: boolean }) {
  return (
    <Text
      style={[
        styles.sectionHeader,
        { color: isDark ? Colors.dark.mutedFg : Colors.mutedFg },
      ]}
    >
      {title.toUpperCase()}
    </Text>
  );
}

export default function ParametresScreen() {
  const { theme, setTheme } = useThemeStore();
  const { locale, setLocale } = useLocaleStore();
  const { resetOnboarding } = useOnboardingStore();
  const isDark = theme === "dark";

  const pageBg = isDark ? Colors.dark.background : Colors.backgroundAlt;
  const cardBg = isDark ? Colors.dark.card : Colors.white;
  const textMain = isDark ? Colors.dark.foreground : Colors.foreground;
  const textMuted = isDark ? Colors.dark.mutedFg : Colors.mutedFg;
  const iconBg = isDark ? Colors.dark.accent : Colors.accent;
  const iconColor = isDark ? Colors.dark.primary : Colors.primary;

  function iconBox(Icon: React.ComponentType<any>, color?: string) {
    return (
      <View style={[styles.iconBox, { backgroundColor: iconBg }]}>
        <Icon size={20} color={color ?? iconColor} strokeWidth={1.8} />
      </View>
    );
  }

  function handleThemeToggle() {
    setTheme(isDark ? "light" : "dark");
  }

  function handleLanguage() {
    const langs: { key: typeof locale; label: string }[] = [
      { key: "fr", label: "Français" },
      { key: "en", label: "English" },
      { key: "ln", label: "Lingala" },
    ];
    Alert.alert("Langue", "Choisissez votre langue", [
      ...langs.map((l) => ({
        text: `${l.label}${locale === l.key ? " ✓" : ""}`,
        onPress: () => setLocale(l.key),
      })),
      { text: "Annuler", style: "cancel" as const },
    ]);
  }

  function handleResetOnboarding() {
    Alert.alert(
      "Réinitialiser l'introduction",
      "Vous verrez à nouveau les écrans d'introduction au prochain lancement.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Réinitialiser",
          style: "destructive",
          onPress: () => {
            resetOnboarding();
            Alert.alert(
              "Fait",
              "L'introduction sera affichée au prochain lancement.",
            );
          },
        },
      ],
    );
  }

  const localeLabel: Record<string, string> = {
    fr: "Français",
    en: "English",
    ln: "Lingala",
  };

  const sectionStyle = {
    backgroundColor: cardBg,
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    overflow: "hidden" as const,
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: pageBg }}
      edges={["bottom"]}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 40 }}
      >
        {/* Appearance */}
        <SectionHeader title="Apparence" isDark={isDark} />
        <View style={sectionStyle}>
          <Row
            isDark={isDark}
            icon={iconBox(isDark ? Moon : Sun)}
            label="Mode sombre"
            subtitle={isDark ? "Activé" : "Désactivé"}
            right={
              <Switch
                value={isDark}
                onValueChange={handleThemeToggle}
                trackColor={{
                  false: Colors.border,
                  true: isDark ? Colors.dark.primary : Colors.primary,
                }}
                thumbColor="#fff"
              />
            }
          />
        </View>

        {/* Language */}
        <SectionHeader title="Langue & région" isDark={isDark} />
        <View style={sectionStyle}>
          <Row
            isDark={isDark}
            icon={iconBox(Globe)}
            label="Langue"
            subtitle={localeLabel[locale]}
            onPress={handleLanguage}
          />
        </View>

        {/* Notifications */}
        <SectionHeader title="Notifications" isDark={isDark} />
        <View style={sectionStyle}>
          <Row
            isDark={isDark}
            icon={iconBox(Bell)}
            label="Alertes de biens"
            subtitle="Recevez les nouvelles annonces"
            right={
              <Switch
                value={true}
                onValueChange={() => {}}
                trackColor={{
                  false: Colors.border,
                  true: isDark ? Colors.dark.primary : Colors.primary,
                }}
                thumbColor="#fff"
              />
            }
          />
          <Row
            isDark={isDark}
            icon={iconBox(Smartphone)}
            label="Notifications push"
            subtitle="Messages et mises à jour"
            right={
              <Switch
                value={true}
                onValueChange={() => {}}
                trackColor={{
                  false: Colors.border,
                  true: isDark ? Colors.dark.primary : Colors.primary,
                }}
                thumbColor="#fff"
              />
            }
          />
        </View>

        {/* Support */}
        <SectionHeader title="Support" isDark={isDark} />
        <View style={sectionStyle}>
          <Row
            isDark={isDark}
            icon={iconBox(Mail)}
            label="Nous contacter"
            subtitle="support@okapi-realestate.com"
            onPress={() =>
              Linking.openURL("mailto:support@okapi-realestate.com")
            }
          />
        </View>

        {/* Legal */}
        <SectionHeader title="Légal" isDark={isDark} />
        <View style={sectionStyle}>
          <Row
            isDark={isDark}
            icon={iconBox(FileText)}
            label="Conditions d'utilisation"
            onPress={() =>
              Linking.openURL(
                "https://dev.okapi-real-estate.com/conditions-generales",
              )
            }
          />
          <Row
            isDark={isDark}
            icon={iconBox(Shield)}
            label="Politique de confidentialité"
            onPress={() =>
              Linking.openURL(
                "https://dev.okapi-real-estate.com/confidentialite",
              )
            }
          />
        </View>

        {/* App info */}
        <SectionHeader title="Application" isDark={isDark} />
        <View style={sectionStyle}>
          <Row
            isDark={isDark}
            icon={iconBox(Info)}
            label="Version"
            subtitle={`Okapi Real Estate v${APP_VERSION}`}
          />
          <Row
            isDark={isDark}
            icon={iconBox(RefreshCw)}
            label="Réinitialiser l'introduction"
            subtitle="Revoir les écrans de démarrage"
            onPress={handleResetOnboarding}
            destructive={false}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    fontSize: 11,
    fontFamily: "DMSans_600SemiBold",
    letterSpacing: 0.8,
    marginHorizontal: 24,
    marginTop: 20,
    marginBottom: 6,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
    marginRight: 8,
  },
  rowLabel: {
    fontSize: 15,
    fontFamily: "DMSans_500Medium",
  },
  rowSubtitle: {
    fontSize: 12,
    fontFamily: "DMSans_400Regular",
    marginTop: 1,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
});
