// Public-facing website URL, used to build shareable property links (WhatsApp, share sheet, etc.)
// Injected via EAS build profile or .env file.
export const WEB_URL =
  process.env.EXPO_PUBLIC_WEB_URL ?? "https://okapi-real-estate.com";

export function getPropertyUrl(propertyId: string) {
  return `${WEB_URL}/property/${propertyId}`;
}
