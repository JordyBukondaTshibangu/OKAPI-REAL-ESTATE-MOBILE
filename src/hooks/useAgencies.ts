import { useQuery } from "@tanstack/react-query";
import { fetchAgencies, type AgencyParams } from "../services/agencies";

export function useAgencies(params: AgencyParams = {}) {
  return useQuery({
    queryKey: ["agencies", params],
    queryFn: () => fetchAgencies(params),
  });
}
