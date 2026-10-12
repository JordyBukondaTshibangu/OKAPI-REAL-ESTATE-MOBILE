/**
 * useCurrentAgentProfile
 *
 * Fetches the logged-in agent's full profile from the server and keeps
 * the Zustand agent session store in sync.
 *
 * - Only runs when the agent is authenticated (token present).
 * - staleTime: 5 min  (set via QueryClient.setQueryDefaults)
 * - Revalidates on foreground (handled by QueryProvider's AppState listener).
 */
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useAgentSessionStore } from "../store/useAgentSessionStore";
import { getAgentMe } from "../services/agentAuth";

export function useCurrentAgentProfile() {
  const {
    token,
    agent: storedAgent,
    setAgent,
    isAuthenticated,
  } = useAgentSessionStore();

  const query = useQuery({
    queryKey: ["agentProfile", token],
    queryFn: () => getAgentMe(token!),
    enabled: isAuthenticated && !!token,
    staleTime: 1_000 * 60 * 5,
    retry: 1,
  });

  // Keep Zustand in sync when fresh server data arrives
  useEffect(() => {
    if (query.data) {
      setAgent(query.data);
    }
  }, [query.data]);

  // Prefer the store's photo over potentially-stale query cache.
  // This ensures an upload in profil.tsx (which calls setAgent immediately)
  // is reflected everywhere without waiting for the next network refetch.
  const agent = query.data
    ? { ...query.data, photo: storedAgent?.photo ?? query.data.photo }
    : storedAgent;

  return {
    agent,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    refetch: query.refetch,
    error: query.error,
  };
}
