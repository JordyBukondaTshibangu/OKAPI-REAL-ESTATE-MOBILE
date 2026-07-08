import { useQuery } from "@tanstack/react-query";
import { fetchPropertyById } from "../services/properties";
import type { PropertyDetail } from "../types/property";

export function usePropertyDetail(id: string | undefined) {
  return useQuery<PropertyDetail>({
    queryKey:  ["property", id],
    queryFn:   () => fetchPropertyById(id!),
    enabled:   !!id,
    staleTime: 1_000 * 60 * 2, // 2 min — properties change often
  });
}
