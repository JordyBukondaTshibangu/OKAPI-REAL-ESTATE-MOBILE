import React from "react";
import { View, Text } from "react-native";
import { Inbox } from "lucide-react-native";
import { Colors } from "../../constants/colors";
import { useThemeStore } from "../../store/useThemeStore";
import Button from "./Button";

type IconComponent = React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;

interface EmptyStateProps {
  title: string;
  subtitle?: string;
  icon?: IconComponent;
  action?: { label: string; onPress: () => void };
}

export default function EmptyState({ title, subtitle, icon, action }: EmptyStateProps) {
  const { theme } = useThemeStore();
  const isDark = theme === "dark";
  const Icon = icon ?? Inbox;

  const titleColor    = isDark ? Colors.dark.foreground : Colors.textDark;
  const subtitleColor = isDark ? Colors.dark.mutedFg    : Colors.mutedFg;

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32, paddingVertical: 64 }}>
      {/* Soft layered icon badge */}
      <View
        style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: Colors.accent, alignItems: "center", justifyContent: "center", marginBottom: 20 }}
      >
        <View
          style={{
            width: 64,
            height: 64,
            borderRadius: 32,
            backgroundColor: Colors.white,
            alignItems: "center",
            justifyContent: "center",
            shadowColor: Colors.navy,
            shadowOpacity: 0.08,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 4 },
            elevation: 3,
          }}
        >
          <Icon size={28} color={Colors.primary} strokeWidth={1.75} />
        </View>
      </View>

      <Text
        style={{ color: titleColor, fontSize: 18, fontFamily: "DMSans_700Bold", textAlign: "center", marginBottom: 6 }}
      >
        {title}
      </Text>
      {subtitle && (
        <Text style={{ color: subtitleColor, fontSize: 14, textAlign: "center", lineHeight: 20, maxWidth: 280 }}>
          {subtitle}
        </Text>
      )}
      {action && (
        <View style={{ marginTop: 24 }}>
          <Button onPress={action.onPress}>{action.label}</Button>
        </View>
      )}
    </View>
  );
}
