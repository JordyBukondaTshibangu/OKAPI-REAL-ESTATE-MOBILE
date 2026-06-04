import React from "react";
import { View, Text } from "react-native";

type BadgeVariant = "primary" | "secondary" | "muted" | "gold";

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  className?: string;
}

const variantStyles: Record<BadgeVariant, { container: string; text: string }> = {
  primary: { container: "bg-accent dark:bg-dark-accent", text: "text-primary dark:text-dark-primary" },
  secondary: { container: "bg-primary dark:bg-dark-primary", text: "text-white" },
  muted: { container: "bg-background-alt dark:bg-dark-muted", text: "text-muted-fg dark:text-dark-muted-fg" },
  gold: { container: "bg-secondary dark:bg-dark-secondary", text: "text-foreground dark:text-dark-foreground" },
};

export default function Badge({ label, variant = "primary" }: BadgeProps) {
  const v = variantStyles[variant];
  return (
    <View className={`rounded-full px-2.5 py-0.5 ${v.container}`}>
      <Text className={`text-xs font-sans-medium ${v.text}`}>{label}</Text>
    </View>
  );
}
