import { useQuery } from "@tanstack/react-query";
import { getFavourites } from "../services/auth";
import { useAuthStore } from "../store/useAuthStore";

export function useFavouriteIds(): Set<string> {
  const { token, isAuthenticated } = useAuthStore();
  const { data } = useQuery({
    queryKey: ["favourites"],
    queryFn: () => getFavourites(token!),
    enabled: !!token && isAuthenticated,
  });
  return new Set((data ?? []).map((f) => f.propertyId));
}
