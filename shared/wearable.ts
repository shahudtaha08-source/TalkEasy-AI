/**
 * TalkEasy v6.1.3 — wearable/device abstraction.
 *
 * Nothing here claims that a physical device integration already exists. It
 * defines the shape future integrations must implement and the set of metrics
 * the app knows how to display. Measurements may only enter the system through
 * an explicit source; the app never invents device readings.
 */

export type WearableMetric =
  | "heart_rate"
  | "spo2"
  | "steps"
  | "blood_pressure"
  | "ecg"
  | "sleep_duration";

export interface WearableMetricInfo {
  key: WearableMetric;
  label: string;
  unit: string;
  /** Some metrics need a second value (e.g. diastolic alongside systolic). */
  secondaryLabel?: string;
}

export const WEARABLE_METRICS: WearableMetricInfo[] = [
  { key: "heart_rate", label: "Heart rate", unit: "bpm" },
  { key: "spo2", label: "Blood oxygen (SpO₂)", unit: "%" },
  { key: "steps", label: "Steps", unit: "steps" },
  { key: "blood_pressure", label: "Blood pressure", unit: "mmHg", secondaryLabel: "Diastolic" },
  { key: "ecg", label: "ECG", unit: "" },
  { key: "sleep_duration", label: "Wearable sleep", unit: "h" },
];

export type ProviderStatus = "available" | "planned";

export interface WearableProviderInfo {
  id: string;
  label: string;
  status: ProviderStatus;
  description: string;
}

/**
 * Known/planned sources. Only `manual_import` is wired for direct entry today;
 * the rest are declared so the abstraction is explicit and honest.
 */
export const WEARABLE_PROVIDERS: WearableProviderInfo[] = [
  { id: "manual_import", label: "Manual import", status: "available", description: "Import measurements exported from a device or health platform." },
  { id: "health_connect", label: "Android Health Connect", status: "planned", description: "Planned integration; requires platform permissions." },
  { id: "apple_health", label: "Apple HealthKit", status: "planned", description: "Planned integration; requires iOS entitlements." },
  { id: "demo", label: "Sample / demo dataset", status: "available", description: "Clearly-labelled sample data for exploring the interface. Not a real measurement." },
];

/** Interface future concrete integrations should implement. */
export interface WearableProvider {
  readonly id: string;
  readonly label: string;
  /** Returns measurements since a timestamp, each carrying an explicit source. */
  fetchMeasurements(userId: string, since: Date): Promise<WearableMeasurementInput[]>;
}

export interface WearableMeasurementInput {
  source: string;
  deviceLabel?: string | null;
  metric: WearableMetric | string;
  value: number | null;
  valueSecondary?: number | null;
  unit?: string | null;
  recordedAt: string;
  date?: string;
  isDemo?: boolean;
  meta?: Record<string, unknown> | null;
}

export const WEARABLE_SOURCE_IDS = WEARABLE_PROVIDERS.map((p) => p.id);

export function isKnownMetric(metric: string): boolean {
  return WEARABLE_METRICS.some((m) => m.key === metric);
}

export function isKnownSource(source: string): boolean {
  return WEARABLE_SOURCE_IDS.includes(source);
}

/**
 * Validates an incoming measurement. Strict on purpose: rejects unknown
 * metrics/sources and out-of-range values so bad data cannot corrupt trends.
 */
export function validateWearableMeasurement(input: unknown): { ok: true; value: WearableMeasurementInput } | { ok: false; error: string } {
  if (!input || typeof input !== "object") return { ok: false, error: "Measurement must be an object" };
  const m = input as Record<string, unknown>;

  const metric = String(m.metric ?? "");
  if (!isKnownMetric(metric)) return { ok: false, error: `Unknown metric: ${metric || "(missing)"}` };

  const source = String(m.source ?? "manual_import");
  if (!isKnownSource(source)) return { ok: false, error: `Unknown source: ${source}` };

  const value = m.value === null || m.value === undefined ? null : Number(m.value);
  if (value !== null && !Number.isFinite(value)) return { ok: false, error: "value must be a finite number or null" };

  if (metric === "spo2" && value !== null && (value < 0 || value > 100)) {
    return { ok: false, error: "SpO₂ must be between 0 and 100" };
  }
  if (metric === "heart_rate" && value !== null && (value < 0 || value > 400)) {
    return { ok: false, error: "Heart rate out of plausible range" };
  }

  const recordedAtRaw = m.recordedAt ?? m.date ?? new Date().toISOString();
  const recordedAtDate = new Date(String(recordedAtRaw));
  if (Number.isNaN(recordedAtDate.getTime())) return { ok: false, error: "recordedAt is not a valid date" };

  return {
    ok: true,
    value: {
      source,
      deviceLabel: (m.deviceLabel as string) ?? null,
      metric,
      value,
      valueSecondary: m.valueSecondary === undefined || m.valueSecondary === null ? null : Number(m.valueSecondary),
      unit: (m.unit as string) ?? WEARABLE_METRICS.find((x) => x.key === metric)?.unit ?? null,
      recordedAt: recordedAtDate.toISOString(),
      date: typeof m.date === "string" ? m.date : recordedAtDate.toISOString().slice(0, 10),
      isDemo: m.isDemo === true,
      meta: (m.meta as Record<string, unknown>) ?? null,
    },
  };
}
