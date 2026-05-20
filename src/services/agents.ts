import axios from "axios";
import { API_URL } from "../constants/api";
import type { Agent } from "../types/agent";

export type AgentParams = { page?: number; limit?: number; name?: string; language?: string; nationality?: string; };

export async function fetchAgents(params: AgentParams = {}): Promise<{ data: Agent[]; meta: any }> {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v !== undefined) query.set(k, String(v)); });
  const res = await axios.get(`${API_URL}/agents?${query.toString()}`);
  const json = res.data;
  const data = (Array.isArray(json) ? json : (json.data ?? [])).map((a: any) => ({
    ...a, agency: typeof a.agency === "object" ? a.agency?.name ?? "" : a.agency ?? "",
  }));
  return { data, meta: json.meta ?? {} };
}

export async function fetchAgentById(id: string): Promise<Agent> {
  const res = await axios.get(`${API_URL}/agents/${id}`);
  const a = res.data;
  return { ...a, agency: typeof a.agency === "object" ? a.agency?.name ?? "" : a.agency ?? "" };
}
