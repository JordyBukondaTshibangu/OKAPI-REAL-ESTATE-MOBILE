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

// ─── Boost types ──────────────────────────────────────────────────────────────

export type BoostPaymentMethod = "ORANGE_MONEY" | "MTN_MONEY" | "AIRTEL_MONEY" | "MPESA" | "CASH";
export type BoostStatus = "PENDING" | "CONFIRMED" | "REJECTED" | "EXPIRED";

export type BoostRequest = {
  id: string;
  propertyId: string;
  property: { id: string; title: string };
  durationDays: number;
  amount: number;
  currency: string;
  paymentMethod: BoostPaymentMethod;
  paymentReference: string;
  screenshotUrl: string | null;
  status: BoostStatus;
  rejectionReason: string | null;
  confirmedAt: string | null;
  boostedUntil?: string | null;
  createdAt: string;
};

export type CreateBoostRequestPayload = {
  durationDays: number;
  amount: number;
  currency: string;
  paymentMethod: BoostPaymentMethod;
};

// ─── Boost API calls ──────────────────────────────────────────────────────────

export async function createBoostRequest(
  token: string,
  propertyId: string,
  dto: CreateBoostRequestPayload,
): Promise<BoostRequest> {
  const res = await axios.post<BoostRequest>(
    `${API_URL}/boosts/properties/${propertyId}/request`,
    dto,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  return res.data;
}

export async function getMyBoosts(token: string): Promise<BoostRequest[]> {
  const res = await axios.get<BoostRequest[]>(`${API_URL}/boosts/mine`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

export async function updateBoostScreenshot(
  token: string,
  boostId: string,
  screenshotUrl: string,
): Promise<void> {
  await axios.patch(
    `${API_URL}/boosts/${boostId}/screenshot`,
    { screenshotUrl },
    { headers: { Authorization: `Bearer ${token}` } },
  );
}

export async function presignBoostScreenshot(
  token: string,
  filename: string,
  contentType: string,
): Promise<{ key: string; url: string }> {
  const res = await axios.post<{ key: string; url: string }>(
    `${API_URL}/uploads/presign-boost-screenshot`,
    { filename, contentType },
    { headers: { Authorization: `Bearer ${token}` } },
  );
  return res.data;
}
