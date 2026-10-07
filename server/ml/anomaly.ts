import type { AnomaliesData, AnomalyInsight, DailyFeature, FeatureKey, MetricKey } from "@shared/ml-types";
import { METRIC_KEYS } from "@shared/ml-types";
import { mad, median } from "./stats";

/**
 * Robust personal-baseline anomaly detection: median/MAD z-scores per metric.
 * A day is unusual relative to the user's own recent history, not to a
 * population norm.
 */

const METRIC_ORDER: FeatureKey[] = ["mood", "stress", "sleep", "water", "habits", "steps"];
const MIN_POINTS = 8;
const Z_THRESHOLD = 3.0;
const MAX_ANOMALIES = 8;

export function findAnomalies(features: DailyFeature[]): AnomaliesData {
  const candidates: AnomalyInsight[] = [];

  for (const feature of METRIC_ORDER) {
    const points = features
      .map((f) => ({ date: f.date, value: f[feature] }))
      .filter((p): p is { date: string; value: number } => typeof p.value === "number");
    if (points.length < MIN_POINTS) continue;

    const values = points.map((p) => p.value);
    const med = median(values);
    const scale = mad(values);
    if (scale <= 0) continue;

    for (const p of points) {
      const z = (0.6749 * (p.value - med)) / scale;
      if (Math.abs(z) < Z_THRESHOLD) continue;
      candidates.push({
        metricKey: METRIC_KEYS[feature] as MetricKey,
        feature,
        direction: p.value >= med ? "high" : "low",
        date: p.date,
        value: p.value,
        zScore: Math.round(z * 10) / 10,
      });
    }
  }

  candidates.sort((a, b) => Math.abs(b.zScore) - Math.abs(a.zScore));
  return { sampleDays: features.length, anomalies: candidates.slice(0, MAX_ANOMALIES) };
}
