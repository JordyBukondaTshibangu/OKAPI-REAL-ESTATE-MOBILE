/**
 * useCurrentUser
 *
 * Fetches the logged-in user's profile from the server and keeps the
 * Zustand auth store in sync. Returns the latest server data directly so
 * screens always show fresh values without a manual reload.
 *
 * - Only runs when the user is authenticated (token present).
 * - staleTime: 5 min  (set via QueryClient.setQueryDefaults)
 * - Revalidates on foreground (handled by QueryProvider's AppState listener).
 */
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { getMe } from "../services/auth";
import type { User } from "../types/user";

export function useCurrentUser() {
  const { token, user: storedUser, isAuthenticated } = useAuthStore();

  const query = useQuery<User>({
    queryKey:  ["currentUser", token],
    queryFn:   () => getMe(token!),
    enabled:   isAuthenticated && !!token,
    staleTime: 1_000 * 60 * 5,
    retry:     1,
  });

  // Keep Zustand in sync when fresh server data arrives
  useEffect(() => {
    if (query.data) {
      // setUser updates the stored user without changing the token
      useAuthStore.getState().setUser(query.data);
    }
  }, [query.data]);

  // Return the server-fresh data, falling back to the Zustand snapshot
  return {
    user:      query.data ?? storedUser,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    refetch:   query.refetch,
    error:     query.error,
  };
}
