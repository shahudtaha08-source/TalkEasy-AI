import type {
  AnomaliesData,
  ClustersData,
  ConfidenceAssessment,
  ForecastsData,
  MlEnvelope,
  PatternsData,
  WellnessDnaData,
} from "@shared/ml-types";
import { ML_WINDOW_DAYS, loadRawWellnessData } from "./data-loader";
import { buildDailyFeatures } from "./feature-engineering";
import { assessConfidence } from "./confidence";
import { findPatterns } from "./patterns";
import { findAnomalies } from "./anomaly";
import { clusterDays } from "./clustering";
import { forecastSeries } from "./forecasting";
import { buildWellnessDna } from "./wellness-dna";

/**
 * ML service facade used by the Express routes. Every endpoint returns an
 * envelope: ok / insufficient / error. ML never influences safety, emergency
 * or medical decisions — deterministic logic stays authoritative.
 */

interface Prepared {
  features: ReturnType<typeof buildDailyFeatures>;
  confidence: ConfidenceAssessment;
}

async function prepare(userId: string): Promise<Prepared> {
  const raw = await loadRawWellnessData(userId, ML_WINDOW_DAYS);
  const features = buildDailyFeatures(raw, ML_WINDOW_DAYS);
  return { features, confidence: assessConfidence(features, ML_WINDOW_DAYS) };
}

function errorEnvelope<T>(err: unknown): MlEnvelope<T> {
  const message = err instanceof Error ? err.message : String(err);
  return { status: "error", message };
}

function insufficient<T>(confidence: ConfidenceAssessment, features: number, min: number): MlEnvelope<T> {
  return {
    status: "insufficient",
    message: `Not enough data: ${features} tracked days, ${min} required.`,
    confidence,
  };
}

const MIN = { patterns: 7, anomalies: 8, clusters: 8, forecasts: 10, dna: 7 };

export async function mlPatterns(userId: string): Promise<MlEnvelope<PatternsData>> {
  try {
    const { features, confidence } = await prepare(userId);
    if (features.length < MIN.patterns) return insufficient(confidence, features.length, MIN.patterns);
    return { status: "ok", confidence, data: findPatterns(features) };
  } catch (err) {
    return errorEnvelope(err);
  }
}

export async function mlAnomalies(userId: string): Promise<MlEnvelope<AnomaliesData>> {
  try {
    const { features, confidence } = await prepare(userId);
    if (features.length < MIN.anomalies) return insufficient(confidence, features.length, MIN.anomalies);
    return { status: "ok", confidence, data: findAnomalies(features) };
  } catch (err) {
    return errorEnvelope(err);
  }
}

export async function mlClusters(userId: string): Promise<MlEnvelope<ClustersData>> {
  try {
    const { features, confidence } = await prepare(userId);
    if (features.length < MIN.clusters) return insufficient(confidence, features.length, MIN.clusters);
    const data = clusterDays(features);
    if (!data) return insufficient(confidence, features.length, MIN.clusters);
    return { status: "ok", confidence, data };
  } catch (err) {
    return errorEnvelope(err);
  }
}

export async function mlForecasts(userId: string): Promise<MlEnvelope<ForecastsData>> {
  try {
    const { features, confidence } = await prepare(userId);
    if (features.length < MIN.forecasts) return insufficient(confidence, features.length, MIN.forecasts);
    const data = forecastSeries(features);
    if (data.series.length === 0) return insufficient(confidence, features.length, MIN.forecasts);
    return { status: "ok", confidence, data };
  } catch (err) {
    return errorEnvelope(err);
  }
}

export async function mlConfidence(userId: string): Promise<MlEnvelope<ConfidenceAssessment>> {
  try {
    const { features, confidence } = await prepare(userId);
    if (features.length === 0) return { status: "insufficient", confidence, message: "No tracked days." };
    return { status: "ok", confidence, data: confidence };
  } catch (err) {
    return errorEnvelope(err);
  }
}

export async function mlWellnessDna(userId: string): Promise<MlEnvelope<WellnessDnaData>> {
  try {
    const { features, confidence } = await prepare(userId);
    if (features.length < MIN.dna) return insufficient(confidence, features.length, MIN.dna);
    const data = buildWellnessDna(features);
    if (!data) return insufficient(confidence, features.length, MIN.dna);
    return { status: "ok", confidence, data };
  } catch (err) {
    return errorEnvelope(err);
  }
}
