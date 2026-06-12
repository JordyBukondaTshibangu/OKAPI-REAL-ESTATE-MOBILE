import * as Location from "expo-location";

export type GeocodedLocation = {
  latitude: number;
  longitude: number;
  /** Which part of the address matched — drives the "approximate" circle size */
  precision: "neighborhood" | "suburb" | "city";
};

const COUNTRY = "République Démocratique du Congo";

/**
 * Geocodes a property's address text (no GPS coords in backend yet).
 * Tries the most specific address first, then falls back.
 */
export async function geocodeProperty(parts: {
  neighborhood?: string | null;
  suburb?: string | null;
  city?: string | null;
}): Promise<GeocodedLocation | null> {
  const attempts: { query: string; precision: GeocodedLocation["precision"] }[] = [];

  if (parts.neighborhood && parts.suburb && parts.city)
    attempts.push({ query: `${parts.neighborhood}, ${parts.suburb}, ${parts.city}, ${COUNTRY}`, precision: "neighborhood" });
  if (parts.suburb && parts.city)
    attempts.push({ query: `${parts.suburb}, ${parts.city}, ${COUNTRY}`, precision: "suburb" });
  if (parts.city)
    attempts.push({ query: `${parts.city}, ${COUNTRY}`, precision: "city" });

  for (const { query, precision } of attempts) {
    try {
      const results = await Location.geocodeAsync(query);
      if (results.length > 0) {
        const { latitude, longitude } = results[0];
        return { latitude, longitude, precision };
      }
    } catch {
      // geocoder unavailable — try next / give up
    }
  }
  return null;
}
