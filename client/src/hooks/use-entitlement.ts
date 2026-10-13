import { useQuery } from "@tanstack/react-query";
import type { EntitlementStatus } from "@shared/entitlement";

export const ENTITLEMENT_QUERY_KEY = ["/api/entitlement"] as const;

/**
 * Server-authoritative entitlement. The trial start is recorded on the server,
 * so clearing client storage cannot restart it.
 */
export function useEntitlement() {
  return useQuery<EntitlementStatus | null>({
    queryKey: [...ENTITLEMENT_QUERY_KEY],
    queryFn: async () => {
      const res = await fetch("/api/entitlement", { credentials: "include" });
      if (res.status === 401) return null;
      if (!res.ok) throw new Error("Failed to load entitlement");
      return (await res.json()) as EntitlementStatus;
    },
    staleTime: 1000 * 60 * 5,
  });
}
