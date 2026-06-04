import React from "react";
import { TouchableOpacity } from "react-native";
import { Moon, Sun } from "lucide-react-native";
import { useThemeStore } from "../../store/useThemeStore";
import { Colors } from "../../constants/colors";

interface ThemeToggleProps {
  size?: number;
}

export default function ThemeToggle({ size = 20 }: ThemeToggleProps) {
  const { theme, toggleTheme } = useThemeStore();
  const isDark = theme === "dark";

  return (
    <TouchableOpacity
      onPress={toggleTheme}
      className="w-9 h-9 rounded-full items-center justify-center bg-background-alt dark:bg-dark-muted"
      activeOpacity={0.7}
    >
      {isDark ? (
        <Sun size={size} color={Colors.secondary} />
      ) : (
        <Moon size={size} color={Colors.foreground} />
      )}
    </TouchableOpacity>
  );
}
