import { useQuery } from "@tanstack/react-query";
import { fetchProperties, type PropertyParams } from "../services/properties";

export function useProperties(params: PropertyParams = {}) {
  return useQuery({
    queryKey: ["properties", params],
    queryFn: () => fetchProperties(params),
  });
}
