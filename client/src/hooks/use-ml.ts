import { useQuery } from "@tanstack/react-query";
import { isDemoMode } from "@/lib/demo-data";
import type {
  AnomaliesData,
  ClustersData,
  ConfidenceAssessment,
  ForecastsData,
  MlEnvelope,
  PatternsData,
  WellnessDnaData,
} from "@shared/ml-types";

/**
 * React Query hooks for the authenticated /api/ml/* endpoints.
 * Demo mode and failures resolve to `null` so pages can fall back to their
 * deterministic insights instead of showing errors.
 */

async function fetchMl<T>(path: string): Promise<MlEnvelope<T> | null> {
  if (isDemoMode()) return { status: "insufficient" };
  try {
    const res = await fetch(path, { credentials: "include" });
    if (!res.ok) return null;
    return (await res.json()) as MlEnvelope<T>;
  } catch {
    return null;
  }
}

function useMlQuery<T>(path: string) {
  return useQuery({
    queryKey: [path],
    queryFn: () => fetchMl<T>(path),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}

export function useMlPatterns() {
  return useMlQuery<PatternsData>("/api/ml/patterns");
}

export function useMlAnomalies() {
  return useMlQuery<AnomaliesData>("/api/ml/anomalies");
}

export function useMlClusters() {
  return useMlQuery<ClustersData>("/api/ml/clusters");
}

export function useMlForecasts() {
  return useMlQuery<ForecastsData>("/api/ml/forecasts");
}

export function useMlConfidence() {
  return useMlQuery<ConfidenceAssessment>("/api/ml/confidence");
}

export function useMlWellnessDna() {
  return useMlQuery<WellnessDnaData>("/api/ml/wellness-dna");
}
