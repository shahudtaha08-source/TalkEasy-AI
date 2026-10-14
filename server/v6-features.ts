/**
 * TalkEasy v6.1.3 — feature routes.
 *
 * Adds, on top of the existing API:
 *   • server-authoritative entitlement status + 90-day access guard
 *   • device-sourced wearable measurements (kept separate from AI data)
 *   • daily/weekly/30-day/90-day insight aggregation for both sources
 *   • per-user notification preferences and push device-token registration
 *
 * Strict source isolation is enforced here: wellness endpoints read only the
 * wellness tables; wearable endpoints read only wearable_measurements.
 */
import type { Express, RequestHandler } from "express";
import { and, desc, eq, gte } from "drizzle-orm";
import { db } from "./db";
import { isAuthenticated } from "./auth";
import {
  wearableMeasurements,
  deviceTokens,
  notificationPreferences,
  moodReminderState,
  workoutSessions,
  users,
  moods,
  moodEntries,
  habits,
  sleepEntries,
  waterEntries,
  stressEntries,
  journals,
  reflectionResponses,
  goals,
} from "@shared/schema";
import {
  aggregateWellnessInsights,
  aggregateWearableInsights,
  getPeriodRange,
  type InsightPeriod,
  type WellnessInput,
  type WearableRow,
} from "@shared/insights";
import {
  mergeNotificationPreferences,
  defaultNotificationPreferences,
  defaultCategoriesMap,
  type NotificationPreferences,
} from "@shared/notifications";
import {
  MOOD_CHECKIN_INTERVAL_HOURS,
  MOOD_REMINDER_MESSAGE,
  computeNextMoodReminder,
  hasCheckedInWithin,
} from "@shared/mood-reminder";
import { validateWearableMeasurement, WEARABLE_PROVIDERS, WEARABLE_METRICS } from "@shared/wearable";
import {
  EXERCISE_ACTIVITIES,
  EXERCISE_CATEGORIES,
  WORKOUT_SOURCES,
  DEFERRED_WORKOUT_SOURCES,
  summarizeWorkouts,
  validateWorkoutSession,
} from "@shared/exercise";
import { getOrCreateEntitlement } from "./entitlement";
import { mlPatterns, mlForecasts } from "./ml/service";
import { sendPushToUser, isPushConfigured } from "./push";
import {
  countSubscriptions,
  getVapidConfig,
  isWebPushConfigured,
  removeSubscription,
  saveSubscription,
  sendWebPushToUser,
} from "./web-push";
import { latestSavedMoodCheckIn } from "./mood-reminder-scheduler";
import { normalizePushSubscription } from "@shared/web-push";
import { pushSubscriptionLimiter } from "./rate-limit";

const PERIODS: InsightPeriod[] = ["daily", "weekly", "30day", "90day"];

function isPeriod(value: string): value is InsightPeriod {
  return (PERIODS as string[]).includes(value);
}

/** Express middleware: allows the request only when the user has 90-day access. */
export function require90DayAccess(): RequestHandler {
  return async (req: any, res, next) => {
    try {
      const status = await getOrCreateEntitlement(req.user.claims.sub);
      if (status.canAccess90Day) return next();
      return res.status(402).json({
        message: "90-day trends and reports require an active free trial or the Premium plan.",
        entitlement: status,
        code: "premium_required",
      });
    } catch (error) {
      console.error("Entitlement check failed:", error);
      return res.status(500).json({ message: "Failed to verify access" });
    }
  };
}

