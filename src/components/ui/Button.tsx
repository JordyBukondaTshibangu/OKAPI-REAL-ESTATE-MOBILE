import React, { useRef } from "react";
import { Animated, Pressable, Text, ActivityIndicator, type ViewStyle } from "react-native";
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

const variantStyles: Record<Variant, { bg: string; text: string; border?: string }> = {
  default:     { bg: Colors.primary,     text: "#fff" },
  gold:        { bg: Colors.secondary,   text: Colors.navy },
  navy:        { bg: Colors.navy,        text: "#fff" },
  outline:     { bg: "transparent",      text: Colors.primary,   border: Colors.border },
  ghost:       { bg: "transparent",      text: Colors.primary },
  destructive: { bg: "#ef4444",          text: "#fff" },
};

const sizeStyles: Record<Size, { height: number; paddingHorizontal: number; fontSize: number }> = {
  sm: { height: 36, paddingHorizontal: 16, fontSize: 13 },
  md: { height: 44, paddingHorizontal: 24, fontSize: 14 },
  lg: { height: 52, paddingHorizontal: 32, fontSize: 15 },
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
  const scale = useRef(new Animated.Value(1)).current;

  function pressIn() {
    Animated.spring(scale, {
      toValue: 0.93,
      useNativeDriver: true,
      speed: 60,
      bounciness: 0,
    }).start();
  }

  function pressOut() {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 25,
      bounciness: 7,
    }).start();
  }

  const isLoading = loading ?? false;
  const isDisabled = (disabled ?? false) || isLoading;

  return (
    <Pressable
      onPressIn={pressIn}
      onPressOut={pressOut}
      onPress={onPress}
      disabled={isDisabled}
    >
      <Animated.View
        style={[
          {
            height: s.height,
            paddingHorizontal: s.paddingHorizontal,
            borderRadius: 9999,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            backgroundColor: v.bg,
            borderWidth: v.border ? 1 : 0,
            borderColor: v.border ?? "transparent",
            opacity: isDisabled ? 0.6 : 1,
            transform: [{ scale }],
          },
          style,
        ]}
      >
        {isLoading && (
          <ActivityIndicator
            size="small"
            color={
              variant === "default" || variant === "navy" || variant === "destructive"
                ? Colors.white
                : Colors.primary
            }
          />
        )}
        {typeof children === "string" ? (
          <Text
            style={{
              color: v.text,
              fontSize: s.fontSize,
              fontFamily: "DMSans_600SemiBold",
            }}
          >
            {children}
          </Text>
        ) : (
          children
        )}
      </Animated.View>
    </Pressable>
  );
}
