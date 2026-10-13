/**
 * TalkEasy v6.1.3 — notification category definitions.
 *
 * Each category is bound to exactly one data source. This is what keeps
 * TalkEasy AI notifications (wellness records) separate from TalkEasy Wearable
 * notifications (device measurements). The server validates and persists these;
 * the Flutter app reads them to schedule local reminders.
 */

export type NotificationSource = "wellness" | "wearable";

export type NotificationFrequency = "daily" | "weekly" | "interval" | "milestone" | "onsite";

export interface NotificationCategoryConfig {
  key: string;
  source: NotificationSource;
  label: string;
  enabled: boolean;
  /** Local time "HH:mm" for scheduled prompts. */
  time?: string;
  frequency: NotificationFrequency;
  /** For weekly categories, the day (0=Sunday .. 6=Saturday). */
  weekday?: number;
  /** For interval categories, hours between prompts. */
  intervalHours?: number;
}

export const DEFAULT_NOTIFICATION_CATEGORIES: NotificationCategoryConfig[] = [
  // ── TalkEasy AI — Personal Wellness ─────────────────────────────────────────
  // Mood is an interval reminder: nudge every 3 hours from the last *saved*
  // check-in rather than once at a fixed time. Scheduling rules live in
  // shared/mood-reminder.ts.
  { key: "wellness.mood", source: "wellness", label: "Mood check-in (every 3 hours)", enabled: true, frequency: "interval", intervalHours: 3 },
  { key: "wellness.habits", source: "wellness", label: "Habit reminder", enabled: true, time: "20:00", frequency: "daily" },
  { key: "wellness.sleep", source: "wellness", label: "Sleep check-in", enabled: true, time: "22:00", frequency: "daily" },
  { key: "wellness.hydration", source: "wellness", label: "Hydration reminder", enabled: true, time: "11:00", frequency: "interval", intervalHours: 3 },
  { key: "wellness.stress", source: "wellness", label: "Stress check-in", enabled: true, time: "18:00", frequency: "daily" },
  { key: "wellness.goals", source: "wellness", label: "Personal goal reminder", enabled: true, time: "19:00", frequency: "daily" },
  { key: "wellness.journal", source: "wellness", label: "Journal / reflection prompt", enabled: false, time: "21:00", frequency: "daily" },
  { key: "wellness.dailyInsights", source: "wellness", label: "Daily wellness insights", enabled: true, time: "08:00", frequency: "daily" },
  { key: "wellness.weeklyInsights", source: "wellness", label: "Weekly wellness summary", enabled: true, time: "18:00", frequency: "weekly", weekday: 0 },
  { key: "wellness.mlInsights", source: "wellness", label: "New ML insight", enabled: true, frequency: "onsite" },
  { key: "wellness.journey", source: "wellness", label: "Wellness Journey milestone", enabled: true, frequency: "milestone" },

  // ── TalkEasy Wearable — Device Health ───────────────────────────────────────
  { key: "wearable.dailyInsights", source: "wearable", label: "Daily device insights", enabled: false, time: "08:00", frequency: "daily" },
  { key: "wearable.weeklyInsights", source: "wearable", label: "Weekly device summary", enabled: false, time: "18:00", frequency: "weekly", weekday: 0 },
  { key: "wearable.heartRate", source: "wearable", label: "Heart-rate alert", enabled: false, frequency: "onsite" },
  { key: "wearable.steps", source: "wearable", label: "Step-goal reminder", enabled: false, time: "19:00", frequency: "daily" },
  { key: "wearable.sleep", source: "wearable", label: "Wearable sleep summary", enabled: false, time: "07:30", frequency: "daily" },
];

export interface NotificationPreferences {
  timezone: string;
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
  categories: Record<string, NotificationCategoryConfig>;
}

export function defaultCategoriesMap(): Record<string, NotificationCategoryConfig> {
  const map: Record<string, NotificationCategoryConfig> = {};
  for (const c of DEFAULT_NOTIFICATION_CATEGORIES) {
    map[c.key] = { ...c };
  }
  return map;
}

export function defaultNotificationPreferences(): NotificationPreferences {
  return { timezone: "UTC", quietHoursStart: "22:00", quietHoursEnd: "07:00", categories: defaultCategoriesMap() };
}

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

/**
 * Merges an untrusted client payload onto defaults. Unknown categories are
 * ignored; structural fields are validated. Never trusts `source` from the
 * client — it is always taken from the canonical definition.
 */
export function mergeNotificationPreferences(
  current: NotificationPreferences,
  patch: Partial<NotificationPreferences>,
): NotificationPreferences {
  const next: NotificationPreferences = {
    timezone: typeof patch.timezone === "string" && patch.timezone ? patch.timezone : current.timezone,
    quietHoursStart: patch.quietHoursStart === undefined ? current.quietHoursStart : normalizeTime(patch.quietHoursStart),
    quietHoursEnd: patch.quietHoursEnd === undefined ? current.quietHoursEnd : normalizeTime(patch.quietHoursEnd),
    categories: { ...current.categories },
  };

  if (patch.categories && typeof patch.categories === "object") {
    for (const [key, raw] of Object.entries(patch.categories)) {
      const canonical = DEFAULT_NOTIFICATION_CATEGORIES.find((c) => c.key === key);
      if (!canonical || !raw || typeof raw !== "object") continue;
      const incoming = raw as Partial<NotificationCategoryConfig>;
      next.categories[key] = {
        ...canonical,
        enabled: typeof incoming.enabled === "boolean" ? incoming.enabled : canonical.enabled,
        time: incoming.time === undefined ? canonical.time : normalizeTime(incoming.time) ?? canonical.time,
        intervalHours:
          typeof incoming.intervalHours === "number" && incoming.intervalHours >= 1 && incoming.intervalHours <= 12
            ? Math.round(incoming.intervalHours)
            : canonical.intervalHours,
        weekday:
          typeof incoming.weekday === "number" && incoming.weekday >= 0 && incoming.weekday <= 6
            ? Math.round(incoming.weekday)
            : canonical.weekday,
      };
    }
  }

  return next;
}

export function normalizeTime(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const v = value.trim();
  if (!v) return null;
  return TIME_RE.test(v) ? v : null;
}

/** Filters a preference map down to a single data source (used for isolation). */
export function categoriesForSource(
  prefs: NotificationPreferences,
  source: NotificationSource,
): NotificationCategoryConfig[] {
  return Object.values(prefs.categories).filter((c) => c.source === source);
}
