import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { TourLayout } from "./useTourStore";

export interface AgentSetupTourStep {
  id: string;
  tooltipPosition: "above" | "below";
}

/**
 * Two-step tour shown to new agents right after account creation:
 * 1. Identity verification card  — submit your documents
 * 2. Profile info form           — fill in your details
 */
export const AGENT_SETUP_TOUR_STEPS: AgentSetupTourStep[] = [
  { id: "agent-identity", tooltipPosition: "below" },
  { id: "agent-profile-info", tooltipPosition: "below" },
];

interface AgentSetupTourState {
  // ── Persisted ────────────────────────────────────────────────────────────────
  hasSeenSetupTour: boolean;

  // ── Ephemeral ────────────────────────────────────────────────────────────────
  /** Set to true just before navigating to profil.tsx so the tour auto-starts. */
  shouldStartOnMount: boolean;
  isActive: boolean;
  currentStep: number;
  layouts: Record<string, TourLayout>;

  // ── Actions ──────────────────────────────────────────────────────────────────
  /** Call from agent-verification.tsx before replacing to /espace-agent/profil */
  triggerOnMount: () => void;
  startTour: () => void;
  nextStep: () => void;
  skipTour: () => void;
  registerLayout: (id: string, layout: TourLayout) => void;
}

export const useAgentSetupTourStore = create<AgentSetupTourState>()(
  persist(
    (set, get) => ({
      // Persisted
      hasSeenSetupTour: false,

      // Ephemeral
      shouldStartOnMount: false,
      isActive: false,
      currentStep: 0,
      layouts: {},

      triggerOnMount: () => set({ shouldStartOnMount: true }),

      startTour: () =>
        set({ isActive: true, currentStep: 0, shouldStartOnMount: false }),

      nextStep: () => {
        const { currentStep } = get();
        if (currentStep < AGENT_SETUP_TOUR_STEPS.length - 1) {
          set({ currentStep: currentStep + 1 });
        } else {
          set({ isActive: false, hasSeenSetupTour: true });
        }
      },

      skipTour: () => set({ isActive: false, hasSeenSetupTour: true }),

      registerLayout: (id, layout) =>
        set((s) => ({ layouts: { ...s.layouts, [id]: layout } })),
    }),
    {
      name: "okapi-agent-setup-tour",
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist the "seen" flag — everything else resets each session
      partialize: (s) => ({ hasSeenSetupTour: s.hasSeenSetupTour }),
    },
  ),
);
