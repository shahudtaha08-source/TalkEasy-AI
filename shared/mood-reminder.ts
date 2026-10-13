/**
 * TalkEasy — mood check-in reminder scheduling (shared, pure, testable).
 *
 * The mood tracker asks for a check-in every few hours. The single source of
 * truth for "when is the next nudge?" is the timestamp of the last mood entry
 * the backend actually saved. `computeNextMoodReminder` is deliberately free of
 * any transport (web Notification, FCM, Flutter local) so both the browser and
 * the phone can schedule the same reminder from the same rules.
 *
 * Guarantees:
 *   • derives the next reminder from the last *saved* check-in, never from
 *     merely opening the mood screen;
 *   • never produces a backlog of missed reminders (a device reconnecting after
 *     being offline gets exactly one future reminder);
 *   • skips the user's quiet hours and resumes at quiet-hours end;
 *   • treats timestamps as absolute instants so timezone changes simply
 *     re-project the same check-in into the new local day.
 */

export const MOOD_CHECKIN_INTERVAL_HOURS = 3;

/** Privacy-friendly lock-screen / notification body. */
export const MOOD_REMINDER_MESSAGE = "Time for your TalkEasy mood check-in.";

export interface MoodReminderInput {
  /** Timestamp of the last successfully saved check-in (null if none yet). */
  lastCheckInAt: Date | string | number | null | undefined;
  /** Reference "now" — injected so callers and tests agree on the clock. */
  now: Date | string | number;
  intervalHours?: number;
  /** IANA timezone (e.g. "Asia/Kolkata"). Quiet hours are evaluated here. */
  timezone?: string;
  quietHoursStart?: string | null;
  quietHoursEnd?: string | null;
}

const HOUR_MS = 3_600_000;
const MINUTE_MS = 60_000;

function toDate(value: Date | string | number): Date {
  return value instanceof Date ? value : new Date(value);
}

function parseHHmm(value?: string | null): number | null {
  if (typeof value !== "string") return null;
  const m = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value.trim());
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
}

/** Local minute-of-day (0..1439) for an instant in the given timezone. */
export function localMinutesOfDay(instant: Date, timezone = "UTC"): number {
  let parts: Intl.DateTimeFormatPart[];
  try {
    parts = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone || "UTC",
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
    }).formatToParts(instant);
  } catch {
    // Unknown timezone — fall back to UTC rather than throwing during scheduling.
    parts = new Intl.DateTimeFormat("en-US", { timeZone: "UTC", hour12: false, hour: "2-digit", minute: "2-digit" }).formatToParts(instant);
  }
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? "0") % 24;
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? "0");
  return hour * 60 + minute;
}

/**
 * True when the instant falls inside quiet hours. Handles the common
 * wrap-around window (e.g. 22:00 → 07:00). Equal start/end means "no quiet
 * hours" rather than a 24h mute.
 */
export function isInQuietHours(
  instant: Date,
  timezone: string,
  quietHoursStart?: string | null,
  quietHoursEnd?: string | null,
): boolean {
  const start = parseHHmm(quietHoursStart);
  const end = parseHHmm(quietHoursEnd);
  if (start === null || end === null || start === end) return false;
  const minutes = localMinutesOfDay(instant, timezone);
  if (start < end) return minutes >= start && minutes < end;
  return minutes >= start || minutes < end;
}

/** Moves an instant that sits inside quiet hours to the end of the window. */
export function movePastQuietHours(instant: Date, timezone: string, quietHoursEnd: string): Date {
  const end = parseHHmm(quietHoursEnd);
  if (end === null) return instant;
  const minutes = localMinutesOfDay(instant, timezone);
  const delta = (end - minutes + 1440) % 1440 || 1440;
  return new Date(instant.getTime() + delta * MINUTE_MS);
}

/**
 * Next reminder instant. See module docs for the exact rules.
 */
