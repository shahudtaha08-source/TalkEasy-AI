import { and, eq, gte } from "drizzle-orm";
import { db } from "../db";
import { healthDailyRecords, habits, moodEntries, sleepEntries, stressEntries, waterEntries } from "@shared/schema";
import type { RawWellnessData } from "./feature-engineering";

/** Days of history pulled for ML analysis. */
export const ML_WINDOW_DAYS = 90;

/**
 * Loads the last `windowDays` of per-user tracking rows. Read-only.
 */
export async function loadRawWellnessData(userId: string, windowDays = ML_WINDOW_DAYS): Promise<RawWellnessData> {
  const cutoff = new Date(Date.now() - (windowDays - 1) * 86400000).toISOString().slice(0, 10);

  const [health, moods, stresses, waters, sleeps, habitRows] = await Promise.all([
    db
      .select({
        date: healthDailyRecords.date,
        sleepHours: healthDailyRecords.sleepHours,
        waterMl: healthDailyRecords.waterMl,
        stressLevel: healthDailyRecords.stressLevel,
        mood: healthDailyRecords.mood,
        moodIntensity: healthDailyRecords.moodIntensity,
        steps: healthDailyRecords.steps,
      })
      .from(healthDailyRecords)
      .where(and(eq(healthDailyRecords.userId, userId), gte(healthDailyRecords.date, cutoff))),
    db
      .select({ date: moodEntries.date, mood: moodEntries.mood, intensity: moodEntries.intensity })
      .from(moodEntries)
      .where(and(eq(moodEntries.userId, userId), gte(moodEntries.date, cutoff))),
    db
      .select({ date: stressEntries.date, level: stressEntries.level, score: stressEntries.score })
      .from(stressEntries)
      .where(and(eq(stressEntries.userId, userId), gte(stressEntries.date, cutoff))),
    db
      .select({ date: waterEntries.date, amountMl: waterEntries.amountMl })
      .from(waterEntries)
      .where(and(eq(waterEntries.userId, userId), gte(waterEntries.date, cutoff))),
    db
      .select({
        date: sleepEntries.date,
        totalSleep: sleepEntries.totalSleep,
        nightSleep: sleepEntries.nightSleep,
        nap: sleepEntries.nap,
      })
      .from(sleepEntries)
      .where(and(eq(sleepEntries.userId, userId), gte(sleepEntries.date, cutoff))),
    db
      .select({
        date: habits.date,
        completed: habits.completed,
        completionPercentage: habits.completionPercentage,
      })
      .from(habits)
      .where(and(eq(habits.userId, userId), gte(habits.date, cutoff))),
  ]);

  return { health, moods, stresses, waters, sleeps, habits: habitRows };
}
