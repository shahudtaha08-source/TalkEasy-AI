/**
 * TalkEasy v6.1.3 — deterministic insight aggregation.
 *
 * Two strictly separate builders:
 *   - aggregateWellnessInsights() — TalkEasy AI's own recorded data.
 *   - aggregateWearableInsights() — device-sourced measurements only.
 *
 * These functions are pure and never read each other's inputs, which is what
 * guarantees the two data sources cannot leak into one another. All date math
 * is performed in the user's local timezone via an explicit offset.
 */

export type InsightPeriod = "daily" | "weekly" | "30day" | "90day";
export type InsightSource = "wellness" | "wearable";

export interface DateRange {
  start: string; // yyyy-mm-dd (local)
  end: string;   // yyyy-mm-dd (local)
  days: number;
  dates: string[];
}

export interface InsightMetric {
  key: string;
  label: string;
  value: number | string | null;
  unit?: string;
  secondaryValue?: number | null;
  sampleCount: number;
  hasData: boolean;
  detail?: string;
}

export interface InsightHighlight {
  id: string;
  category: string;
  priority: "high" | "medium" | "low" | "info";
  title: string;
  message: string;
}

export interface InsightBundle {
  source: InsightSource;
  period: InsightPeriod;
  range: DateRange;
  generatedAt: string;
  sampleCount: number;
  coverage: { daysWithData: number; totalDays: number; coveragePct: number };
  metrics: InsightMetric[];
  highlights: InsightHighlight[];
  missingData: string[];
  insufficientData: boolean;
  insufficientReason?: string;
  /** True when every row in the bundle originates from a labelled demo/sample source. */
  isDemoData: boolean;
  ml?: unknown;
}

export const PERIOD_DAYS: Record<InsightPeriod, number> = {
  daily: 1,
  weekly: 7,
  "30day": 30,
  "90day": 90,
};

