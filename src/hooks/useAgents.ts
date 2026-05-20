import { useQuery } from "@tanstack/react-query";
import { fetchAgents, type AgentParams } from "../services/agents";

export function useAgents(params: AgentParams = {}) {
  return useQuery({
    queryKey: ["agents", params],
    queryFn: () => fetchAgents(params),
  });
}
