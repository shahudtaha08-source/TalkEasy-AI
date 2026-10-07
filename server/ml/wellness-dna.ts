import type { DailyFeature, DnaTraitInsight, WellnessDnaData } from "@shared/ml-types";
import { clamp, cvPct, mean, pearson, round, std } from "./stats";

/**
 * "Wellness DNA": longitudinal behavioural traits derived from the user's own
 * records (consistency scores, mood/stress stability, recovery after
 * high-stress days). Informational only — never a diagnostic claim.
 */

const MIN_DAYS = 7;

function tierOf(score: number): DnaTraitInsight["tier"] {
  return score >= 70 ? "strong" : score >= 40 ? "developing" : "emerging";
}

function values(features: DailyFeature[], key: keyof DailyFeature): number[] {
  return features.map((f) => f[key]).filter((v): v is number => typeof v === "number");
}

function consistencyTrait(features: DailyFeature[], key: keyof DailyFeature, traitKey: DnaTraitInsight["traitKey"]): DnaTraitInsight | null {
  const xs = values(features, key);
  if (xs.length < 5) return null;
  const score = Math.round(clamp(100 - cvPct(xs), 0, 100));
  return { traitKey, score, tier: tierOf(score), n: xs.length };
}

function stabilityTrait(features: DailyFeature[], key: keyof DailyFeature, traitKey: DnaTraitInsight["traitKey"]): DnaTraitInsight | null {
  const xs = values(features, key);
  if (xs.length < 5) return null;
  const score = Math.round(clamp(100 - std(xs) * 20, 0, 100));
  return { traitKey, score, tier: tierOf(score), n: xs.length };
}

function habitTrait(features: DailyFeature[]): DnaTraitInsight | null {
  const recorded = features.filter((f) => typeof f.habits === "number");
  if (recorded.length < 5) return null;
  const coverage = recorded.length / Math.max(features.length, 1);
  const completion = mean(recorded.map((f) => f.habits!)) / 100;
  const score = Math.round(clamp(coverage * 70 + completion * 30, 0, 100));
  return { traitKey: "mlDnaHabitConsistency", score, tier: tierOf(score), n: recorded.length };
}

function recoveryTrait(features: DailyFeature[]): DnaTraitInsight | null {
  const moodAt = (index: number): number | undefined => {
    for (let i = index; i < Math.min(index + 2, features.length); i++) {
      const m = features[i].mood;
      if (typeof m === "number") return m;
    }
    return undefined;
  };
  const calmMoods: number[] = [];
  const tenseMoods: number[] = [];
  for (let i = 0; i < features.length; i++) {
    const stress = features[i].stress;
    if (typeof stress !== "number") continue;
    const mood = moodAt(i);
    if (mood === undefined) continue;
    if (stress >= 6.5) tenseMoods.push(mood);
    else if (stress <= 3.5) calmMoods.push(mood);
  }
  if (tenseMoods.length < 3 || calmMoods.length < 3) return null;
  const score = Math.round(clamp(50 + (mean(calmMoods) - mean(tenseMoods)) * 18, 0, 100));
  return { traitKey: "mlDnaRecovery", score, tier: tierOf(score), n: tenseMoods.length + calmMoods.length };
}

export function buildWellnessDna(features: DailyFeature[]): WellnessDnaData | null {
  if (features.length < MIN_DAYS) return null;

  const traits: DnaTraitInsight[] = [];
  const push = (t: DnaTraitInsight | null) => {
    if (t) traits.push(t);
  };

  push(consistencyTrait(features, "sleep", "mlDnaSleepConsistency"));
  push(stabilityTrait(features, "mood", "mlDnaMoodStability"));
  push(stabilityTrait(features, "stress", "mlDnaStressVariability"));
  push(consistencyTrait(features, "water", "mlDnaHydrationConsistency"));
  push(habitTrait(features));
  push(consistencyTrait(features, "steps", "mlDnaActivityConsistency"));
  push(recoveryTrait(features));

  if (traits.length === 0) return null;
  return { sampleDays: features.length, traits };
}

/** Correlation used by the evaluation script to verify mood/stress linkage. */
export function moodStressLink(features: DailyFeature[]): number {
  const xs: number[] = [];
  const ys: number[] = [];
  for (const f of features) {
    if (typeof f.stress === "number" && typeof f.mood === "number") {
      xs.push(f.stress);
      ys.push(f.mood);
    }
  }
  return pearson(xs, ys);
}
