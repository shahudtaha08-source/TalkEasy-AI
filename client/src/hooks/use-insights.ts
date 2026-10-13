import { useQuery, type QueryClient } from "@tanstack/react-query";
import type { InsightBundle, InsightPeriod, InsightSource } from "@shared/insights";

/** Prefix shared by every insight query key (see `useInsights`). */
export const INSIGHTS_QUERY_PREFIX = ["/api/insights"] as const;

/**
 * Marks all cached insight bundles stale and refetches the active ones.
 * Call this after any successful wellness mutation so a freshly saved entry is
 * reflected on the insights screen immediately instead of after the 2-minute
 * stale window. Both sources are invalidated together, but each query still
 * fetches exactly one source, so wellness and wearable data never merge.
 */
export function invalidateInsightQueries(queryClient: QueryClient): void {
  void queryClient.invalidateQueries({ queryKey: [...INSIGHTS_QUERY_PREFIX] });
}

export type InsightsResponse =
  | { kind: "ok"; bundle: InsightBundle }
  | { kind: "premium_required" }
  | { kind: "unauthorized" }
  | { kind: "error"; message: string };

/** local−UTC offset in minutes (e.g. +330 for IST). */
export function localTzOffsetMinutes(): number {
  return -new Date().getTimezoneOffset();
}

/**
 * Fetches a single insight bundle for exactly one data source and period.
 * The two sources are served by separate endpoints, so this hook cannot mix
 * wellness and wearable data.
 */
export function useInsights(source: InsightSource, period: InsightPeriod) {
  return useQuery<InsightsResponse>({
    queryKey: ["/api/insights", source, period],
    queryFn: async () => {
      const tz = localTzOffsetMinutes();
      const res = await fetch(`/api/insights/${source}/${period}?tzOffsetMinutes=${tz}`, {
        credentials: "include",
      });
      if (res.status === 401) return { kind: "unauthorized" };
      if (res.status === 402) return { kind: "premium_required" };
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        return { kind: "error", message: body?.message || "Failed to load insights" };
      }
      return { kind: "ok", bundle: (await res.json()) as InsightBundle };
    },
    staleTime: 1000 * 60 * 2,
  });
}
