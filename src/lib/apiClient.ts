/**
 * apiClient — configures global Axios interceptors once at app startup.
 *
 * Call `setupApiInterceptors()` from _layout.tsx before the first render.
 * After that, every `axios.get/post/patch/delete` call in the app automatically:
 *
 *  1. Has the Bearer token attached from whichever session is active.
 *  2. On a 401 response, both sessions are cleared and the user is sent to
 *     the login screen — no more "silent stuck state" when a token expires.
 *
 * Also exports a pre-configured axios instance (`apiClient`) for new code
 * that doesn't need the token parameter pattern.
 */

import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { router } from "expo-router";
import { API_URL } from "../constants/api";
import { useAuthStore } from "../store/useAuthStore";
import { useAgentSessionStore } from "../store/useAgentSessionStore";

// ── Pre-configured instance (for new service code) ───────────────────────────

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 15_000,
  headers: { "Content-Type": "application/json" },
});

// ── Interceptor factory (applied to both global axios + apiClient) ───────────

let isHandling401 = false;

function addRequestInterceptor(instance: typeof axios | ReturnType<typeof axios.create>) {
  instance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      // If Authorization already set (legacy services pass it manually), keep it.
      if (config.headers?.Authorization) return config;
      const userToken  = useAuthStore.getState().token;
      const agentToken = useAgentSessionStore.getState().token;
      const token = userToken ?? agentToken;
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error),
  );
}

function addResponseInterceptor(instance: typeof axios | ReturnType<typeof axios.create>) {
  instance.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      if (error.response?.status === 401 && !isHandling401) {
        isHandling401 = true;
        useAuthStore.getState().logout();
        useAgentSessionStore.getState().logout();
        setTimeout(() => {
          try { router.replace("/(auth)/connexion"); } catch { /* ignore */ }
          isHandling401 = false;
        }, 100);
      }
      return Promise.reject(error);
    },
  );
}

// ── Apply to apiClient instance ───────────────────────────────────────────────

addRequestInterceptor(apiClient);
addResponseInterceptor(apiClient);

// ── Apply to global axios (covers all legacy service calls) ──────────────────

export function setupApiInterceptors() {
  addRequestInterceptor(axios);
  addResponseInterceptor(axios);
}

export default apiClient;
