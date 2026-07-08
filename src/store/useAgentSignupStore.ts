import { create } from "zustand";

interface AgentSignupState {
  token: string | null;
  agentName: string;
  agentEmail: string;
  agentPhone: string;
  setSignup: (token: string, name: string, email: string, phone: string) => void;
  clear: () => void;
}

export const useAgentSignupStore = create<AgentSignupState>((set) => ({
  token: null,
  agentName: "",
  agentEmail: "",
  agentPhone: "",
  setSignup: (token, agentName, agentEmail, agentPhone) =>
    set({ token, agentName, agentEmail, agentPhone }),
  clear: () => set({ token: null, agentName: "", agentEmail: "", agentPhone: "" }),
}));
