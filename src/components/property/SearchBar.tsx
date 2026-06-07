import React, { useState } from "react";
import { View, TextInput, TouchableOpacity } from "react-native";
import { Search, X } from "lucide-react-native";
import { Colors } from "../../constants/colors";
import { useThemeStore } from "../../store/useThemeStore";

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
}

export default function SearchBar({ value, onChangeText, onSubmit, placeholder = "Commune, quartier ou référence" }: SearchBarProps) {
  const [focused, setFocused] = useState(false);
  const { theme } = useThemeStore();
  const isDark = theme === "dark";

  const bg = isDark ? Colors.dark.card : Colors.white;
  const borderColor = focused
    ? (isDark ? Colors.dark.primary : Colors.primary)
    : (isDark ? Colors.dark.border : Colors.border);
  const textColor = isDark ? Colors.dark.foreground : Colors.textDark;
  const iconColor = focused ? (isDark ? Colors.dark.primary : Colors.primary) : (isDark ? Colors.dark.mutedFg : Colors.mutedFg);

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: bg,
        borderWidth: 1.5,
        borderColor,
        borderRadius: 16,
        paddingHorizontal: 14,
        marginHorizontal: 16,
        marginBottom: 8,
        height: 46,
        shadowColor: Colors.navy,
        shadowOpacity: isDark ? 0 : 0.05,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 1,
      }}
    >
      <Search size={18} color={iconColor} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmit}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        placeholderTextColor={isDark ? Colors.dark.mutedFg : "#94a3b8"}
        returnKeyType="search"
        style={{
          flex: 1,
          fontSize: 14,
          color: textColor,
          marginLeft: 8,
          fontFamily: "DMSans_400Regular",
          padding: 0,
        }}
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={() => onChangeText("")} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <X size={16} color={isDark ? Colors.dark.mutedFg : Colors.mutedFg} />
        </TouchableOpacity>
      )}
    </View>
  );
}