export function computeNextMoodReminder(input: MoodReminderInput): Date {
  const intervalHours = input.intervalHours && input.intervalHours > 0 ? input.intervalHours : MOOD_CHECKIN_INTERVAL_HOURS;
  const stepMs = intervalHours * HOUR_MS;
  const now = toDate(input.now);
  const last = input.lastCheckInAt != null ? toDate(input.lastCheckInAt) : null;

  // Anchor on the last saved check-in; with none, start the interval from now.
  const baseMs = Math.min(last ? last.getTime() : now.getTime(), now.getTime());

  let nextMs = baseMs + stepMs;
  if (nextMs <= now.getTime()) {
    // Missed one or more reminders (offline, app closed). Advance in whole
    // intervals to the first slot strictly after `now` — one reminder, no burst.
    const steps = Math.floor((now.getTime() - baseMs) / stepMs) + 1;
    nextMs = baseMs + steps * stepMs;
  }
  while (nextMs <= now.getTime()) nextMs += stepMs;

  let next = new Date(nextMs);
  const tz = input.timezone || "UTC";
  if (isInQuietHours(next, tz, input.quietHoursStart, input.quietHoursEnd) && input.quietHoursEnd) {
    next = movePastQuietHours(next, tz, input.quietHoursEnd);
  }
  return next;
}

export interface MoodReminderDueInput {
  /**
   * Scheduling anchor: the last saved check-in, or — when the user has never
   * checked in — the time they enabled reminders (their subscription/registration
   * time). A null anchor means "nothing is due yet".
   */
  anchorAt: Date | string | number | null | undefined;
  now: Date | string | number;
  intervalHours?: number;
  timezone?: string;
  quietHoursStart?: string | null;
  quietHoursEnd?: string | null;
  /** When a reminder was last actually delivered (used to dedupe per slot). */
  lastNotifiedAt?: Date | string | number | null;
}

/**
 * The reminder that is due *right now* (already elapsed and not yet delivered),
 * or null when nothing is due. This is the server-scheduler counterpart of
 * `computeNextMoodReminder`: it takes the most recent elapsed interval slot, so
 * any number of missed slots collapse into a single due reminder (no burst),
 * skips quiet hours, and never returns the same slot twice once `lastNotifiedAt`
 * covers it.
 */
export function computeMoodReminderDue(input: MoodReminderDueInput): Date | null {
  if (input.anchorAt == null) return null;
  const anchor = toDate(input.anchorAt);
  if (Number.isNaN(anchor.getTime())) return null;
  const now = toDate(input.now);
  const intervalHours = input.intervalHours && input.intervalHours > 0 ? input.intervalHours : MOOD_CHECKIN_INTERVAL_HOURS;
  const stepMs = intervalHours * HOUR_MS;

  const anchorMs = Math.min(anchor.getTime(), now.getTime());
  if (now.getTime() < anchorMs + stepMs) return null; // first interval has not elapsed

  const slots = Math.floor((now.getTime() - anchorMs) / stepMs);
  let candidate = new Date(anchorMs + slots * stepMs);

  const tz = input.timezone || "UTC";
  if (isInQuietHours(candidate, tz, input.quietHoursStart, input.quietHoursEnd) && input.quietHoursEnd) {
    candidate = movePastQuietHours(candidate, tz, input.quietHoursEnd);
  }
  if (candidate.getTime() > now.getTime()) return null; // moved into the future by quiet hours

  const lastNotified = input.lastNotifiedAt != null ? toDate(input.lastNotifiedAt).getTime() : Number.NEGATIVE_INFINITY;
  if (lastNotified >= candidate.getTime()) return null; // this slot was already delivered
  return candidate;
}

/** True while a check-in has already been saved inside the current window. */
export function hasCheckedInWithin(
  lastCheckInAt: Date | string | number | null | undefined,
  now: Date | string | number,
  intervalHours = MOOD_CHECKIN_INTERVAL_HOURS,
): boolean {
  if (lastCheckInAt == null) return false;
  const last = toDate(lastCheckInAt).getTime();
  const reference = toDate(now).getTime();
  return reference - last < intervalHours * HOUR_MS;
}

export interface ScheduleGuard {
  /** The mood reminder category is switched on. */
  enabled: boolean;
  /** Browser/OS notification permission state. */
  permission: "granted" | "denied" | "default" | "unsupported";
  nextReminderAt: Date | null;
  now: Date | string | number;
}

/**
 * Whether a reminder should actually be scheduled/fired. Keeps "permission
 * denied / platform unsupported" from silently looking like success.
 */
export function shouldScheduleMoodReminder(guard: ScheduleGuard): boolean {
  if (!guard.enabled) return false;
  if (guard.permission !== "granted") return false;
  if (!guard.nextReminderAt) return false;
  return toDate(guard.nextReminderAt).getTime() <= toDate(guard.now).getTime();
}
