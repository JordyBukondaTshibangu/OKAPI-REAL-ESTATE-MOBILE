import React, { useState } from "react";
import { View, TextInput, TouchableOpacity } from "react-native";
import { Search, X } from "lucide-react-native";
import { Colors } from "../../constants/colors";

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
}

export default function SearchBar({ value, onChangeText, onSubmit, placeholder = "Commune, quartier ou référence" }: SearchBarProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View
      className={`flex-row items-center bg-white border rounded-2xl px-4 mx-4 mb-2 ${focused ? "border-primary" : "border-border"}`}
      style={{
        height: 46,
        shadowColor: Colors.navy,
        shadowOpacity: 0.05,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 1,
      }}
    >
      <Search size={18} color={focused ? Colors.primary : Colors.mutedFg} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmit}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        placeholderTextColor="#94a3b8"
        returnKeyType="search"
        className="flex-1 text-sm text-text-dark ml-2"
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={() => onChangeText("")} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <X size={16} color={Colors.mutedFg} />
        </TouchableOpacity>
      )}
    </View>
  );
}
