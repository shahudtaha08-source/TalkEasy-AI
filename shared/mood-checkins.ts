/**
 * TalkEasy — multiple mood check-ins per day.
 *
 * Since the tracker now allows several check-ins on the same calendar day, any
 * aggregation must count each saved entry exactly once. These helpers are the
 * shared definition used by the server endpoint and the client charts so daily
 * summaries never double-count a single check-in (the legacy `moods` row and
 * its mirrored `mood_entries` row describe the *same* event).
 */

export interface MoodCheckInRow {
  id?: number | string;
  /** Calendar day "yyyy-mm-dd" (or any value coercible to one). */
  date?: unknown;
  mood: string;
  intensity?: number | null;
  /** Absolute timestamp of the check-in, when known. */
  createdAt?: unknown;
  /** Alternate timestamp field used by some API shapes. */
  checkInAt?: unknown;
}

const POSITIVE = new Set(["Happy", "Calm", "Excited"]);
const NEGATIVE = new Set(["Sad", "Anxious", "Angry", "Overwhelmed", "Tired"]);

export function dayKeyOf(value: unknown): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  const s = String(value ?? "");
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const parsed = new Date(s);
  return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString().slice(0, 10);
}

/** Absolute timestamp of a single check-in, preferring an explicit field. */
export function checkInTimestamp(row: MoodCheckInRow): Date | null {
  for (const raw of [row.createdAt, row.checkInAt]) {
    if (raw == null) continue;
    const d = raw instanceof Date ? raw : new Date(String(raw));
    if (!Number.isNaN(d.getTime())) return d;
  }
  // Fall back to the calendar day at UTC midnight so ordering stays stable.
  const key = dayKeyOf(row.date);
  if (!key) return null;
  const d = new Date(`${key}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Timestamp of the most recent check-in, or null when there are none. */
export function latestCheckInAt(rows: MoodCheckInRow[]): Date | null {
  let latest: Date | null = null;
  for (const row of rows) {
    const ts = checkInTimestamp(row);
    if (ts && (!latest || ts.getTime() > latest.getTime())) latest = ts;
  }
  return latest;
}

export interface MoodDaySummary {
  date: string;
  count: number;
  dominantMood: string | null;
  avgIntensity: number | null;
  /** 0..1 share of check-ins that were positive / negative on that day. */
  positiveShare: number;
  negativeShare: number;
  firstAt: Date | null;
  lastAt: Date | null;
}

/** Groups rows by calendar day, preserving absolute timestamps per entry. */
export function groupCheckInsByDay(rows: MoodCheckInRow[]): Map<string, MoodCheckInRow[]> {
  const groups = new Map<string, MoodCheckInRow[]>();
  for (const row of rows) {
    const key = dayKeyOf(row.date);
    if (!key) continue;
    const bucket = groups.get(key);
    if (bucket) bucket.push(row);
    else groups.set(key, [row]);
  }
  return groups;
}

function dominant(values: string[]): string | null {
  if (!values.length) return null;
  const counts = new Map<string, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  let best: string | null = null;
  let bestCount = -1;
  counts.forEach((count, value) => {
    if (count > bestCount) {
      best = value;
      bestCount = count;
    }
  });
  return best;
}

/** Aggregates one day's check-ins. Each row contributes exactly once. */
export function summarizeCheckInDay(date: string, rows: MoodCheckInRow[]): MoodDaySummary {
  const intensities = rows.map((r) => r.intensity).filter((n): n is number => typeof n === "number");
  const avgIntensity = intensities.length
    ? Math.round((intensities.reduce((a, b) => a + b, 0) / intensities.length) * 10) / 10
    : null;
  let firstAt: Date | null = null;
  let lastAt: Date | null = null;
  for (const row of rows) {
    const ts = checkInTimestamp(row);
    if (!ts) continue;
    if (!firstAt || ts.getTime() < firstAt.getTime()) firstAt = ts;
    if (!lastAt || ts.getTime() > lastAt.getTime()) lastAt = ts;
  }
  const positive = rows.filter((r) => POSITIVE.has(r.mood)).length;
  const negative = rows.filter((r) => NEGATIVE.has(r.mood)).length;
  return {
    date,
    count: rows.length,
    dominantMood: dominant(rows.map((r) => r.mood)),
    avgIntensity,
    positiveShare: rows.length ? positive / rows.length : 0,
    negativeShare: rows.length ? negative / rows.length : 0,
    firstAt,
    lastAt,
  };
}

/** Per-day summaries for a set of check-ins (one summary per calendar day). */
export function summarizeCheckInsByDay(rows: MoodCheckInRow[]): MoodDaySummary[] {
  return Array.from(groupCheckInsByDay(rows).entries())
    .map(([date, group]) => summarizeCheckInDay(date, group))
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}

export interface MoodTotals {
  totalCheckIns: number;
  daysWithCheckIns: number;
  latestAt: Date | null;
}

export function totalCheckIns(rows: MoodCheckInRow[]): MoodTotals {
  return {
    totalCheckIns: rows.length,
    daysWithCheckIns: groupCheckInsByDay(rows).size,
    latestAt: latestCheckInAt(rows),
  };
}
