import { useQuery } from "@tanstack/react-query";
import { fetchAgencyById, fetchAgentsByAgency } from "../services/agencies";
import type { Agency } from "../types/agency";
import type { Agent } from "../types/agent";

export function useAgencyDetail(id: string | undefined) {
  return useQuery<Agency>({
    queryKey:  ["agency", id],
    queryFn:   () => fetchAgencyById(id!),
    enabled:   !!id,
    staleTime: 1_000 * 60 * 10,
  });
}

export function useAgencyAgents(agencyId: string | undefined) {
  return useQuery<Agent[]>({
    queryKey:  ["agency", agencyId, "agents"],
    queryFn:   () => fetchAgentsByAgency(agencyId!),
    enabled:   !!agencyId,
    staleTime: 1_000 * 60 * 10,
  });
}
