/**
 * V6.1.2 · Machine-learning contract shared by server and client.
 *
 * Server returns these payloads inside an MlEnvelope; the client renders them
 * using the existing `ml*` / `confidence*` translation keys. ML output is
 * strictly informational — safety and medical decisions never use it.
 */

export type FeatureKey = "sleep" | "mood" | "stress" | "water" | "habits" | "steps";

export type MetricKey =
  | "mlMetricSleep"
  | "mlMetricMood"
  | "mlMetricStress"
  | "mlMetricWater"
  | "mlMetricHabits"
  | "mlMetricActivity";

export const METRIC_KEYS: Record<FeatureKey, MetricKey> = {
  sleep: "mlMetricSleep",
  mood: "mlMetricMood",
  stress: "mlMetricStress",
  water: "mlMetricWater",
  habits: "mlMetricHabits",
  steps: "mlMetricActivity",
};

export type PairKey =
  | "mlPairSleepMood"
  | "mlPairSleepStress"
  | "mlPairWaterStress"
  | "mlPairHabitsMood"
  | "mlPairStepsMood"
  | "mlPairWaterMood"
  | "mlPairStressMood";

export type ClusterLabelKey =
  | "mlClusterBalanced"
  | "mlClusterHighStress"
  | "mlClusterLowSleep"
  | "mlClusterActive"
  | "mlClusterRecovery";

export type TraitKey =
  | "mlDnaSleepConsistency"
  | "mlDnaMoodStability"
  | "mlDnaStressVariability"
  | "mlDnaHydrationConsistency"
  | "mlDnaHabitConsistency"
  | "mlDnaActivityConsistency"
  | "mlDnaRecovery";

export interface DailyFeature {
  date: string; // YYYY-MM-DD
  sleep?: number; // hours
  mood?: number; // 1..10
  stress?: number; // 1..10
  water?: number; // ml / day
  habits?: number; // 0..100 completion percent
  steps?: number; // steps / day
}

export interface ConfidenceAssessment {
  score: number; // 0..100
  tier: "high" | "moderate" | "low";
  trackedDays: number;
  windowDays: number;
}

export type MlStatus = "ok" | "insufficient" | "error";

/**
 * User-facing transparency metadata attached to every ML envelope. ML output in
 * TalkEasy is a statistical estimate over the user's own logs — never a
 * diagnosis — and the client must be able to say so plainly.
 */
export interface MlDisclosure {
  experimental: true;
  estimate: true;
  /** Short statements about what the numbers can and cannot mean. */
  limitations: string[];
}

export const ML_LIMITATIONS: string[] = [
  "These are statistical estimates from your own logs, not a diagnosis.",
  "With few days of data, patterns and forecasts can be unreliable.",
  "Insight is observational — it does not prove that one thing caused another.",
  "Safety, emergency and medical decisions are never made from these estimates.",
];

export function buildMlDisclosure(): MlDisclosure {
  return { experimental: true, estimate: true, limitations: [...ML_LIMITATIONS] };
}

export interface MlEnvelope<T> {
  status: MlStatus;
  message?: string;
  confidence?: ConfidenceAssessment;
  /** Present on every server response; absent only on client-constructed locals. */
  disclosure?: MlDisclosure;
  data?: T;
}

/** Attaches the standard transparency disclosure to an envelope. */
export function withDisclosure<T>(envelope: Omit<MlEnvelope<T>, "disclosure">): MlEnvelope<T> {
  return { ...envelope, disclosure: buildMlDisclosure() };
}

/* ── patterns ── */

export interface PatternInsight {
  pairKey: PairKey;
  direction: "together" | "opposite";
  r: number;
  pValue: number;
  n: number;
}

export interface PatternsData {
  sampleDays: number;
  patterns: PatternInsight[];
}

/* ── anomalies ── */

export interface AnomalyInsight {
  metricKey: MetricKey;
  feature: FeatureKey;
  direction: "high" | "low";
  date: string;
  value: number;
  zScore: number;
}

export interface AnomaliesData {
  sampleDays: number;
  anomalies: AnomalyInsight[];
}

/* ── clustering ── */

export interface ClusterInsight {
  labelKey: ClusterLabelKey;
  size: number;
  profile: Partial<Record<FeatureKey, number>>;
}

export interface ClustersData {
  sampleDays: number;
  k: number;
  silhouette: number;
  clusters: ClusterInsight[];
}

/* ── forecasting ── */

export interface ForecastPoint {
  date: string;
  value: number;
}

export interface ForecastSeriesInsight {
  metricKey: MetricKey;
  feature: FeatureKey;
  model: "holt" | "seasonal-naive";
  points: number;
  mae: number;
  baselineMae: number;
  improvementPct: number;
  trend: "rising" | "falling" | "stable";
  low: number;
  high: number;
  next7: ForecastPoint[];
  history: ForecastPoint[];
}

export interface ForecastsData {
  sampleDays: number;
  days: number;
  series: ForecastSeriesInsight[];
}

/* ── wellness dna ── */

export interface DnaTraitInsight {
  traitKey: TraitKey;
  score: number; // 0..100
  tier: "emerging" | "developing" | "strong";
  n: number;
}

export interface WellnessDnaData {
  sampleDays: number;
  traits: DnaTraitInsight[];
}