async function loadWellnessInput(userId: string): Promise<WellnessInput> {
  const start = getPeriodRange("90day").start;

  const [user] = await db.select().from(users).where(eq(users.id, userId));
  const [moodRows, moodEntryRows, habitRows, sleepRows, waterRows, stressRows, journalRows, reflectionRows, goalRows] =
    await Promise.all([
      db.select().from(moods).where(and(eq(moods.userId, userId), gte(moods.date, start))),
      db.select().from(moodEntries).where(and(eq(moodEntries.userId, userId), gte(moodEntries.date, start))),
      db.select().from(habits).where(and(eq(habits.userId, userId), gte(habits.date, start))),
      db.select().from(sleepEntries).where(and(eq(sleepEntries.userId, userId), gte(sleepEntries.date, start))),
      db.select().from(waterEntries).where(and(eq(waterEntries.userId, userId), gte(waterEntries.date, start))),
      db.select().from(stressEntries).where(and(eq(stressEntries.userId, userId), gte(stressEntries.date, start))),
      db.select().from(journals).where(and(eq(journals.userId, userId), gte(journals.date, start))),
      db.select().from(reflectionResponses).where(and(eq(reflectionResponses.userId, userId), gte(reflectionResponses.date, start))),
      db.select().from(goals).where(eq(goals.userId, userId)),
    ]);

  return {
    moods: moodRows,
    moodEntries: moodEntryRows,
    habits: habitRows,
    sleep: sleepRows,
    water: waterRows,
    stress: stressRows,
    journals: journalRows,
    reflections: reflectionRows,
    goals: goalRows,
    waterTargetMl: user?.waterTargetMl ?? 2500,
    sleepTargetHours: user?.sleepTargetHours ?? 8,
  };
}

async function loadWearableRows(userId: string): Promise<WearableRow[]> {
  const start = getPeriodRange("90day").start;
  const rows = await db
    .select()
    .from(wearableMeasurements)
    .where(and(eq(wearableMeasurements.userId, userId), gte(wearableMeasurements.date, start)))
    .orderBy(desc(wearableMeasurements.recordedAt));
  return rows.map((r) => ({
    date: r.date,
    metric: r.metric,
    value: r.value,
    valueSecondary: r.valueSecondary,
    unit: r.unit,
    source: r.source,
    deviceLabel: r.deviceLabel,
    isDemo: r.isDemo,
    recordedAt: r.recordedAt,
  }));
}

