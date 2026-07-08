import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type AgentSession = {
  id: string;
  name: string;
  email: string;
  verificationTier: "NON_VERIFIE" | "VERIFIE";
  emailVerified: boolean;
  agentType?: string | null;
  agencyId?: string | null;
  photo?: string | null;
  phoneNumber?: string | null;
  whatsappNumber?: string | null;
  plan?: string | null;
};

interface AgentSessionState {
  token: string | null;
  agent: AgentSession | null;
  isAuthenticated: boolean;
  setSession: (token: string, agent: AgentSession) => void;
  setAgent: (agent: AgentSession) => void;
  logout: () => void;
}

export const useAgentSessionStore = create<AgentSessionState>()(
  persist(
    (set) => ({
      token: null,
      agent: null,
      isAuthenticated: false,
      setSession: (token, agent) => set({ token, agent, isAuthenticated: true }),
      setAgent: (agent) => set({ agent }),
      logout: () => set({ token: null, agent: null, isAuthenticated: false }),
    }),
    { name: "okapi-agent-session", storage: createJSONStorage(() => AsyncStorage) },
  ),
);
