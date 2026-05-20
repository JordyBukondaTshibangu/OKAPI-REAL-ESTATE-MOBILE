import axios from "axios";
import { API_URL } from "../constants/api";
import type { User } from "../types/user";

const authHeader = (token: string) => ({
  Authorization: `Bearer ${token}`,
});

export async function loginUser(email: string, password: string) {
  const res = await axios.post<{ access_token: string }>(`${API_URL}/auth/login`, { email, password });
  return res.data;
}

export async function registerUser(data: {
  firstName: string; lastName: string;
  email: string; phoneNumber: string; password: string;
}) {
  const res = await axios.post<{ access_token: string }>(`${API_URL}/auth/register`, data);
  return res.data;
}

export async function forgotPassword(email: string) {
  const res = await axios.post(`${API_URL}/auth/forgot-password`, { email });
  return res.data;
}

export async function getMe(token: string): Promise<User> {
  const res = await axios.get<User>(`${API_URL}/users/me`, { headers: authHeader(token) });
  return res.data;
}

export async function updateMe(token: string, data: Partial<Omit<User, "id">>) {
  const res = await axios.patch<User>(`${API_URL}/users/me`, data, { headers: authHeader(token) });
  return res.data;
}

export async function changePassword(token: string, data: { currentPassword: string; newPassword: string }) {
  const res = await axios.patch(`${API_URL}/users/me/password`, data, { headers: authHeader(token) });
  return res.data;
}

export async function uploadAvatar(token: string, uri: string, fileName: string, mimeType: string) {
  const formData = new FormData();
  formData.append("file", { uri, name: fileName, type: mimeType } as any);
  const res = await axios.patch<User>(`${API_URL}/users/me/avatar`, formData, {
    headers: { ...authHeader(token), "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

export async function removeAvatar(token: string) {
  const res = await axios.delete<User>(`${API_URL}/users/me/avatar`, { headers: authHeader(token) });
  return res.data;
}

export async function deleteAccount(token: string) {
  await axios.delete(`${API_URL}/users/me`, { headers: authHeader(token) });
}

// --- Favorites ---
export type Favourite = {
  id: string; propertyId: string;
  property: { id: string; title: string; price: number; imageUrl?: string; location: string; type: string; gallery: string[] };
  createdAt: string;
};

export async function getFavourites(token: string): Promise<Favourite[]> {
  const res = await axios.get<Favourite[]>(`${API_URL}/favorites`, { headers: authHeader(token) });
  return res.data;
}

export async function addFavourite(token: string, propertyId: string) {
  const res = await axios.post(`${API_URL}/favorites`, { propertyId }, { headers: authHeader(token) });
  return res.data;
}

export async function removeFavourite(token: string, propertyId: string) {
  await axios.delete(`${API_URL}/favorites/${propertyId}`, { headers: authHeader(token) });
}

// --- Alerts ---
export type Alert = {
  id: string; name: string; listingType?: string; category?: string;
  city?: string; suburb?: string; minPrice?: number; maxPrice?: number;
  minBedrooms?: number; maxBedrooms?: number; active?: boolean; createdAt: string;
};

export type CreateAlertPayload = Omit<Alert, "id" | "createdAt">;
export type UpdateAlertPayload = Partial<CreateAlertPayload>;

export async function getAlerts(token: string): Promise<Alert[]> {
  const res = await axios.get<Alert[]>(`${API_URL}/alerts`, { headers: authHeader(token) });
  return res.data;
}

export async function createAlert(token: string, data: CreateAlertPayload): Promise<Alert> {
  const res = await axios.post<Alert>(`${API_URL}/alerts`, data, { headers: authHeader(token) });
  return res.data;
}

export async function updateAlert(token: string, id: string, data: UpdateAlertPayload): Promise<Alert> {
  const res = await axios.patch<Alert>(`${API_URL}/alerts/${id}`, data, { headers: authHeader(token) });
  return res.data;
}

export async function deleteAlert(token: string, id: string) {
  await axios.delete(`${API_URL}/alerts/${id}`, { headers: authHeader(token) });
}

// --- Enquiries ---
export type Enquiry = {
  id: string; propertyId: string;
  property?: { id: string; title: string };
  message: string; status: "pending" | "replied" | "closed"; createdAt: string;
};

export async function getEnquiries(token: string): Promise<Enquiry[]> {
  const res = await axios.get<Enquiry[]>(`${API_URL}/enquiries`, { headers: authHeader(token) });
  return res.data;
}

export async function createEnquiry(token: string, data: { propertyId: string; message: string }) {
  const res = await axios.post(`${API_URL}/enquiries`, data, { headers: authHeader(token) });
  return res.data;
}

export async function deleteEnquiry(token: string, id: string) {
  await axios.delete(`${API_URL}/enquiries/${id}`, { headers: authHeader(token) });
}

// --- Reviews ---
export type Review = {
  id: string; propertyId?: string; agentId?: string;
  property?: { id: string; title: string };
  agent?: { id: string; firstName: string; lastName: string };
  rating: number; comment?: string; createdAt: string;
};

export async function getMyReviews(token: string): Promise<Review[]> {
  const res = await axios.get<Review[]>(`${API_URL}/reviews/mine`, { headers: authHeader(token) });
  return res.data;
}

export async function createReview(token: string, data: { propertyId?: string; agentId?: string; rating: number; comment?: string }) {
  const res = await axios.post(`${API_URL}/reviews`, data, { headers: authHeader(token) });
  return res.data;
}

export async function deleteReview(token: string, id: string) {
  await axios.delete(`${API_URL}/reviews/${id}`, { headers: authHeader(token) });
}
