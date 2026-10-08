/**
 * envGuard — clears auth tokens and cached data when the app's API environment
 * changes (e.g. a tester who had the QA build installs the production build).
 *
 * Call at module-level in _layout.tsx (before Zustand stores hydrate) so the
 * stores boot clean when the environment has changed.
 *
 * Keys that ARE cleared on env change (environment-specific data):
 *   okapi-auth            — user JWT + profile (QA tokens don't work on prod)
 *   okapi-agent-session   — agent JWT + profile
 *   okapi_query_cache_v1  — TanStack Query cache (QA property/agent data)
 *
 * Keys that are NOT cleared (user preferences, safe to keep):
 *   okapi-theme           — light/dark preference
 *   okapi-locale-v2       — language preference (fr/en/ln)
 *   okapi-onboarding      — whether onboarding was completed
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

const ENV_STAMP_KEY  = "okapi_env_stamp";
const CURRENT_ENV    = process.env.EXPO_PUBLIC_API_URL ?? "unknown";

// All keys that hold environment-scoped data
const ENV_SENSITIVE_KEYS = [
  "okapi-auth",
  "okapi-agent-session",
  "okapi_query_cache_v1",
];

/**
 * Run once at cold start. If the stored environment stamp doesn't match the
 * current API URL, wipe all environment-sensitive AsyncStorage keys and update
 * the stamp. Returns a promise so it can be awaited before the splash hides.
 */
export async function clearIfEnvChanged(): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(ENV_STAMP_KEY);
    if (stored === CURRENT_ENV) return; // Same env — nothing to do

    // Environment changed (or first install): wipe sensitive keys in parallel
    await Promise.all(
      ENV_SENSITIVE_KEYS.map((key) => AsyncStorage.removeItem(key))
    );

    // Write the new stamp so we don't clear again next launch
    await AsyncStorage.setItem(ENV_STAMP_KEY, CURRENT_ENV);
  } catch {
    // AsyncStorage failure is non-fatal — app continues normally
  }
}
