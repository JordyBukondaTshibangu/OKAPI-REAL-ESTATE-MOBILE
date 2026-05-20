import axios from "axios";
import { API_URL } from "../constants/api";
import type { Agency } from "../types/agency";

export type AgencyParams = { page?: number; limit?: number; name?: string; language?: string; };

export async function fetchAgencies(params: AgencyParams = {}): Promise<{ data: Agency[]; meta: any }> {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v !== undefined) query.set(k, String(v)); });
  const res = await axios.get(`${API_URL}/agencies?${query.toString()}`);
  const json = res.data;
  return { data: Array.isArray(json) ? json : (json.data ?? []), meta: json.meta ?? {} };
}

export async function fetchAgencyById(id: string): Promise<Agency> {
  const res = await axios.get(`${API_URL}/agencies/${id}`);
  return res.data;
}
