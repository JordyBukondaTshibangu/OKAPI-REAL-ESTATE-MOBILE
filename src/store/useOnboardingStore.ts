import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type PropertyIntent = "rent" | "buy" | "invest" | null;
export type AccountType = "user" | "agent" | "agency";
export type PropertyCategory = "residential" | "commercial" | null;
export type PropertyType =
  | "apartment" | "villa" | "house" | "studio" | "penthouse" | "land"
  | "office" | "shop" | "warehouse" | "building"
  | null;
// Only meaningful when intent === "rent" - lets the user flag an interest in
// short-term stays right from onboarding, so we can surface it later (e.g.
// pre-filtering the Louer tab) without asking again.
export type StayDuration = "short" | "long" | "both" | null;

interface OnboardingState {
  hasCompletedOnboarding: boolean;
  intent: PropertyIntent;
  propertyCategory: PropertyCategory;
  propertyType: PropertyType;
  selectedAreas: string[];
  stayDuration: StayDuration;
  accountType: AccountType;
  setIntent: (intent: PropertyIntent) => void;
  setPropertyCategory: (cat: PropertyCategory) => void;
  setPropertyType: (type: PropertyType) => void;
  setSelectedAreas: (areas: string[]) => void;
  setStayDuration: (stayDuration: StayDuration) => void;
  setAccountType: (accountType: AccountType) => void;
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
      stayDuration: null,
      accountType: "user",
      setIntent: (intent) => set({ intent }),
      setPropertyCategory: (propertyCategory) => set({ propertyCategory }),
      setPropertyType: (propertyType) => set({ propertyType }),
      setSelectedAreas: (selectedAreas) => set({ selectedAreas }),
      setStayDuration: (stayDuration) => set({ stayDuration }),
      setAccountType: (accountType) => set({ accountType }),
      completeOnboarding: () => set({ hasCompletedOnboarding: true }),
      resetOnboarding: () =>
        set({
          hasCompletedOnboarding: false,
          intent: null,
          propertyCategory: "residential",
          propertyType: null,
          selectedAreas: [],
          stayDuration: null,
          accountType: "user",
        }),
    }),
    { name: "okapi-onboarding", storage: createJSONStorage(() => AsyncStorage) }
  )
);
