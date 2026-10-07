import type { ConfidenceAssessment, DailyFeature, FeatureKey } from "@shared/ml-types";
import { clamp, round } from "./stats";

/**
 * Data-quality confidence for ML output: coverage of the tracking window,
 * recency of the newest entry, breadth of metrics and depth per metric.
 * Surfaced to the user so low-confidence insights read with appropriate care.
 */

const TRACKED: FeatureKey[] = ["sleep", "mood", "stress", "water", "habits", "steps"];

export function assessConfidence(features: DailyFeature[], windowDays: number): ConfidenceAssessment {
  const trackedDays = features.length;
  const lastDate = trackedDays > 0 ? features[trackedDays - 1].date : "";
  const daysSinceLast = lastDate ? Math.floor((Date.now() - Date.parse(lastDate)) / 86400000) : Infinity;

  const coverage = clamp(trackedDays / Math.max(windowDays, 1), 0, 1);
  const recency = daysSinceLast <= 3 ? 25 : daysSinceLast <= 7 ? 18 : daysSinceLast <= 14 ? 10 : daysSinceLast === Infinity ? 0 : 3;

  let observedMetrics = 0;
  let depthTotal = 0;
  for (const key of TRACKED) {
    const n = features.filter((f) => typeof f[key] === "number").length;
    if (n >= 5) {
      observedMetrics++;
      depthTotal += clamp(n / Math.max(trackedDays, 1), 0, 1);
    }
  }
  const breadth = (observedMetrics / TRACKED.length) * 25;
  const depth = observedMetrics > 0 ? (depthTotal / observedMetrics) * 15 : 0;

  const score = Math.round(clamp(coverage * 35 + recency + breadth + depth, 0, 100));
  const tier: ConfidenceAssessment["tier"] = score >= 70 ? "high" : score >= 40 ? "moderate" : "low";

  return { score, tier, trackedDays, windowDays };
}
