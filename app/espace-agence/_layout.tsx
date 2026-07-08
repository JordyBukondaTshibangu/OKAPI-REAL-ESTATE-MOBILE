import { Stack } from "expo-router";
import { Colors } from "../../src/constants/colors";
import { useThemeStore } from "../../src/store/useThemeStore";

export default function EspaceAgenceLayout() {
  const { theme } = useThemeStore();
  const isDark = theme === "dark";
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: isDark ? Colors.dark.background : Colors.backgroundAlt },
      }}
    />
  );
}
