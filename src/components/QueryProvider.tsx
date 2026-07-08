/**
 * QueryProvider
 *
 * Wraps the app with a TanStack Query client that:
 *  1. Persists the cache to AsyncStorage — cold starts show cached data instantly
 *     while the background refetch runs silently.
 *  2. Refetches on app foreground (AppState "active") — data is always fresh
 *     when the user switches back to the app.
 *  3. Uses per-resource stale times:
 *       properties   → 2 min  (listings change often)
 *       agents       → 10 min (profile data is stable)
 *       agencies     → 10 min
 *       account      → 5 min  (user / agent profile)
 *       default      → 5 min
 */
import React, { useEffect, useRef, useState } from "react";
import { AppState, AppStateStatus } from "react-native";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ─── stale-time constants ────────────────────────────────────────────────────
const MIN = 1_000 * 60;
const STALE = {
  properties: 2  * MIN,
  agents:     10 * MIN,
  agencies:   10 * MIN,
  account:    5  * MIN,
  default:    5  * MIN,
} as const;

function getStaleTime(queryKey: readonly unknown[]): number {
  const first = String(queryKey[0] ?? "");
  if (first === "properties" || first === "property")  return STALE.properties;
  if (first === "agents"     || first === "agent")     return STALE.agents;
  if (first === "agencies"   || first === "agency")    return STALE.agencies;
  if (first === "account"    || first === "currentUser" || first === "agentProfile") return STALE.account;
  return STALE.default;
}

// ─── persister (AsyncStorage) ────────────────────────────────────────────────
const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key:     "okapi_query_cache_v1",
  // Only persist queries that complete successfully and have data
  throttleTime: 1_000,
});

// ─── singleton QueryClient ───────────────────────────────────────────────────
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime:          STALE.default,
      retry:              1,
      retryDelay:         1_500,
      refetchOnMount:     true,
      // gcTime must be ≥ maxAge so persisted data isn't GC'd before it loads
      gcTime:             1_000 * 60 * 60 * 24, // 24 h
    },
  },
});

// Override staleTime per-query via a queryCache observer
queryClient.setQueryDefaults(["properties"],  { staleTime: STALE.properties });
queryClient.setQueryDefaults(["property"],    { staleTime: STALE.properties });
queryClient.setQueryDefaults(["agents"],      { staleTime: STALE.agents });
queryClient.setQueryDefaults(["agent"],       { staleTime: STALE.agents });
queryClient.setQueryDefaults(["agencies"],    { staleTime: STALE.agencies });
queryClient.setQueryDefaults(["agency"],      { staleTime: STALE.agencies });
queryClient.setQueryDefaults(["currentUser"],     { staleTime: STALE.account });
queryClient.setQueryDefaults(["agentProfile"],    { staleTime: STALE.account });
queryClient.setQueryDefaults(["favourites"],      { staleTime: STALE.account });
queryClient.setQueryDefaults(["enquiries"],       { staleTime: STALE.account });
queryClient.setQueryDefaults(["alerts"],          { staleTime: STALE.account });
// Dashboard listing sub-queries — same cadence as properties
queryClient.setQueryDefaults(["agent-listings"],   { staleTime: STALE.properties });
queryClient.setQueryDefaults(["agent-annonces"],   { staleTime: STALE.properties });
queryClient.setQueryDefaults(["agency-listings"],  { staleTime: STALE.properties });
queryClient.setQueryDefaults(["agency-annonces"],  { staleTime: STALE.properties });
queryClient.setQueryDefaults(["agency-agents"],    { staleTime: STALE.agents });
queryClient.setQueryDefaults(["agent-properties"], { staleTime: STALE.properties });

// ─── provider ────────────────────────────────────────────────────────────────
export default function QueryProvider({ children }: { children: React.ReactNode }) {
  // Refetch all active queries when the app comes back to the foreground
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state: AppStateStatus) => {
      if (state === "active") {
        queryClient.invalidateQueries();
      }
    });
    return () => subscription.remove();
  }, []);

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister:      asyncStoragePersister,
        maxAge:         1_000 * 60 * 60 * 24, // 24 h — how long persisted cache stays valid
        buster:         "v1",                 // bump this string to wipe the cache on breaking changes
        dehydrateOptions: {
          shouldDehydrateQuery: (query) =>
            // Only persist successful queries (not loading/error states)
            query.state.status === "success",
        },
      }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}
