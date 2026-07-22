import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type Locale = "fr" | "en" | "ln";

interface LocaleState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

export const useLocaleStore = create<LocaleState>()(
  persist(
    (set) => ({
      locale: "fr",
      setLocale: (locale) => set({ locale }),
    }),
    {
      name: "okapi-locale-v2",
      storage: createJSONStorage(() => AsyncStorage),
      // v2: default changed to "fr" — wipes any previously cached "en" value
    }
  )
);
