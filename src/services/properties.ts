import axios from "axios";
import { API_URL } from "../constants/api";
import type { Property, PropertyDetail } from "../types/property";

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
};

export async function fetchProperties(
  params: PropertyParams = {},
): Promise<{ data: Property[]; meta: any }> {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([k, v]) => {
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
