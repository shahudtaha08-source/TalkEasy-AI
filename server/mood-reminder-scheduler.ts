/**
 * TalkEasy v6.3.0 — background mood-reminder scheduler (server side).
 *
 * Ticks periodically and, for every user with an active push channel (Web Push
 * subscription and/or FCM device token), decides whether the 3-hour mood
 * check-in reminder is due using the shared pure rules in
 * `shared/mood-reminder.ts`.
 *
 * Design guarantees:
 *   • The anchor is the last *saved* check-in; when the user has never checked
 *     in, it is the time they enabled a push channel (subscription/token),
 *     never merely opening a screen.
 *   • At most one reminder per elapsed interval slot — `lastNotifiedAt` dedupes,
 *     and many missed slots collapse into a single nudge (no burst).
 *   • Quiet hours, timezone and the per-category toggle are respected.
 *   • A reminder is only counted as delivered when a provider confirms it; the
 *     scheduler never fabricates a mood entry or claims delivery otherwise.
 */
import { and, desc, eq } from "drizzle-orm";
import { db } from "./db";
import {
  deviceTokens,
  moodEntries,
  moodReminderState,
  moods,
  notificationPreferences,
  pushSubscriptions,
} from "@shared/schema";
import {
  computeMoodReminderDue,
  computeNextMoodReminder,
  MOOD_CHECKIN_INTERVAL_HOURS,
} from "@shared/mood-reminder";
import { defaultCategoriesMap, type NotificationCategoryConfig } from "@shared/notifications";
import { buildMoodReminderPushPayload } from "@shared/web-push";
import { firstSubscriptionAt, isWebPushConfigured, sendWebPushToUser } from "./web-push";
import { isPushConfigured, sendPushToUser } from "./push";

const TICK_INTERVAL_MS = 60_000;
const KICKOFF_DELAY_MS = 5_000;

export interface SchedulerTickResult {
  evaluated: number;
  due: number;
  delivered: number;
  skipped: number;
}

/**
 * The last mood entry the backend actually saved, across both the structured
 * (v6.3.0) and legacy mood tables. Returns null when the user has none.
 */
export async function latestSavedMoodCheckIn(userId: string): Promise<Date | null> {
  const [entry] = await db
    .select({ createdAt: moodEntries.createdAt })
    .from(moodEntries)
    .where(eq(moodEntries.userId, userId))
    .orderBy(desc(moodEntries.createdAt))
    .limit(1);
  const [legacy] = await db
    .select({ createdAt: moods.createdAt })
    .from(moods)
    .where(eq(moods.userId, userId))
    .orderBy(desc(moods.createdAt))
    .limit(1);
  const candidates = [entry?.createdAt, legacy?.createdAt].filter((v): v is Date => v instanceof Date);
  if (!candidates.length) return null;
  return candidates.reduce((a, b) => (a.getTime() >= b.getTime() ? a : b));
}

async function usersWithPushChannel(): Promise<string[]> {
  const [subs, tokens] = await Promise.all([
    db.select({ userId: pushSubscriptions.userId }).from(pushSubscriptions).where(eq(pushSubscriptions.invalid, false)),
    db.select({ userId: deviceTokens.userId }).from(deviceTokens).where(eq(deviceTokens.invalid, false)),
  ]);
  const set = new Set<string>();
  for (const s of subs) set.add(s.userId);
  for (const t of tokens) set.add(t.userId);
  return Array.from(set);
}

async function firstDeviceTokenAt(userId: string): Promise<Date | null> {
  const rows = await db
    .select({ createdAt: deviceTokens.createdAt })
    .from(deviceTokens)
    .where(eq(deviceTokens.userId, userId));
  const dates = rows.map((r) => r.createdAt).filter((v): v is Date => v instanceof Date);
  if (!dates.length) return null;
  return dates.reduce((a, b) => (a.getTime() <= b.getTime() ? a : b));
}

function safeParseCategories(raw: string | null): Record<string, any> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

async function upsertReminderState(
  userId: string,
  values: { lastCheckInAt: Date | null; nextReminderAt: Date; lastNotifiedAt: Date },
): Promise<void> {
  const [existing] = await db.select().from(moodReminderState).where(eq(moodReminderState.userId, userId));
  const payload = {
    userId,
    lastCheckInAt: values.lastCheckInAt ?? existing?.lastCheckInAt ?? null,
    nextReminderAt: values.nextReminderAt,
    lastNotifiedAt: values.lastNotifiedAt,
    updatedAt: new Date(),
  };
  if (existing) {
    await db.update(moodReminderState).set(payload).where(eq(moodReminderState.userId, userId));
  } else {
    await db.insert(moodReminderState).values(payload);
  }
}

