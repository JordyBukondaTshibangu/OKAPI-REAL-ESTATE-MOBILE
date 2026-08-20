/**
 * Shared helper used by every onboarding step's "Skip" and "Finish later"
 * buttons to land the user on the search screen pre-filtered by the choices
 * they already made (intent → listingType, propertyType → category, first
 * selected area → suburb). Falls back to the home tab when no choices exist.
 */
import { router } from "expo-router";
import { useOnboardingStore } from "../store/useOnboardingStore";

export function redirectAfterOnboarding() {
  const { intent, propertyType, selectedAreas } = useOnboardingStore.getState();

  const params: Record<string, string> = {};

  // intent → listingType tab on acheter
  if (intent === "rent") params.listingType = "rent";
  else if (intent === "buy") params.listingType = "sale";
  // "invest" → no listingType filter (show all, commercial mostly)

  // property type → category filter
  if (propertyType) params.category = propertyType;

  // first selected neighbourhood (acheter filter accepts one suburb)
  if (selectedAreas.length > 0) params.suburb = selectedAreas[0];

  const hasFilters = Object.keys(params).length > 0;

  if (hasFilters) {
    router.replace({ pathname: "/(tabs)/acheter" as any, params });
  } else {
    router.replace("/(tabs)" as any);
  }
}
