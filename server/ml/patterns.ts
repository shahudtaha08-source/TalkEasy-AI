import type { DailyFeature, FeatureKey, PairKey, PatternInsight, PatternsData } from "@shared/ml-types";
import { pearson, permutationPValue } from "./stats";

/**
 * Correlation discovery over a fixed whitelist of meaningful wellness pairs.
 * Pearson r + deterministic permutation test; "correlation, not causation"
 * wording is applied by the client.
 */

const PAIRS: { a: FeatureKey; b: FeatureKey; key: PairKey }[] = [
  { a: "sleep", b: "mood", key: "mlPairSleepMood" },
  { a: "sleep", b: "stress", key: "mlPairSleepStress" },
  { a: "water", b: "stress", key: "mlPairWaterStress" },
  { a: "habits", b: "mood", key: "mlPairHabitsMood" },
  { a: "steps", b: "mood", key: "mlPairStepsMood" },
  { a: "water", b: "mood", key: "mlPairWaterMood" },
  { a: "stress", b: "mood", key: "mlPairStressMood" },
];

export const MIN_PATTERN_DAYS = 7;
const MIN_R = 0.4;
const MAX_P = 0.05;
const PERMUTATIONS = 300;

function pairedValues(features: DailyFeature[], a: FeatureKey, b: FeatureKey): { xs: number[]; ys: number[] } {
  const xs: number[] = [];
  const ys: number[] = [];
  for (const f of features) {
    const va = f[a];
    const vb = f[b];
    if (typeof va === "number" && typeof vb === "number") {
      xs.push(va);
      ys.push(vb);
    }
  }
  return { xs, ys };
}

export function findPatterns(features: DailyFeature[]): PatternsData {
  const found: PatternInsight[] = [];
  for (const pair of PAIRS) {
    const { xs, ys } = pairedValues(features, pair.a, pair.b);
    if (xs.length < MIN_PATTERN_DAYS) continue;
    const r = pearson(xs, ys);
    if (Math.abs(r) < MIN_R) continue;
    const pValue = permutationPValue(xs, ys, PERMUTATIONS);
    if (pValue > MAX_P) continue;
    found.push({
      pairKey: pair.key,
      direction: r >= 0 ? "together" : "opposite",
      r: Math.round(r * 100) / 100,
      pValue: Math.round(pValue * 1000) / 1000,
      n: xs.length,
    });
  }
  found.sort((a, b) => Math.abs(b.r) - Math.abs(a.r));
  return { sampleDays: features.length, patterns: found };
}
