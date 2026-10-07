import type { DailyFeature, FeatureKey, ForecastPoint, ForecastSeriesInsight, ForecastsData } from "@shared/ml-types";
import { METRIC_KEYS } from "@shared/ml-types";
import { clamp, mean, round } from "./stats";

/**
 * Short-term univariate forecasting per metric.
 *
 * Holt's linear trend is back-tested against a seasonal-naive baseline
 * (same weekday last week); the better model is reported and used for the
 * 7-day projection. Purely informational.
 */

const FORECAST_FEATURES: FeatureKey[] = ["sleep", "mood", "stress", "water"];
const MIN_OBSERVED = 12;
const MIN_COVERAGE = 0.4;
const HORIZON = 7;
const DAY_MS = 86400000;

const RANGE: Record<string, [number, number]> = {
  sleep: [0, 16],
  mood: [1, 10],
  stress: [1, 10],
  water: [0, 15000],
};

function isoAt(startMs: number, dayIndex: number): string {
  return new Date(startMs + dayIndex * DAY_MS).toISOString().slice(0, 10);
}

function roundValue(feature: FeatureKey, x: number): number {
  return feature === "water" ? Math.round(x) : round(x, 1);
}

interface DenseSeries {
  points: ForecastPoint[];
  values: number[];
  observed: number;
}

function denseSeries(features: DailyFeature[], key: FeatureKey): DenseSeries | null {
  const observed = new Map<string, number>();
  for (const f of features) {
    const v = f[key];
    if (typeof v === "number") observed.set(f.date, v);
  }
  if (observed.size < MIN_OBSERVED) return null;

  const dates = Array.from(observed.keys()).sort();
  const startMs = Date.parse(dates[0]);
  const endMs = Date.parse(dates[dates.length - 1]);
  const n = Math.floor((endMs - startMs) / DAY_MS) + 1;
  if (n < MIN_OBSERVED) return null;
  if (observed.size / n < MIN_COVERAGE) return null;

  const byIndex = new Map<number, number>();
  observed.forEach((v, d) => byIndex.set(Math.round((Date.parse(d) - startMs) / DAY_MS), v));

  const points: ForecastPoint[] = [];
  for (let i = 0; i < n; i++) {
    let value: number;
    if (byIndex.has(i)) {
      value = byIndex.get(i)!;
    } else {
      let prev = i - 1;
      while (prev >= 0 && !byIndex.has(prev)) prev--;
      let next = i + 1;
      while (next < n && !byIndex.has(next)) next++;
      if (prev >= 0 && next < n) {
        const t = (i - prev) / (next - prev);
        value = byIndex.get(prev)! + t * (byIndex.get(next)! - byIndex.get(prev)!);
      } else if (prev >= 0) {
        value = byIndex.get(prev)!;
      } else {
        value = byIndex.get(next)!;
      }
    }
    points.push({ date: isoAt(startMs, i), value });
  }
  return { points, values: points.map((p) => p.value), observed: observed.size };
}

function holtFit(train: number[], alpha = 0.4, beta = 0.1): { level: number; slope: number } {
  let level = train[0];
  let slope = train.length > 1 ? train[1] - train[0] : 0;
  for (let i = 1; i < train.length; i++) {
    const pred = level + slope;
    const newLevel = alpha * train[i] + (1 - alpha) * pred;
    const newSlope = beta * (newLevel - level) + (1 - beta) * slope;
    level = newLevel;
    slope = newSlope;
  }
  return { level, slope };
}

function olsSlope(values: number[]): number {
  const n = values.length;
  if (n < 3) return 0;
  const mx = (n - 1) / 2;
  const my = mean(values);
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (i - mx) * (values[i] - my);
    den += (i - mx) * (i - mx);
  }
  return den === 0 ? 0 : num / den;
}

function mae(actual: number[], predicted: number[]): number {
  let acc = 0;
  for (let i = 0; i < actual.length; i++) acc += Math.abs(actual[i] - predicted[i]);
  return acc / Math.max(actual.length, 1);
}

function forecastFor(feature: FeatureKey, values: number[], points: ForecastPoint[]): ForecastSeriesInsight | null {
  const n = values.length;
  if (n < MIN_OBSERVED) return null;
  const holdout = Math.min(HORIZON, Math.max(3, Math.floor(n / 4)));
  const m = n - holdout;
  if (m < 8) return null;

  const train = values.slice(0, m);
  const test = values.slice(m);

  const holt = holtFit(train);
  const holtPred: number[] = [];
  for (let t = 1; t <= holdout; t++) holtPred.push(holt.level + t * holt.slope);

  const trainMean = mean(train);
  const naivePred: number[] = [];
  for (let i = m; i < n; i++) naivePred.push(i >= 7 ? values[i - 7] : trainMean);

  const holtMae = mae(test, holtPred);
  const naiveMae = mae(test, naivePred);
  const model: "holt" | "seasonal-naive" = holtMae <= naiveMae ? "holt" : "seasonal-naive";
  const chosenMae = model === "holt" ? holtMae : naiveMae;

  const next7: ForecastPoint[] = [];
  const lastDate = Date.parse(points[n - 1].date);
  if (model === "holt") {
    const fit = holtFit(values);
    for (let t = 1; t <= HORIZON; t++) {
      const raw = fit.level + t * fit.slope;
      const [lo, hi] = RANGE[feature] ?? [-Infinity, Infinity];
      next7.push({ date: isoAt(lastDate, t), value: roundValue(feature, clamp(raw, lo, hi)) });
    }
  } else {
    for (let t = 1; t <= HORIZON; t++) {
      next7.push({ date: isoAt(lastDate, t), value: values[n - HORIZON + ((t - 1) % HORIZON)] });
    }
  }

  const slope = olsSlope(values);
  const m2 = mean(values);
  const relative = m2 === 0 ? 0 : (slope * HORIZON) / Math.abs(m2);
  const trend: "rising" | "falling" | "stable" = Math.abs(relative) < 0.03 ? "stable" : relative > 0 ? "rising" : "falling";

  const forecastValues = next7.map((p) => p.value);
  return {
    metricKey: METRIC_KEYS[feature],
    feature,
    model,
    points: n,
    mae: round(chosenMae, 2),
    baselineMae: round(naiveMae, 2),
    improvementPct: model === "holt" ? round(((naiveMae - holtMae) / Math.max(naiveMae, 1e-9)) * 100, 1) : 0,
    trend,
    low: Math.min(...forecastValues),
    high: Math.max(...forecastValues),
    next7,
    history: points.slice(-14),
  };
}

export function forecastSeries(features: DailyFeature[]): ForecastsData {
  const series: ForecastSeriesInsight[] = [];
  for (const feature of FORECAST_FEATURES) {
    const dense = denseSeries(features, feature);
    if (!dense) continue;
    const insight = forecastFor(feature, dense.values, dense.points);
    if (insight) series.push(insight);
  }
  return { sampleDays: features.length, days: HORIZON, series };
}
