import React, { useState } from "react";
import { View, Text, TextInput, type TextInputProps } from "react-native";

interface InputProps extends TextInputProps {
  error?: string;
  label?: string;
}

export default function Input({ error, label, style, ...props }: InputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View className="mb-4">
      {label && (
        <Text className="text-foreground dark:text-dark-foreground text-sm font-sans-medium mb-1.5">{label}</Text>
      )}
      <TextInput
        {...props}
        onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
        onBlur={(e) => { setFocused(false); props.onBlur?.(e); }}
        style={[{ height: 44 }, style]}
        className={`border rounded-xl px-4 text-sm text-foreground dark:text-dark-foreground bg-background dark:bg-dark-background-alt ${
          error ? "border-destructive" : focused ? "border-primary dark:border-dark-primary" : "border-border dark:border-dark-border"
        }`}
        placeholderTextColor="#8596B0"
      />
      {error && (
        <Text className="text-destructive text-xs mt-1">{error}</Text>
      )}
    </View>
  );
}
