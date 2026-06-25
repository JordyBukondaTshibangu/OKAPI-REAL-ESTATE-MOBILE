import React from "react";
import { TouchableOpacity, Text, ActivityIndicator, type ViewStyle } from "react-native";
import { Colors } from "../../constants/colors";

type Variant = "default" | "outline" | "ghost" | "gold" | "navy" | "destructive";
type Size = "sm" | "md" | "lg";

interface ButtonProps {
  variant?: Variant;
  size?: Size;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
  className?: string;
  style?: ViewStyle;
}

const variantStyles: Record<Variant, { container: string; text: string }> = {
  default: { container: "bg-primary", text: "text-white" },
  gold: { container: "bg-secondary", text: "text-foreground" },
  navy: { container: "bg-navy", text: "text-white" },
  outline: { container: "bg-transparent border border-border dark:border-dark-border", text: "text-foreground dark:text-dark-foreground" },
  ghost: { container: "bg-transparent", text: "text-foreground dark:text-dark-foreground" },
  destructive: { container: "bg-destructive", text: "text-white" },
};

const sizeStyles: Record<Size, { container: string; height: number }> = {
  sm: { container: "px-4", height: 36 },
  md: { container: "px-6", height: 44 },
  lg: { container: "px-8", height: 52 },
};

export default function Button({
  variant = "default",
  size = "md",
  onPress,
  disabled,
  loading,
  children,
  style,
}: ButtonProps) {
  const v = variantStyles[variant];
  const s = sizeStyles[size];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[{ height: s.height, borderRadius: 9999, justifyContent: "center", alignItems: "center", opacity: disabled ? 0.6 : 1 }, style]}
      className={`${v.container} ${s.container} rounded-full items-center justify-center flex-row gap-2`}
      activeOpacity={0.8}
    >
      {loading && <ActivityIndicator size="small" color={variant === "default" || variant === "navy" || variant === "destructive" ? Colors.white : Colors.primary} />}
      {typeof children === "string" ? (
        <Text className={`${v.text} font-sans-semibold text-sm`}>{children}</Text>
      ) : (
        children
      )}
    </TouchableOpacity>
  );
}
