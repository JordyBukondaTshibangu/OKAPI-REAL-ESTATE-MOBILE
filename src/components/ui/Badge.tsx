import React from "react";
import { View, Text } from "react-native";

type BadgeVariant = "primary" | "secondary" | "muted" | "gold";

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  className?: string;
}

const variantStyles: Record<BadgeVariant, { container: string; text: string }> = {
  primary: { container: "bg-accent", text: "text-primary" },
  secondary: { container: "bg-primary", text: "text-white" },
  muted: { container: "bg-background-alt", text: "text-muted-fg" },
  gold: { container: "bg-secondary", text: "text-foreground" },
};

export default function Badge({ label, variant = "primary" }: BadgeProps) {
  const v = variantStyles[variant];
  return (
    <View className={`rounded-full px-2.5 py-0.5 ${v.container}`}>
      <Text className={`text-xs font-sans-medium ${v.text}`}>{label}</Text>
    </View>
  );
}
