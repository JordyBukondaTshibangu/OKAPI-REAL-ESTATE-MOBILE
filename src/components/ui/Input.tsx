import React, { useState } from "react";
import { View, Text, TextInput, type TextInputProps } from "react-native";
import { Colors } from "../../constants/colors";
import { useThemeStore } from "../../store/useThemeStore";

interface InputProps extends TextInputProps {
  error?: string;
  label?: string;
}

export default function Input({ error, label, style, ...props }: InputProps) {
  const [focused, setFocused] = useState(false);
  const { theme } = useThemeStore();
  const isDark = theme === "dark";

  const labelColor = isDark ? Colors.dark.foreground : Colors.foreground;
  const textColor = isDark ? Colors.dark.foreground : Colors.foreground;
  const bgColor = isDark ? Colors.dark.backgroundAlt : Colors.background;
  const borderColor = error
    ? (isDark ? Colors.dark.destructive : Colors.destructive)
    : focused
      ? (isDark ? Colors.dark.primary : Colors.primary)
      : (isDark ? Colors.dark.border : Colors.border);

  return (
    <View style={{ marginBottom: 16 }}>
      {label && (
        <Text style={{ color: labelColor, fontSize: 14, fontFamily: "DMSans_500Medium", marginBottom: 6 }}>
          {label}
        </Text>
      )}
      <TextInput
        {...props}
        onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
        onBlur={(e) => { setFocused(false); props.onBlur?.(e); }}
        style={[{
          height: 48,
          borderWidth: 1.5,
          borderRadius: 12,
          paddingHorizontal: 16,
          fontSize: 14,
          fontFamily: "DMSans_400Regular",
          color: textColor,
          backgroundColor: bgColor,
          borderColor,
        }, style]}
        placeholderTextColor={isDark ? Colors.dark.mutedFg : "#94a3b8"}
      />
      {error && (
        <Text style={{ color: isDark ? Colors.dark.destructive : Colors.destructive, fontSize: 12, marginTop: 4 }}>
          {error}
        </Text>
      )}
    </View>
  );
}
