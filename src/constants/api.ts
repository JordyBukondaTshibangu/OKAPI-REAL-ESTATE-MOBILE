// Injected via EAS build profile or .env file.
// Production builds MUST set EXPO_PUBLIC_API_URL to the production endpoint.
if (!process.env.EXPO_PUBLIC_API_URL) {
  console.warn("[API] EXPO_PUBLIC_API_URL is not set — falling back to localhost. Do NOT ship this build.");
}

export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8080";
