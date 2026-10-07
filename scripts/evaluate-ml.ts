/**
 * V6.1.2 · ML layer evaluation on synthetic data with known ground truth.
 *
 * Run:  npx tsx scripts/evaluate-ml.ts
 *
 * No database or network access — pure functions only. Exits non-zero when a
 * check fails. Covers: correlation discovery + permutation testing, robust
 * anomaly detection, k-means clustering + silhouette selection, Holt vs
 * seasonal-naive forecasting, confidence tiering, wellness-DNA traits and the
 * insufficient-data guards.
 */
import { buildDailyFeatures } from "../server/ml/feature-engineering";
import type { RawWellnessData } from "../server/ml/feature-engineering";
import { findPatterns } from "../server/ml/patterns";
import { findAnomalies } from "../server/ml/anomaly";
import { clusterDays } from "../server/ml/clustering";
import { forecastSeries } from "../server/ml/forecasting";
import { assessConfidence } from "../server/ml/confidence";
import { buildWellnessDna } from "../server/ml/wellness-dna";
import { clamp, mulberry32 } from "../server/ml/stats";
import type { FeatureKey } from "../shared/ml-types";

let failures = 0;

function check(name: string, ok: boolean, detail: string): void {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name.padEnd(30)}  ${detail}`);
  if (!ok) failures++;
}

const N = 60;
const TODAY = new Date();
const rand = mulberry32(20261007);
const gauss = (): number => {
  let u = 0;
  let v = 0;
  while (u === 0) u = rand();
  while (v === 0) v = rand();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
};
const dateAt = (back: number): string => new Date(TODAY.getTime() - back * 86400000).toISOString().slice(0, 10);

const VALENCE: Record<string, number> = { Happy: 9, Excited: 8, Calm: 7, Neutral: 5, Other: 5, Tired: 4, Sad: 3, Anxious: 3, Angry: 2, Overwhelmed: 2 };

function moodRow(target: number, date: string): { date: string; mood: string; intensity: number } {
  const label =
    target >= 8 ? "Happy" : target >= 7 ? "Calm" : target >= 5.5 ? "Neutral" : target >= 4 ? "Tired" : target >= 2.5 ? "Sad" : "Angry";
  const intensity = Math.round(clamp((target - 0.65 * VALENCE[label]) / 0.35, 1, 10));
  return { date, mood: label, intensity };
}

function stressLevel(score: number): string {
  return score >= 7.5 ? "High" : score >= 5 ? "Moderate" : score >= 2.5 ? "Low" : "Relaxed";
}

interface Planted {
  date: string;
  feature: FeatureKey;
  direction: "high" | "low";
}

/** 60 days with planted structure: sleep→mood positive, mood→stress negative,
 *  water/steps/habits independent, plus three injected anomalies. */
function buildSynthetic(): { raw: RawWellnessData; planted: Planted[] } {
  const raw: RawWellnessData = { health: [], moods: [], stresses: [], waters: [], sleeps: [], habits: [] };
  const planted: Planted[] = [];

  for (let i = 0; i < N; i++) {
    const date = dateAt(N - 1 - i);
    const sleepBase = 7.2 + 1.1 * gauss();
    const moodBase = clamp(5.6 + 0.8 * (sleepBase - 7.2) + 0.6 * gauss(), 1, 10);
    const stressBase = clamp(5.5 - 1.1 * (moodBase - 5) + 0.9 * gauss(), 1, 10);
    let water = Math.round(2400 + 450 * gauss());
    let mood = moodBase;
    let sleep = sleepBase;
    let stress = stressBase;
    const habitPct = clamp(Math.round(65 + 18 * gauss()), 0, 100);
    const steps = Math.max(0, Math.round(7000 + 1600 * gauss()));

    if (i === 25) {
      water = 6200;
      planted.push({ date, feature: "water", direction: "high" });
    }
    if (i === 40) {
      // mood crash (with matching stress spike, and sleep kept on the planted
      // sleep→mood line) so the planted correlations survive the outliers
      mood = 1.65;
      sleep = 7.2 + (mood - 5) / 0.8;
      stress = clamp(5.5 - 1.1 * (mood - 5) + 0.9 * gauss(), 1, 10);
      planted.push({ date, feature: "mood", direction: "low" });
    }
    if (i === 50) {
      sleep = 2;
      mood = clamp(5 + 0.8 * (sleep - 7.2) + 0.6 * gauss(), 1, 10);
      planted.push({ date, feature: "sleep", direction: "low" });
    }

    raw.sleeps.push({ date, totalSleep: Math.round(sleep * 10) / 10 });
    raw.moods.push(moodRow(mood, date));
    raw.stresses.push({ date, level: stressLevel(stress), score: Math.round(clamp(stress, 1, 10) * 10) / 10 });
    const first = Math.round(water * 0.6);
    raw.waters.push({ date, amountMl: first }, { date, amountMl: water - first });
    raw.habits.push({ date, completed: habitPct >= 80, completionPercentage: habitPct });
    raw.health.push({ date, steps });
  }
  return { raw, planted };
}

/** 40 days with a strict linear water ramp — Holt must beat seasonal-naive. */
function buildRamp(): RawWellnessData {
  const raw: RawWellnessData = { health: [], moods: [], stresses: [], waters: [], sleeps: [], habits: [] };
  for (let i = 0; i < 40; i++) {
    const date = dateAt(39 - i);
    raw.sleeps.push({ date, totalSleep: Math.round((7.2 + 0.4 * gauss()) * 10) / 10 });
    raw.moods.push(moodRow(clamp(6 + 0.5 * gauss(), 1, 10), date));
    raw.stresses.push({ date, level: "Moderate", score: 5 });
    raw.waters.push({ date, amountMl: 1500 + 40 * i });
    raw.habits.push({ date, completed: true, completionPercentage: 100 });
    raw.health.push({ date, steps: 7000 });
  }
  return raw;
}

const { raw, planted } = buildSynthetic();
const features = buildDailyFeatures(raw, 90);
check("feature-count", features.length === N, `${features.length}/${N} tracked days merged`);

/* ── patterns: Pearson r + permutation test ── */
const patterns = findPatterns(features);
const reported = patterns.patterns.map((p) => p.pairKey);
const sleepMood = patterns.patterns.find((p) => p.pairKey === "mlPairSleepMood");
check(
  "correlation-sleep-mood",
  !!sleepMood && sleepMood.direction === "together" && sleepMood.r >= 0.4,
  `r=${sleepMood?.r ?? "n/a"} p=${sleepMood?.pValue ?? "n/a"} n=${sleepMood?.n ?? 0}`,
);
const stressMood = patterns.patterns.find((p) => p.pairKey === "mlPairStressMood");
check(
  "correlation-stress-mood",
  !!stressMood && stressMood.direction === "opposite" && stressMood.r <= -0.4,
  `r=${stressMood?.r ?? "n/a"} p=${stressMood?.pValue ?? "n/a"} n=${stressMood?.n ?? 0}`,
);
const unplanted = ["mlPairWaterMood", "mlPairHabitsMood", "mlPairStepsMood", "mlPairWaterStress"];
const falsePairs = reported.filter((k) => unplanted.includes(k));
check("correlation-false-positives", falsePairs.length <= 1, `${falsePairs.length}/${unplanted.length} unplanted pairs reported (${falsePairs.join(",") || "none"})`);

/* ── anomalies: median/MAD z-scores ── */
const anomalies = findAnomalies(features);
const plantedDates = new Set(planted.map((p) => p.date));
const detected = planted.filter((p) => anomalies.anomalies.some((a) => a.date === p.date && a.feature === p.feature && a.direction === p.direction));
check("anomaly-recall", detected.length >= 2, `${detected.length}/${planted.length} injected anomalies detected`);
const unexplained = anomalies.anomalies.filter((a) => !plantedDates.has(a.date));
check("anomaly-flags", unexplained.length <= 3, `${anomalies.anomalies.length} flags total, ${unexplained.length} unexplained`);
for (const a of anomalies.anomalies) {
  console.log(`      anomaly  ${a.date}  ${a.feature} ${a.direction}  value=${a.value} z=${a.zScore}`);
}

/* ── clustering: k-means + silhouette model selection ── */
const clusters = clusterDays(features);
const assigned = clusters ? clusters.clusters.reduce((s, c) => s + c.size, 0) : 0;
check(
  "clustering",
  !!clusters && clusters.k >= 2 && clusters.k <= 4 && clusters.silhouette > 0.05 && assigned === N,
  clusters ? `k=${clusters.k} silhouette=${clusters.silhouette} assigned=${assigned}/${N}` : "null",
);

/* ── forecasting: Holt vs seasonal-naive ── */
const forecasts = forecastSeries(features);
const forecastFeatures = forecasts.series.map((s) => s.feature);
const wanted: FeatureKey[] = ["sleep", "mood", "stress", "water"];
check("forecast-coverage", wanted.every((f) => forecastFeatures.includes(f)), `series: ${forecastFeatures.join(", ") || "none"}`);
const wellFormed = forecasts.series.every(
  (s) => s.next7.length === 7 && s.next7.every((p) => Number.isFinite(p.value)) && s.low <= s.high && s.mae >= 0 && s.mae <= s.baselineMae + 1e-9,
);
check("forecast-well-formed", wellFormed, `${forecasts.series.length} series with 7-day projections and mae <= baseline`);
for (const s of forecasts.series) {
  console.log(
    `      report  ${s.feature.padEnd(7)} model=${s.model.padEnd(14)} mae=${String(s.mae).padEnd(7)} baseline=${String(s.baselineMae).padEnd(7)} improvement=${s.improvementPct}% trend=${s.trend}`,
  );
}

const ramp = forecastSeries(buildDailyFeatures(buildRamp(), 90));
const rampWater = ramp.series.find((s) => s.feature === "water");
check(
  "forecast-holt-beats-baseline",
  !!rampWater && rampWater.model === "holt" && rampWater.mae < rampWater.baselineMae,
  rampWater ? `ramp water: holt mae=${rampWater.mae} vs naive=${rampWater.baselineMae} (${rampWater.improvementPct}%)` : "no water series",
);

/* ── confidence tiering ── */
const confFull = assessConfidence(features, 90);
const confSparse = assessConfidence(features.slice(-3), 90);
check(
  "confidence-tiering",
  confFull.score > confSparse.score + 30 && confFull.tier === "high" && confSparse.tier === "low",
  `full=${confFull.score} (${confFull.tier}) vs sparse=${confSparse.score} (${confSparse.tier})`,
);

/* ── wellness DNA ── */
const dna = buildWellnessDna(features);
const inRange = !!dna && dna.traits.length >= 5 && dna.traits.every((t) => t.score >= 0 && t.score <= 100);
check("dna-traits", inRange, dna ? `${dna.traits.length} traits, all scores 0..100` : "null");
check("dna-recovery", !!dna && dna.traits.some((t) => t.traitKey === "mlDnaRecovery"), dna ? dna.traits.map((t) => `${t.traitKey}:${t.score}`).join(" ") : "null");

/* ── insufficient-data guards ── */
const tinyRaw: RawWellnessData = {
  health: raw.health.slice(-3),
  moods: raw.moods.slice(-3),
  stresses: raw.stresses.slice(-3),
  waters: raw.waters.slice(-6),
  sleeps: raw.sleeps.slice(-3),
  habits: raw.habits.slice(-3),
};
const tiny = buildDailyFeatures(tinyRaw, 90);
const guardsQuiet =
  findPatterns(tiny).patterns.length === 0 &&
  findAnomalies(tiny).anomalies.length === 0 &&
  clusterDays(tiny) === null &&
  buildWellnessDna(tiny) === null;
check("insufficient-guards", guardsQuiet, `${tiny.length} days → no ML output produced`);

console.log("");
if (failures > 0) {
  console.error(`${failures} check(s) failed.`);
  process.exit(1);
}
console.log("All ML evaluation checks passed.");
