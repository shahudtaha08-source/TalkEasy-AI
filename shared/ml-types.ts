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

export interface MlEnvelope<T> {
  status: MlStatus;
  message?: string;
  confidence?: ConfidenceAssessment;
  data?: T;
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