export function registerV6FeatureRoutes(app: Express): void {
  // ── Entitlement ────────────────────────────────────────────────────────────
  app.get("/api/entitlement", isAuthenticated, async (req: any, res) => {
    try {
      const status = await getOrCreateEntitlement(req.user.claims.sub);
      res.json(status);
    } catch (error) {
      console.error("Entitlement error:", error);
      res.status(500).json({ message: "Failed to load entitlement" });
    }
  });

  // ── Wearable providers (honest capabilities) ───────────────────────────────
  app.get("/api/wearable/providers", isAuthenticated, (_req, res) => {
    res.json({ providers: WEARABLE_PROVIDERS, metrics: WEARABLE_METRICS });
  });

  // ── Wearable measurements (device-sourced only) ────────────────────────────
  app.get("/api/wearable/measurements", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const limit = Math.min(parseInt(String(req.query.limit || "500"), 10) || 500, 2000);
      const metric = typeof req.query.metric === "string" ? req.query.metric : undefined;
      const where = metric
        ? and(eq(wearableMeasurements.userId, userId), eq(wearableMeasurements.metric, metric))
        : eq(wearableMeasurements.userId, userId);
      const rows = await db
        .select()
        .from(wearableMeasurements)
        .where(where)
        .orderBy(desc(wearableMeasurements.recordedAt))
        .limit(limit);
      res.json(rows);
    } catch (error) {
      console.error("Wearable fetch error:", error);
      res.status(400).json({ message: "Failed to fetch wearable measurements" });
    }
  });

  app.post("/api/wearable/measurements", isAuthenticated, async (req: any, res) => {
    try {
      const check = validateWearableMeasurement(req.body);
      if (!check.ok) return res.status(400).json({ message: check.error });
      const m = check.value;
      const [created] = await db
        .insert(wearableMeasurements)
        .values({
          userId: req.user.claims.sub,
          source: m.source,
          deviceLabel: m.deviceLabel ?? null,
          metric: m.metric,
          value: m.value,
          valueSecondary: m.valueSecondary ?? null,
          unit: m.unit ?? null,
          recordedAt: new Date(m.recordedAt),
          date: m.date ?? m.recordedAt.slice(0, 10),
          isDemo: m.isDemo ?? false,
          meta: m.meta ? JSON.stringify(m.meta) : null,
        })
        .returning();
      res.status(201).json(created);
    } catch (error) {
      console.error("Wearable insert error:", error);
      res.status(400).json({ message: "Failed to save wearable measurement" });
    }
  });

  app.delete("/api/wearable/measurements/:id", isAuthenticated, async (req: any, res) => {
    try {
      const deleted = await db
        .delete(wearableMeasurements)
        .where(and(eq(wearableMeasurements.id, parseInt(req.params.id, 10)), eq(wearableMeasurements.userId, req.user.claims.sub)))
        .returning();
      if (!deleted.length) return res.status(404).json({ message: "Measurement not found" });
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ message: "Failed to delete wearable measurement" });
    }
  });

  // ── Insights: wellness ─────────────────────────────────────────────────────
  const wellnessInsights: RequestHandler = async (req: any, res, next) => {
    const period = String(req.params.period || "");
    if (!isPeriod(period)) return res.status(400).json({ message: "Unknown period" });
    if (period === "90day") return require90DayAccess()(req, res, next);
    next();
  };

  app.get("/api/insights/wellness/:period", isAuthenticated, wellnessInsights, async (req: any, res) => {
    try {
      const period = req.params.period as InsightPeriod;
      const tzOffset = parseInt(String(req.query.tzOffsetMinutes ?? "0"), 10) || 0;
      const input = await loadWellnessInput(req.user.claims.sub);

      // Attach source-appropriate ML (respects existing insufficient-data behaviour).
      try {
        const [patterns, forecasts] = await Promise.all([
          mlPatterns(req.user.claims.sub),
          mlForecasts(req.user.claims.sub),
        ]);
        input.ml = { patterns: patterns?.status === "ok" ? patterns : null, forecasts: forecasts?.status === "ok" ? forecasts : null };
      } catch {
        input.ml = null;
      }

      const bundle = aggregateWellnessInsights(input, period, new Date(), tzOffset);
      res.json(bundle);
    } catch (error) {
      console.error("Wellness insights error:", error);
      res.status(500).json({ message: "Failed to build wellness insights" });
    }
  });

  // ── Insights: wearable (device data only) ──────────────────────────────────
  const wearableInsights: RequestHandler = async (req: any, res, next) => {
    const period = String(req.params.period || "");
    if (!isPeriod(period)) return res.status(400).json({ message: "Unknown period" });
    if (period === "90day") return require90DayAccess()(req, res, next);
    next();
  };

  app.get("/api/insights/wearable/:period", isAuthenticated, wearableInsights, async (req: any, res) => {
    try {
      const period = req.params.period as InsightPeriod;
      const tzOffset = parseInt(String(req.query.tzOffsetMinutes ?? "0"), 10) || 0;
      // NOTE: wearable ML intentionally not attached here — wearable analysis
      // must use device data only, and no combined analysis is implemented.
      const measurements = await loadWearableRows(req.user.claims.sub);
      const bundle = aggregateWearableInsights({ measurements }, period, new Date(), tzOffset);
      res.json(bundle);
    } catch (error) {
      console.error("Wearable insights error:", error);
      res.status(500).json({ message: "Failed to build wearable insights" });
    }
  });

  // ── Notification preferences ───────────────────────────────────────────────
  app.get("/api/notifications/preferences", isAuthenticated, async (req: any, res) => {
    try {
      const [row] = await db
        .select()
        .from(notificationPreferences)
        .where(eq(notificationPreferences.userId, req.user.claims.sub));
      if (!row) {
        return res.json({ ...defaultNotificationPreferences(), pushConfigured: isPushConfigured(), webPushConfigured: isWebPushConfigured() });
      }
      const prefs: NotificationPreferences = {
        timezone: row.timezone,
        quietHoursStart: row.quietHoursStart,
        quietHoursEnd: row.quietHoursEnd,
        categories: { ...defaultCategoriesMap(), ...safeParseCategories(row.categories) },
      };
      res.json({ ...prefs, pushConfigured: isPushConfigured(), webPushConfigured: isWebPushConfigured() });
    } catch (error) {
      console.error("Preferences fetch error:", error);
      res.status(500).json({ message: "Failed to load notification preferences" });
    }
  });

  app.put("/api/notifications/preferences", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const [existing] = await db
        .select()
        .from(notificationPreferences)
        .where(eq(notificationPreferences.userId, userId));

      const current: NotificationPreferences = existing
        ? {
            timezone: existing.timezone,
            quietHoursStart: existing.quietHoursStart,
            quietHoursEnd: existing.quietHoursEnd,
            categories: { ...defaultCategoriesMap(), ...safeParseCategories(existing.categories) },
          }
        : defaultNotificationPreferences();

      const merged = mergeNotificationPreferences(current, req.body || {});
      const payload = {
        userId,
        timezone: merged.timezone,
        quietHoursStart: merged.quietHoursStart,
        quietHoursEnd: merged.quietHoursEnd,
        categories: JSON.stringify(merged.categories),
        updatedAt: new Date(),
      };

      if (existing) {
        await db.update(notificationPreferences).set(payload).where(eq(notificationPreferences.userId, userId));
      } else {
        await db.insert(notificationPreferences).values(payload);
      }
      res.json(merged);
    } catch (error) {
      console.error("Preferences save error:", error);
      res.status(400).json({ message: "Failed to save notification preferences" });
    }
  });

  // ── Mood check-in reminder (3-hour interval) ───────────────────────────────
  // The next reminder is derived from the last *saved* mood check-in, never from
  // merely opening the mood screen. This endpoint is the server-authoritative
  // scheduling state; the web client and the Flutter app schedule the actual
  // local notification from it. No reminder is ever fabricated: with no saved
  // check-ins the interval simply starts from "now". The same
  // `latestSavedMoodCheckIn` helper drives the background scheduler.
  app.get("/api/notifications/mood-reminder", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const [prefRow] = await db
        .select()
        .from(notificationPreferences)
        .where(eq(notificationPreferences.userId, userId));
      const categories = prefRow
        ? { ...defaultCategoriesMap(), ...safeParseCategories(prefRow.categories) }
        : defaultCategoriesMap();
      const moodCategory = categories["wellness.mood"];
      const quietHoursStart = prefRow?.quietHoursStart ?? "22:00";
      const quietHoursEnd = prefRow?.quietHoursEnd ?? "07:00";
      const timezone = prefRow?.timezone ?? "UTC";

      const lastCheckIn = await latestSavedMoodCheckIn(userId);
      const now = new Date();
      const nextReminderAt = computeNextMoodReminder({
        lastCheckInAt: lastCheckIn,
        now,
        intervalHours: moodCategory?.intervalHours ?? MOOD_CHECKIN_INTERVAL_HOURS,
        timezone,
        quietHoursStart,
        quietHoursEnd,
      });

      res.json({
        enabled: moodCategory ? moodCategory.enabled : true,
        intervalHours: moodCategory?.intervalHours ?? MOOD_CHECKIN_INTERVAL_HOURS,
        timezone,
        quietHoursStart,
        quietHoursEnd,
        lastCheckInAt: lastCheckIn ? lastCheckIn.toISOString() : null,
        checkedInWithinInterval: hasCheckedInWithin(lastCheckIn, now, moodCategory?.intervalHours ?? MOOD_CHECKIN_INTERVAL_HOURS),
        nextReminderAt: nextReminderAt.toISOString(),
        message: MOOD_REMINDER_MESSAGE,
      });
    } catch (error) {
      console.error("Mood reminder fetch error:", error);
      res.status(500).json({ message: "Failed to compute mood reminder" });
    }
  });

  // Persist client scheduling state so a reconnecting device does not re-fire an
  // already-shown reminder. The server never invents an entry here.
  app.put("/api/notifications/mood-reminder", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const parseDate = (v: unknown): Date | null => {
        if (typeof v !== "string" || !v) return null;
        const d = new Date(v);
        return Number.isNaN(d.getTime()) ? null : d;
      };
      const lastCheckInAt = parseDate(req.body?.lastCheckInAt);
      const nextReminderAt = parseDate(req.body?.nextReminderAt);
      const lastNotifiedAt = parseDate(req.body?.lastNotifiedAt);

      const [existing] = await db.select().from(moodReminderState).where(eq(moodReminderState.userId, userId));
      const payload = {
        userId,
        lastCheckInAt: lastCheckInAt ?? existing?.lastCheckInAt ?? null,
        nextReminderAt: nextReminderAt ?? existing?.nextReminderAt ?? null,
        lastNotifiedAt: lastNotifiedAt ?? existing?.lastNotifiedAt ?? null,
        updatedAt: new Date(),
      };
      if (existing) {
        await db.update(moodReminderState).set(payload).where(eq(moodReminderState.userId, userId));
      } else {
        await db.insert(moodReminderState).values(payload);
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Mood reminder save error:", error);
      res.status(400).json({ message: "Failed to save mood reminder state" });
    }
  });

  // ── Device tokens ──────────────────────────────────────────────────────────
  app.post("/api/notifications/device-tokens", isAuthenticated, async (req: any, res) => {
    try {
      const { token, platform, provider } = req.body || {};
      if (!token || typeof token !== "string" || token.length < 10) {
        return res.status(400).json({ message: "A valid device token is required" });
      }
      const userId = req.user.claims.sub;
      const [existing] = await db.select().from(deviceTokens).where(eq(deviceTokens.token, token));
      if (existing) {
        // Re-assign to the current user and revive if previously invalid.
        await db
          .update(deviceTokens)
          .set({ userId, platform: platform || existing.platform, invalid: false, updatedAt: new Date(), lastSeenAt: new Date() })
          .where(eq(deviceTokens.token, token));
      } else {
        await db.insert(deviceTokens).values({
          userId,
          token,
          platform: platform || "unknown",
          provider: provider || "fcm",
        });
      }
      res.status(201).json({ success: true });
    } catch (error) {
      console.error("Device token error:", error);
      res.status(400).json({ message: "Failed to register device token" });
    }
  });

  app.delete("/api/notifications/device-tokens", isAuthenticated, async (req: any, res) => {
    try {
      const token = req.body?.token || req.query.token;
      if (!token) return res.status(400).json({ message: "Token is required" });
      await db
        .delete(deviceTokens)
        .where(and(eq(deviceTokens.token, String(token)), eq(deviceTokens.userId, req.user.claims.sub)));
      res.json({ success: true });
    } catch {
      res.status(400).json({ message: "Failed to remove device token" });
    }
  });

  // ── Test push (never sends protected content; useful for verification) ─────
  app.post("/api/notifications/test-push", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const payload = {
        title: "TalkEasy",
        body: "Notifications are working.",
        deepLink: "/dashboard",
        category: "test",
        tag: "talkeasy-test",
      };
      const [fcm, webPush] = await Promise.all([
        isPushConfigured()
          ? sendPushToUser(userId, { title: payload.title, body: payload.body, deepLink: payload.deepLink, category: payload.category })
          : Promise.resolve({ configured: false, sent: 0, failed: 0, invalidTokensRemoved: 0 }),
        sendWebPushToUser(userId, payload),
      ]);
      res.json({ fcm, webPush });
    } catch (error) {
      console.error("Test push error:", error);
      res.status(500).json({ message: "Push delivery failed" });
    }
  });

  // ── Web Push (browser Push API) ─────────────────────────────────────────────
  // Only the public VAPID key is ever exposed; the private key stays in the
  // deployment secrets. Subscriptions are validated, scoped to the caller, and
  // may only be removed by their owner.
  app.get("/api/notifications/web-push/config", isAuthenticated, (_req, res) => {
    const cfg = getVapidConfig();
    res.json({ configured: cfg.configured, publicKey: cfg.publicKey, subject: cfg.subject });
  });

  app.get("/api/notifications/web-push/status", isAuthenticated, async (req: any, res) => {
    try {
      const subscriptions = await countSubscriptions(req.user.claims.sub);
      res.json({ configured: isWebPushConfigured(), subscriptions });
    } catch (error) {
      console.error("Web push status error:", error);
      res.status(500).json({ message: "Failed to load web push status" });
    }
  });

  app.post("/api/notifications/web-push/subscriptions", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const limit = pushSubscriptionLimiter.check(userId);
      if (!limit.allowed) {
        res.setHeader("Retry-After", String(limit.retryAfterSeconds));
        return res.status(429).json({ message: "Too many subscription changes. Please try again later." });
      }
      const check = normalizePushSubscription(req.body);
      if (!check.ok) return res.status(400).json({ message: check.error });
      const { created } = await saveSubscription(userId, check.value, req.get("user-agent") || undefined);
      res.status(created ? 201 : 200).json({ success: true, created });
    } catch (error) {
      console.error("Web push subscribe error:", error);
      res.status(400).json({ message: "Failed to save web push subscription" });
    }
  });

  app.delete("/api/notifications/web-push/subscriptions", isAuthenticated, async (req: any, res) => {
    try {
      const endpoint = typeof req.body?.endpoint === "string" ? req.body.endpoint : "";
      if (!endpoint) return res.status(400).json({ message: "An endpoint is required" });
      const removed = await removeSubscription(req.user.claims.sub, endpoint);
      res.json({ success: true, removed });
    } catch (error) {
      console.error("Web push unsubscribe error:", error);
      res.status(400).json({ message: "Failed to remove web push subscription" });
    }
  });

  // ── v6.2.0 · Exercise / activity tracking ──────────────────────────────────
  // Catalogue is static and honest about capabilities. Camera recognition is
  // reported as deferred rather than offered as a working feature.
  app.get("/api/exercise/catalog", isAuthenticated, (_req, res) => {
    res.json({
      categories: EXERCISE_CATEGORIES,
      activities: EXERCISE_ACTIVITIES,
      sources: WORKOUT_SOURCES,
      deferredSources: DEFERRED_WORKOUT_SOURCES,
    });
  });

  app.get("/api/workouts", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const limit = Math.min(parseInt(String(req.query.limit || "100"), 10) || 100, 500);
      const rows = await db
        .select()
        .from(workoutSessions)
        .where(eq(workoutSessions.userId, userId))
        .orderBy(desc(workoutSessions.startedAt))
        .limit(limit);
      res.json(rows);
    } catch (error) {
      console.error("Workout fetch error:", error);
      res.status(400).json({ message: "Failed to fetch workouts" });
    }
  });

  app.get("/api/workouts/summary", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const rows = await db
        .select()
        .from(workoutSessions)
        .where(eq(workoutSessions.userId, userId))
        .orderBy(desc(workoutSessions.startedAt))
        .limit(1000);
      res.json(
        summarizeWorkouts(
          rows.map((r) => ({
            category: r.category,
            durationSeconds: r.durationSeconds,
            repetitions: r.repetitions,
            distanceMeters: r.distanceMeters,
            caloriesKcal: r.caloriesKcal,
          })),
        ),
      );
    } catch (error) {
      console.error("Workout summary error:", error);
      res.status(400).json({ message: "Failed to summarize workouts" });
    }
  });

  app.post("/api/workouts", isAuthenticated, async (req: any, res) => {
    try {
      const check = validateWorkoutSession(req.body);
      if (!check.ok) return res.status(400).json({ message: check.error, field: check.field });
      const v = check.value;
      const [created] = await db
        .insert(workoutSessions)
        .values({
          userId: req.user.claims.sub,
          activityId: v.activityId,
          category: v.category,
          source: v.source,
          startedAt: v.startedAt,
          durationSeconds: v.durationSeconds,
          repetitions: v.repetitions,
          sets: v.sets,
          distanceMeters: v.distanceMeters,
          weightKg: v.weightKg,
          caloriesKcal: v.caloriesKcal,
          caloriesEstimated: v.caloriesEstimated,
          weightAssumed: v.weightAssumed,
          met: v.met,
          notes: v.notes,
          date: v.startedAt.toISOString().slice(0, 10),
        })
        .returning();
      res.status(201).json(created);
    } catch (error) {
      console.error("Workout insert error:", error);
      res.status(400).json({ message: "Failed to save workout" });
    }
  });

  app.delete("/api/workouts/:id", isAuthenticated, async (req: any, res) => {
    try {
      const deleted = await db
        .delete(workoutSessions)
        .where(and(eq(workoutSessions.id, parseInt(req.params.id, 10)), eq(workoutSessions.userId, req.user.claims.sub)))
        .returning();
      if (!deleted.length) return res.status(404).json({ message: "Workout not found" });
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ message: "Failed to delete workout" });
    }
  });
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
