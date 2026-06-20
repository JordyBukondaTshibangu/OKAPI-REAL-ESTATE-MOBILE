import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Appearance } from "react-native";

type Theme = "light" | "dark";

interface ThemeState {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

// Default to the device's current appearance the first time the app runs
// (no persisted preference yet). Once the user picks a theme, that choice
// is persisted and takes over.
const deviceTheme: Theme = Appearance.getColorScheme() === "dark" ? "dark" : "light";

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: deviceTheme,
      toggleTheme: () => set({ theme: get().theme === "light" ? "dark" : "light" }),
      setTheme: (theme) => set({ theme }),
    }),
    { name: "okapi-theme", storage: createJSONStorage(() => AsyncStorage) }
  )
);
