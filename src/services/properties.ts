import axios from "axios";
import { API_URL } from "../constants/api";
import type { Property, PropertyDetail, PropertyPerformance } from "../types/property";
import { getOrCreateDeviceSessionId } from "../lib/session";

export type PropertyParams = {
  listingType?: string;
  category?: string;
  city?: string;
  suburb?: string;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  limit?: number;
  agentId?: string;
  agencyId?: string;
  /** Free-text search across title, subtitle, description, location, category, agent/agency name. */
  search?: string;
  isShortTerm?: boolean;
  isLongTerm?: boolean;
  rentalDuration?: "short" | "long" | "both";
  minNightPrice?: number;
  maxNightPrice?: number;
  minStay?: number;
  maxStay?: number;
};

export async function fetchProperties(
  params: PropertyParams = {},
): Promise<{ data: Property[]; meta: any }> {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([k, v]) => {
    // Skip UI-only params the backend doesn't know about
    if (k === "rentalDuration") return;
    if (v !== undefined && v !== null) query.set(k, String(v));
  });

  const res = await axios.get(`${API_URL}/properties?${query.toString()}`);

  const json = res.data;
  return {
    data: Array.isArray(json) ? json : (json.data ?? []),
    meta: json.meta ?? {},
  };
}

export async function fetchPropertyById(id: string): Promise<PropertyDetail> {
  const res = await axios.get(`${API_URL}/properties/${id}`);
  return res.data;
}

/**
 * Builds tracking headers.
 * - userId: the logged-in agent's id — deduplicates permanently across devices
 * - Falls back to a device-level session UUID for anonymous visitors
 */
async function trackingHeaders(userId?: string): Promise<Record<string, string>> {
  if (userId) return { "x-user-id": userId };
  const sessionId = await getOrCreateDeviceSessionId();
  return sessionId ? { "x-session-id": sessionId } : {};
}

/** Records a page view. Deduplicates by userId (logged-in) or device session. */
export async function recordPropertyView(id: string, userId?: string): Promise<PropertyPerformance> {
  const headers = await trackingHeaders(userId);
  const res = await axios.post(`${API_URL}/properties/${id}/view`, {}, { headers });
  return res.data;
}

/** Records a share. Deduplicates by userId (logged-in) or device session. */
export async function recordPropertyShare(id: string, userId?: string): Promise<PropertyPerformance> {
  const headers = await trackingHeaders(userId);
  const res = await axios.post(`${API_URL}/properties/${id}/share`, {}, { headers });
  return res.data;
}

/** Records a WhatsApp tap. Deduplicates by userId (logged-in) or device session. */
export async function recordPropertyWhatsAppClick(id: string, userId?: string): Promise<PropertyPerformance | null> {
  try {
    const headers = await trackingHeaders(userId);
    const res = await axios.post(`${API_URL}/properties/${id}/whatsapp-click`, {}, { headers });
    return res.data;
  } catch {
    return null;
  }
}
