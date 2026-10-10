/**
 * Sentry crash reporting initialisation.
 *
 * ── Setup (one-time, in your terminal) ──────────────────────────────────────
 *
 *   npx expo install @sentry/react-native
 *   npx @sentry/wizard@latest -i reactNative   ← sets up app.json plugin + source maps
 *
 * Then:
 *   1. Go to https://sentry.io → your project → Settings → Client Keys (DSN)
 *   2. Replace the SENTRY_DSN placeholder below with your real DSN.
 *   3. Uncomment the Sentry.wrap() call in app/_layout.tsx.
 *
 * ── What this gives you ──────────────────────────────────────────────────────
 *   - Automatic crash capture (JS errors + native crashes via the Expo plugin)
 *   - Breadcrumbs: last user actions before the crash
 *   - Device info, OS version, app version, environment (production/preview)
 *   - Source-mapped stack traces (set up by the wizard)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import * as Sentry from "@sentry/react-native";
import Constants from "expo-constants";

const SENTRY_DSN = "https://e446ade5f3ae2f5fb960e95c2a9faede@o4512220848128000.ingest.us.sentry.io/4512220857499648";

export function initSentry() {
  // Skip in Expo Go / development so you don't pollute prod events
  if (__DEV__) return;

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: process.env.EXPO_PUBLIC_API_URL?.includes("api-qa")
      ? "qa"
      : process.env.EXPO_PUBLIC_API_URL?.includes("api-dev")
        ? "development"
        : "production",
    release: `okapi-real-estate@${Constants.expoConfig?.version}`,
    // Capture 100% of transactions in prod — tune down if volume is high
    tracesSampleRate: 0.2,
    // Capture 10% of sessions for performance profiling
    profilesSampleRate: 0.1,
    // Attach user context automatically
    autoSessionTracking: true,
  });
}

/**
 * Call after login to associate future events with this user.
 * Call with no arguments (or `clearSentryUser()`) after logout.
 */
export function setSentryUser(user: { id: string; email?: string; name?: string } | null) {
  if (__DEV__) return;
  Sentry.setUser(user);
}
