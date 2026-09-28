import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface TourLayout {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TourStep {
  id: string;
  tooltipPosition: "above" | "below";
}

/**
 * Structural tour step definitions — IDs and positions only.
 * All user-visible text comes from the i18n `tour` section (t.tour.step1Title etc.)
 * so the overlay is fully translated.
 */
export const TOUR_STEPS: TourStep[] = [
  { id: "search-bar", tooltipPosition: "below" },
  { id: "property-card", tooltipPosition: "below" },
  { id: "compte-tab", tooltipPosition: "above" },
];

interface TourState {
  // ── Persisted ─────────────────────────────────────────────────────────────
  hasSeenTour: boolean;

  // ── In-memory (ephemeral per session) ─────────────────────────────────────
  isActive: boolean;
  currentStep: number;
  layouts: Record<string, TourLayout>;

  // ── Actions ───────────────────────────────────────────────────────────────
  startTour: () => void;
  nextStep: () => void;
  skipTour: () => void;
  resetTour: () => void;
  registerLayout: (id: string, layout: TourLayout) => void;
}

export const useTourStore = create<TourState>()(
  persist(
    (set, get) => ({
      // Persisted
      hasSeenTour: false,

      // In-memory
      isActive: false,
      currentStep: 0,
      layouts: {},

      startTour: () => set({ isActive: true, currentStep: 0 }),

      nextStep: () => {
        const { currentStep } = get();
        if (currentStep < TOUR_STEPS.length - 1) {
          set({ currentStep: currentStep + 1 });
        } else {
          set({ isActive: false, hasSeenTour: true });
        }
      },

      skipTour: () => set({ isActive: false, hasSeenTour: true }),

      // Resets hasSeenTour so the tour can be replayed from Settings
      resetTour: () =>
        set({ hasSeenTour: false, isActive: false, currentStep: 0 }),

      registerLayout: (id, layout) =>
        set((s) => ({ layouts: { ...s.layouts, [id]: layout } })),
    }),
    {
      name: "okapi-tour",
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist hasSeenTour — the rest is ephemeral session state
      partialize: (s) => ({ hasSeenTour: s.hasSeenTour }),
    },
  ),
);
