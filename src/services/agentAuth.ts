import axios from "axios";
import { API_URL } from "../constants/api";
import type { AgentSession } from "../store/useAgentSessionStore";

export async function loginAgent(identifier: string, password: string): Promise<{ access_token: string }> {
  const res = await axios.post<{ access_token: string }>(`${API_URL}/auth/agent/login`, { identifier, password });
  return res.data;
}

/** Fetch the logged-in agent's profile. Backend route: GET /agents/me */
export async function getAgentMe(token: string): Promise<AgentSession> {
  const res = await axios.get<AgentSession>(`${API_URL}/agents/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

/** Alias kept for dashboard screens that call this directly */
export async function getMyAgentProfile(token: string): Promise<any> {
  const res = await axios.get(`${API_URL}/agents/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

export async function registerAgent(dto: {
  name: string;
  email: string;
  phoneNumber: string;
  password: string;
  whatsappNumber?: string;
}): Promise<{ access_token: string; agent: { name: string; email: string } }> {
  const res = await axios.post(`${API_URL}/auth/agent/register`, dto);
  return res.data;
}

export async function verifyAgentEmail(token: string, code: string): Promise<void> {
  await axios.post(`${API_URL}/auth/agent/verify-email`, { code }, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function resendAgentVerification(token: string): Promise<void> {
  await axios.post(`${API_URL}/auth/agent/resend-verification`, {}, {
    headers: { Authorization: `Bearer ${token}` },
  });
}
