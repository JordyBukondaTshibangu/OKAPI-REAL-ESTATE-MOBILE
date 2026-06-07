import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type PropertyIntent = "rent" | "buy" | "invest" | null;
export type PropertyCategory = "residential" | "commercial" | null;
export type PropertyType =
  | "apartment" | "villa" | "house" | "studio" | "penthouse" | "land"
  | "office" | "shop" | "warehouse" | "building"
  | null;

interface OnboardingState {
  hasCompletedOnboarding: boolean;
  intent: PropertyIntent;
  propertyCategory: PropertyCategory;
  propertyType: PropertyType;
  selectedAreas: string[];
  setIntent: (intent: PropertyIntent) => void;
  setPropertyCategory: (cat: PropertyCategory) => void;
  setPropertyType: (type: PropertyType) => void;
  setSelectedAreas: (areas: string[]) => void;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      hasCompletedOnboarding: false,
      intent: null,
      propertyCategory: "residential",
      propertyType: null,
      selectedAreas: [],
      setIntent: (intent) => set({ intent }),
      setPropertyCategory: (propertyCategory) => set({ propertyCategory }),
      setPropertyType: (propertyType) => set({ propertyType }),
      setSelectedAreas: (selectedAreas) => set({ selectedAreas }),
      completeOnboarding: () => set({ hasCompletedOnboarding: true }),
      resetOnboarding: () =>
        set({
          hasCompletedOnboarding: false,
          intent: null,
          propertyCategory: "residential",
          propertyType: null,
          selectedAreas: [],
        }),
    }),
    { name: "okapi-onboarding", storage: createJSONStorage(() => AsyncStorage) }
  )
);