/**
 * Runs a single scheduling pass. Exported for tests/tools; safe to call
 * concurrently-ish because every write is keyed by user id.
 */
export async function runMoodReminderTick(now: Date = new Date()): Promise<SchedulerTickResult> {
  const result: SchedulerTickResult = { evaluated: 0, due: 0, delivered: 0, skipped: 0 };
  if (!isWebPushConfigured() && !isPushConfigured()) return result;

  const userIds = await usersWithPushChannel();

  for (const userId of userIds) {
    result.evaluated++;
    try {
      const [prefRow] = await db
        .select()
        .from(notificationPreferences)
        .where(eq(notificationPreferences.userId, userId));
      const categories = prefRow
        ? { ...defaultCategoriesMap(), ...safeParseCategories(prefRow.categories) }
        : defaultCategoriesMap();
      const moodCategory: NotificationCategoryConfig | undefined = categories["wellness.mood"];

      if (!(moodCategory ? moodCategory.enabled : true)) {
        result.skipped++;
        continue;
      }

      const intervalHours = moodCategory?.intervalHours ?? MOOD_CHECKIN_INTERVAL_HOURS;
      const timezone = prefRow?.timezone ?? "UTC";
      const quietHoursStart = prefRow?.quietHoursStart ?? "22:00";
      const quietHoursEnd = prefRow?.quietHoursEnd ?? "07:00";

      const lastCheckIn = await latestSavedMoodCheckIn(userId);
      const [state] = await db.select().from(moodReminderState).where(eq(moodReminderState.userId, userId));

      let anchor = lastCheckIn;
      if (!anchor) {
        anchor = (await firstSubscriptionAt(userId)) ?? (await firstDeviceTokenAt(userId));
      }

      const due = computeMoodReminderDue({
        anchorAt: anchor,
        now,
        intervalHours,
        timezone,
        quietHoursStart,
        quietHoursEnd,
        lastNotifiedAt: state?.lastNotifiedAt ?? null,
      });

      if (!due) {
        result.skipped++;
        continue;
      }
      result.due++;

      const payload = buildMoodReminderPushPayload();
      let delivered = 0;
      if (isWebPushConfigured()) {
        const web = await sendWebPushToUser(userId, payload);
        delivered += web.sent;
      }
      if (isPushConfigured()) {
        const fcm = await sendPushToUser(userId, {
          title: payload.title,
          body: payload.body,
          deepLink: payload.deepLink,
          category: payload.category,
        });
        delivered += fcm.sent;
      }
      if (delivered > 0) result.delivered++;

      // Mark this slot notified even if delivery failed, so a broken channel is
      // not retried every tick: expired endpoints are pruned, transient failures
      // are bounded by the provider-level retry counter, and the next 3-hour
      // slot will try again.
      const nextReminderAt = computeNextMoodReminder({
        lastCheckInAt: lastCheckIn,
        now,
        intervalHours,
        timezone,
        quietHoursStart,
        quietHoursEnd,
      });
      await upsertReminderState(userId, { lastCheckInAt: lastCheckIn, nextReminderAt, lastNotifiedAt: now });
    } catch (error) {
      console.error(`[mood-reminder] user ${userId} tick failed:`, error);
      result.skipped++;
    }
  }

  return result;
}

let timer: NodeJS.Timeout | null = null;

/** Starts the periodic scheduler once. No-op when no push provider is configured. */
export function startMoodReminderScheduler(): void {
  if (timer) return;
  if (!isWebPushConfigured() && !isPushConfigured()) {
    console.log("[mood-reminder] no push provider configured — background reminders disabled");
    return;
  }
  const tick = () => {
    runMoodReminderTick().catch((error) => console.error("[mood-reminder] tick failed:", error));
  };
  timer = setInterval(tick, TICK_INTERVAL_MS);
  timer.unref?.();
  const kickoff = setTimeout(tick, KICKOFF_DELAY_MS);
  kickoff.unref?.();
  console.log("[mood-reminder] scheduler started (tick every 60s)");
}

export function stopMoodReminderScheduler(): void {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}
