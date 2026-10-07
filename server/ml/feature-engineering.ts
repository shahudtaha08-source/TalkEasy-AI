import type { DailyFeature } from "@shared/ml-types";
import { clamp, round } from "./stats";

/**
 * Merges the raw per-day tracking tables into one dense-ish daily feature
 * series used by every ML module. Only user-entered behaviour is treated as
 * real signal; nothing here feeds safety or medical logic.
 */

export interface RawWellnessData {
  health: {
    date: string | Date;
    sleepHours?: number | null;
    waterMl?: number | null;
    stressLevel?: string | null;
    mood?: string | null;
    moodIntensity?: number | null;
    steps?: number | null;
  }[];
  moods: { date: string | Date; mood: string; intensity?: number | null }[];
  stresses: { date: string | Date; level: string; score?: number | null }[];
  waters: { date: string | Date; amountMl: number }[];
  sleeps: { date: string | Date; totalSleep?: number | null; nightSleep?: number | null; nap?: number | null }[];
  habits: { date: string | Date; completed?: boolean | null; completionPercentage?: number | null }[];
}

const MOOD_VALENCE: Record<string, number> = {
  Happy: 9,
  Excited: 8,
  Calm: 7,
  Neutral: 5,
  Other: 5,
  Tired: 4,
  Sad: 3,
  Anxious: 3,
  Angry: 2,
  Overwhelmed: 2,
};

const STRESS_SCORE: Record<string, number> = {
  Relaxed: 1.5,
  Low: 3.5,
  Moderate: 6.5,
  High: 9,
};

export function isoDate(v: string | Date): string {
  if (typeof v === "string") return v.slice(0, 10);
  return v.toISOString().slice(0, 10);
}

function moodScore(label: string, intensity?: number | null): number {
  const valence = MOOD_VALENCE[label] ?? 5;
  const inten = intensity ?? 5;
  return clamp(round(0.65 * valence + 0.35 * inten, 1), 1, 10);
}

function stressScore(level: string, score?: number | null): number {
  if (typeof score === "number" && score >= 1 && score <= 10) return clamp(round(score, 1), 1, 10);
  return clamp(round(STRESS_SCORE[level] ?? 5, 1), 1, 10);
}

interface DayAcc {
  date: string;
  sleep: number[];
  mood: number[];
  stress: number[];
  water: number[];
  habits: number[];
  steps: number[];
}

function acc(map: Map<string, DayAcc>, date: string): DayAcc {
  let day = map.get(date);
  if (!day) {
    day = { date, sleep: [], mood: [], stress: [], water: [], habits: [], steps: [] };
    map.set(date, day);
  }
  return day;
}

export function buildDailyFeatures(raw: RawWellnessData, windowDays = 90): DailyFeature[] {
  const cutoff = new Date(Date.now() - (windowDays - 1) * 86400000).toISOString().slice(0, 10);
  const map = new Map<string, DayAcc>();
  const keep = (date: string) => date >= cutoff;

  for (const h of raw.health) {
    const date = isoDate(h.date);
    if (!keep(date)) continue;
    const day = acc(map, date);
    if (typeof h.sleepHours === "number") day.sleep.push(h.sleepHours);
    if (typeof h.waterMl === "number" && h.waterMl > 0) day.water.push(h.waterMl);
    if (typeof h.steps === "number" && h.steps > 0) day.steps.push(h.steps);
    if (h.stressLevel) day.stress.push(stressScore(h.stressLevel));
    if (h.mood) day.mood.push(moodScore(h.mood, h.moodIntensity));
  }

  for (const m of raw.moods) {
    const date = isoDate(m.date);
    if (!keep(date)) continue;
    acc(map, date).mood.push(moodScore(m.mood, m.intensity));
  }

  for (const s of raw.stresses) {
    const date = isoDate(s.date);
    if (!keep(date)) continue;
    acc(map, date).stress.push(stressScore(s.level, s.score));
  }

  for (const w of raw.waters) {
    const date = isoDate(w.date);
    if (!keep(date)) continue;
    acc(map, date).water.push(w.amountMl);
  }

  for (const s of raw.sleeps) {
    const date = isoDate(s.date);
    if (!keep(date)) continue;
    const hours = typeof s.totalSleep === "number" ? s.totalSleep : (s.nightSleep ?? 0) + (s.nap ?? 0);
    if (hours > 0) acc(map, date).sleep.push(hours);
  }

  for (const hb of raw.habits) {
    const date = isoDate(hb.date);
    if (!keep(date)) continue;
    const pct = hb.completionPercentage;
    const value = hb.completed
      ? Math.max(100, typeof pct === "number" ? pct : 100)
      : typeof pct === "number" && pct < 100
        ? pct
        : 0;
    acc(map, date).habits.push(value);
  }

  const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : undefined);
  const sum = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) : undefined);

  const features: DailyFeature[] = [];
  const dates = Array.from(map.keys()).sort();
  for (const date of dates) {
    const day = map.get(date)!;
    const feature: DailyFeature = { date };
    const sleep = avg(day.sleep);
    const mood = avg(day.mood);
    const stress = avg(day.stress);
    const water = sum(day.water);
    const habits = avg(day.habits);
    const steps = sum(day.steps);
    if (typeof sleep === "number") feature.sleep = round(sleep, 1);
    if (typeof mood === "number") feature.mood = round(mood, 1);
    if (typeof stress === "number") feature.stress = round(stress, 1);
    if (typeof water === "number") feature.water = Math.round(water);
    if (typeof habits === "number") feature.habits = Math.round(habits);
    if (typeof steps === "number") feature.steps = Math.round(steps);
    if (
      feature.sleep !== undefined ||
      feature.mood !== undefined ||
      feature.stress !== undefined ||
      feature.water !== undefined ||
      feature.habits !== undefined ||
      feature.steps !== undefined
    ) {
      features.push(feature);
    }
  }
  return features;
}
