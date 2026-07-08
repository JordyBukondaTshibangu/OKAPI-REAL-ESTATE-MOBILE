import { useQuery } from "@tanstack/react-query";
import { fetchAgentById } from "../services/agents";
import type { Agent } from "../types/agent";

export function useAgentDetail(id: string | undefined) {
  return useQuery<Agent>({
    queryKey:  ["agent", id],
    queryFn:   () => fetchAgentById(id!),
    enabled:   !!id,
    staleTime: 1_000 * 60 * 10, // 10 min — agent profiles are stable
  });
}