/** Minimum distinct days with data required before a period is considered meaningful. */
export const PERIOD_MIN_DAYS: Record<InsightPeriod, number> = {
  daily: 1,
  weekly: 2,
  "30day": 3,
  "90day": 7,
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function toDateStr(ms: number): string {
  const d = new Date(ms);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

/**
 * Builds an inclusive date range ending on the user's "today".
 * `tzOffsetMinutes` is (localTime - UTC) in minutes, e.g. +330 for IST.
 */
export function getPeriodRange(period: InsightPeriod, now: Date = new Date(), tzOffsetMinutes = 0): DateRange {
  const days = PERIOD_DAYS[period];
  const localNow = now.getTime() + tzOffsetMinutes * 60000;
  const dates: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    dates.push(toDateStr(localNow - i * MS_PER_DAY));
  }
  return { start: dates[0], end: dates[dates.length - 1], days, dates };
}

/** Normalises a date-ish value (Date | ISO string | yyyy-mm-dd) to yyyy-mm-dd. */
export function toDateKey(value: unknown): string {
  if (value instanceof Date) return toDateStr(value.getTime());
  const s = String(value ?? "");
  // Already a plain date or ISO string — take the date portion in UTC terms.
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const parsed = new Date(s);
  if (Number.isNaN(parsed.getTime())) return "";
  return toDateStr(parsed.getTime());
}

const round = (n: number, dp = 1) => {
  const f = Math.pow(10, dp);
  return Math.round(n * f) / f;
};

const avg = (nums: number[]): number | null => (nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : null);

// ─── INPUT TYPES ─────────────────────────────────────────────────────────────

export interface WellnessInput {
  moods?: { date: unknown; mood: string; intensity?: number | null }[];
  moodEntries?: { date: unknown; mood: string; intensity?: number | null }[];
  habits?: { date: unknown; type: string; completed?: boolean; completionPercentage?: number | null }[];
  sleep?: { date: unknown; totalSleep?: number | null; nightSleep?: number | null; nap?: number | null }[];
  water?: { date: unknown; amountMl: number }[];
  stress?: { date: unknown; level?: string | null; score?: number | null }[];
  journals?: { date: unknown }[];
  reflections?: { date: unknown }[];
  goals?: { status?: string | null; currentProgress?: number | null; target?: number | null; focusArea?: string | null }[];
  waterTargetMl?: number;
  sleepTargetHours?: number;
  ml?: unknown;
}

export interface WearableRow {
  date: unknown;
  metric: string;
  value: number | null;
  valueSecondary?: number | null;
  unit?: string | null;
  source: string;
  deviceLabel?: string | null;
  isDemo?: boolean;
  recordedAt?: unknown;
}

export interface WearableInput {
  measurements?: WearableRow[];
  ml?: unknown;
}

const NEGATIVE_MOODS = ["Sad", "Anxious", "Angry", "Overwhelmed", "Tired"];
const POSITIVE_MOODS = ["Happy", "Calm", "Excited"];

function coverageFrom(datesWithData: Set<string>, range: DateRange) {
  const daysWithData = range.dates.filter((d) => datesWithData.has(d)).length;
  const totalDays = range.days;
  return { daysWithData, totalDays, coveragePct: round((daysWithData / totalDays) * 100, 0) };
}

function insufficiency(bundle: Pick<InsightBundle, "period" | "coverage">): { insufficientData: boolean; insufficientReason?: string } {
  const min = PERIOD_MIN_DAYS[bundle.period];
  if (bundle.coverage.daysWithData < min) {
    return {
      insufficientData: true,
      insufficientReason:
        bundle.coverage.daysWithData === 0
          ? "No data recorded in this period."
          : `Only ${bundle.coverage.daysWithData} day(s) with data; at least ${min} are needed for a meaningful ${bundle.period} view.`,
    };
  }
  return { insufficientData: false };
}

// ─── WELLNESS (TalkEasy AI) ──────────────────────────────────────────────────

export function aggregateWellnessInsights(
  input: WellnessInput,
  period: InsightPeriod,
  now: Date = new Date(),
  tzOffsetMinutes = 0,
): InsightBundle {
  const range = getPeriodRange(period, now, tzOffsetMinutes);
  const inRange = (value: unknown): boolean => {
    const key = toDateKey(value);
    return key >= range.start && key <= range.end;
  };

  // Every `POST /api/moods` mirrors the same event into `mood_entries`, so a
  // check-in would be counted twice if we merged both tables. Prefer the
  // structured entries and only fall back to the legacy `moods` table for
  // accounts that predate the mirror. Either way each saved check-in counts
  // exactly once (multiple check-ins in a day are kept, not deduped).
  const structuredMoods = input.moodEntries || [];
  const legacyMoods = input.moods || [];
  const moodRows = (structuredMoods.length ? structuredMoods : legacyMoods).filter((m) => inRange(m.date));
  const habitRows = (input.habits || []).filter((h) => inRange(h.date));
  const sleepRows = (input.sleep || []).filter((s) => inRange(s.date));
  const waterRows = (input.water || []).filter((w) => inRange(w.date));
  const stressRows = (input.stress || []).filter((s) => inRange(s.date));
  const journalRows = (input.journals || []).filter((j) => inRange(j.date));
  const reflectionRows = (input.reflections || []).filter((r) => inRange(r.date));
  const goals = input.goals || [];

  const waterTargetMl = input.waterTargetMl ?? 2500;
  const sleepTargetMinutes = (input.sleepTargetHours ?? 8) * 60;

  const datesWithData = new Set<string>();
  [...moodRows, ...habitRows, ...sleepRows, ...waterRows, ...stressRows, ...journalRows, ...reflectionRows]
    .forEach((r: any) => { const k = toDateKey(r.date); if (k) datesWithData.add(k); });

  const metrics: InsightMetric[] = [];
  const highlights: InsightHighlight[] = [];
  const missingData: string[] = [];

  // Mood
  if (moodRows.length) {
    const intensities = moodRows.map((m) => m.intensity).filter((n): n is number => typeof n === "number");
    const negative = moodRows.filter((m) => NEGATIVE_MOODS.includes(m.mood)).length;
    const positive = moodRows.filter((m) => POSITIVE_MOODS.includes(m.mood)).length;
    const dominant = mode(moodRows.map((m) => m.mood));
    const avgIntensity = avg(intensities);
    metrics.push({ key: "mood", label: "Mood", value: dominant || null, sampleCount: moodRows.length, hasData: true, detail: avgIntensity != null ? `Average intensity ${round(avgIntensity, 1)}/10` : undefined });
    if (moodRows.length > 0) {
      const negativeRatio = negative / moodRows.length;
      if (negativeRatio > 0.5) {
        highlights.push({ id: "mood-negative", category: "mood", priority: "high", title: "Mostly challenging moods", message: `${negative} of ${moodRows.length} mood entries were challenging. Consider journaling or reaching out to someone you trust.` });
      } else if (positive / moodRows.length > 0.6) {
        highlights.push({ id: "mood-positive", category: "mood", priority: "low", title: "Mostly positive moods", message: `${positive} of ${moodRows.length} mood entries were positive — keep doing what supports that.` });
      }
    }
  } else {
    missingData.push("mood");
  }

  // Habits
  if (habitRows.length) {
    const pcts = habitRows.map((h) => Math.max(0, Math.min(100, Number(h.completionPercentage ?? (h.completed ? 100 : 0)))));
    const avgPct = avg(pcts);
    const completed = habitRows.filter((h) => (h.completionPercentage ?? (h.completed ? 100 : 0)) >= 100).length;
    const habitDays = new Set(habitRows.map((h) => toDateKey(h.date)).filter(Boolean));
    metrics.push({ key: "habits", label: "Habit completion", value: avgPct != null ? round(avgPct, 0) : null, unit: "%", sampleCount: habitRows.length, hasData: true, detail: `${completed} of ${habitRows.length} fully completed · logged on ${habitDays.size} day(s)` });
    if (avgPct != null && avgPct > 0 && avgPct < 100) {
      highlights.push({ id: "habits-partial", category: "habit", priority: "info", title: "Partial habit progress", message: `Average habit completion was ${round(avgPct, 0)}% across ${habitRows.length} entries. Partial progress still counts.` });
    }
  } else {
    missingData.push("habits");
  }

  // Sleep
  if (sleepRows.length) {
    const totals = sleepRows.map((s) => Number(s.totalSleep ?? (Number(s.nightSleep || 0) + Number(s.nap || 0)))).filter((n) => n > 0);
    const avgSleep = avg(totals);
    metrics.push({ key: "sleep", label: "Sleep", value: avgSleep != null ? round(avgSleep / 60, 1) : null, unit: "h/night", sampleCount: sleepRows.length, hasData: true, detail: `Target ${round(sleepTargetMinutes / 60, 1)}h` });
    if (avgSleep != null && avgSleep < sleepTargetMinutes * 0.85) {
      highlights.push({ id: "sleep-low", category: "sleep", priority: "medium", title: "Sleep below target", message: `Average sleep was ${round(avgSleep / 60, 1)}h against a ${round(sleepTargetMinutes / 60, 1)}h target.` });
    }
  } else {
    missingData.push("sleep");
  }

  // Water
  if (waterRows.length) {
    const days = new Set(waterRows.map((w) => toDateKey(w.date)).filter(Boolean));
    const total = waterRows.reduce((sum, w) => sum + Number(w.amountMl || 0), 0);
    const perDay = days.size ? total / days.size : 0;
    metrics.push({ key: "water", label: "Hydration", value: Math.round(perDay), unit: "ml/day", sampleCount: waterRows.length, hasData: true, detail: `Target ${waterTargetMl}ml/day` });
    if (perDay > 0 && perDay < waterTargetMl * 0.7) {
      highlights.push({ id: "water-low", category: "hydration", priority: "medium", title: "Hydration below target", message: `Average intake was ${Math.round(perDay)}ml/day against your ${waterTargetMl}ml target.` });
    }
  } else {
    missingData.push("water");
  }

  // Stress
  if (stressRows.length) {
    const scores = stressRows.map((s) => s.score).filter((n): n is number => typeof n === "number");
    const highMod = stressRows.filter((s) => s.level === "High" || s.level === "Moderate").length;
    const avgScore = avg(scores);
    metrics.push({ key: "stress", label: "Stress", value: avgScore != null ? round(avgScore, 1) : null, unit: "/10", sampleCount: stressRows.length, hasData: true, detail: `${highMod} moderate/high of ${stressRows.length}` });
    if (highMod / stressRows.length > 0.5) {
      highlights.push({ id: "stress-high", category: "stress", priority: "high", title: "Frequent stress", message: `Moderate or high stress on ${highMod} of ${stressRows.length} check-ins.` });
    }
  } else {
    missingData.push("stress");
  }

  // Goals
  if (goals.length) {
    const active = goals.filter((g) => g.status === "active" || !g.status).length;
    const completed = goals.filter((g) => g.status === "completed").length;
    metrics.push({ key: "goals", label: "Goals", value: active, sampleCount: goals.length, hasData: true, detail: `${active} active · ${completed} completed` });
  } else {
    missingData.push("goals");
  }

  // Journal & reflections
  metrics.push({ key: "journal", label: "Journal entries", value: journalRows.length, sampleCount: journalRows.length, hasData: journalRows.length > 0 });
  metrics.push({ key: "reflections", label: "Reflection responses", value: reflectionRows.length, sampleCount: reflectionRows.length, hasData: reflectionRows.length > 0 });
  if (!journalRows.length) missingData.push("journal");

  const coverage = coverageFrom(datesWithData, range);
  const sampleCount =
    moodRows.length + habitRows.length + sleepRows.length + waterRows.length + stressRows.length + journalRows.length + reflectionRows.length;
  const { insufficientData, insufficientReason } = insufficiency({ period, coverage });

  return {
    source: "wellness",
    period,
    range,
    generatedAt: now.toISOString(),
    sampleCount,
    coverage,
    metrics,
    highlights: sortHighlights(highlights),
    missingData,
    insufficientData,
    insufficientReason,
    isDemoData: false,
    ml: input.ml,
  };
}

// ─── WEARABLE (device health) ────────────────────────────────────────────────

const WEARABLE_METRIC_LABELS: Record<string, { label: string; unit: string }> = {
  heart_rate: { label: "Heart rate", unit: "bpm" },
  spo2: { label: "Blood oxygen (SpO₂)", unit: "%" },
  steps: { label: "Steps", unit: "steps" },
  blood_pressure: { label: "Blood pressure", unit: "mmHg" },
  ecg: { label: "ECG", unit: "" },
  sleep_duration: { label: "Wearable sleep", unit: "h" },
};

export function aggregateWearableInsights(
  input: WearableInput,
  period: InsightPeriod,
  now: Date = new Date(),
  tzOffsetMinutes = 0,
): InsightBundle {
  const range = getPeriodRange(period, now, tzOffsetMinutes);
  const rows = (input.measurements || []).filter((r) => {
    const key = toDateKey(r.date);
    return key && key >= range.start && key <= range.end;
  });

  const datesWithData = new Set<string>();
  rows.forEach((r) => { const k = toDateKey(r.date); if (k) datesWithData.add(k); });

  const metrics: InsightMetric[] = [];
  const highlights: InsightHighlight[] = [];
  const missingData: string[] = [];

  const byMetric = new Map<string, WearableRow[]>();
  for (const row of rows) {
    if (!byMetric.has(row.metric)) byMetric.set(row.metric, []);
    byMetric.get(row.metric)!.push(row);
  }

  Array.from(byMetric.entries()).forEach(([metric, list]) => {
    const meta = WEARABLE_METRIC_LABELS[metric] || { label: metric, unit: list[0]?.unit || "" };
    const values = list.map((r) => r.value).filter((n): n is number => typeof n === "number");
    const mean = avg(values);
    const secondaryVals = list.map((r) => r.valueSecondary).filter((n): n is number => typeof n === "number");
    metrics.push({
      key: metric,
      label: meta.label,
      value: mean != null ? round(mean, metric === "steps" || metric === "heart_rate" ? 0 : 1) : null,
      unit: meta.unit || list[0]?.unit || "",
      secondaryValue: secondaryVals.length ? round(avg(secondaryVals) as number, 0) : null,
      sampleCount: list.length,
      hasData: values.length > 0,
      detail: values.length ? `Range ${round(Math.min(...values), 1)}–${round(Math.max(...values), 1)} · ${list.length} readings` : undefined,
    });
  });

  for (const key of Object.keys(WEARABLE_METRIC_LABELS)) {
    if (!byMetric.has(key)) missingData.push(WEARABLE_METRIC_LABELS[key].label);
  }

  const coverage = coverageFrom(datesWithData, range);
  const { insufficientData, insufficientReason } = insufficiency({ period, coverage });
  const isDemoData = rows.length > 0 && rows.every((r) => r.isDemo === true);

  if (rows.length === 0) {
    highlights.push({ id: "wearable-none", category: "device", priority: "info", title: "No device data", message: "No wearable measurements were recorded in this period. Connect or import a device to see device health insights." });
  } else if (isDemoData) {
    highlights.push({ id: "wearable-demo", category: "device", priority: "info", title: "Sample data only", message: "These readings are labelled sample/demo data and are not real measurements from a connected device." });
  }

  return {
    source: "wearable",
    period,
    range,
    generatedAt: now.toISOString(),
    sampleCount: rows.length,
    coverage,
    metrics,
    highlights: sortHighlights(highlights),
    missingData,
    insufficientData,
    insufficientReason,
    isDemoData,
    ml: input.ml,
  };
}

function mode(values: string[]): string | null {
  if (!values.length) return null;
  const counts = new Map<string, number>();
  for (const v of values) counts.set(v, (counts.get(v) || 0) + 1);
  let best: string | null = null;
  let bestCount = -1;
  counts.forEach((c, v) => {
    if (c > bestCount) { best = v; bestCount = c; }
  });
  return best;
}

function sortHighlights(list: InsightHighlight[]): InsightHighlight[] {
  const order: Record<string, number> = { high: 0, medium: 1, low: 2, info: 3 };
  return [...list].sort((a, b) => (order[a.priority] ?? 9) - (order[b.priority] ?? 9));
}

/** Deterministic fallback summary used when ML is unavailable/insufficient. */
export function buildFallbackSummary(bundle: InsightBundle): string {
  if (bundle.insufficientData) {
    return bundle.insufficientReason || "Not enough data for a summary yet.";
  }
  const parts = bundle.metrics
    .filter((m) => m.hasData && m.value !== null)
    .slice(0, 4)
    .map((m) => `${m.label}: ${m.value}${m.unit ? ` ${m.unit}` : ""}`);
  if (!parts.length) return "No summary available yet.";
  return `${bundle.source === "wearable" ? "Device" : "Wellness"} summary — ${parts.join(" · ")}.`;
}
