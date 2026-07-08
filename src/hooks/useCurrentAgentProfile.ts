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
  const { token, agent: storedAgent, setAgent, isAuthenticated } = useAgentSessionStore();

  const query = useQuery({
    queryKey:  ["agentProfile", token],
    queryFn:   () => getAgentMe(token!),
    enabled:   isAuthenticated && !!token,
    staleTime: 1_000 * 60 * 5,
    retry:     1,
  });

  // Keep Zustand in sync when fresh server data arrives
  useEffect(() => {
    if (query.data) {
      setAgent(query.data);
    }
  }, [query.data]);

  return {
    agent:      query.data ?? storedAgent,
    isLoading:  query.isLoading,
    isFetching: query.isFetching,
    refetch:    query.refetch,
    error:      query.error,
  };
}
