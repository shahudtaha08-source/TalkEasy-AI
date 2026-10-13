import { test } from "node:test";
import assert from "node:assert/strict";
import {
  MOOD_CHECKIN_INTERVAL_HOURS,
  computeNextMoodReminder,
  hasCheckedInWithin,
  isInQuietHours,
  localMinutesOfDay,
  shouldScheduleMoodReminder,
} from "../shared/mood-reminder";

const HOUR = 3_600_000;

test("the mood reminder interval is three hours", () => {
  assert.equal(MOOD_CHECKIN_INTERVAL_HOURS, 3);
});

test("next reminder is one interval after the last saved check-in", () => {
  const last = new Date("2026-01-15T09:00:00.000Z");
  const now = new Date("2026-01-15T10:00:00.000Z");
  const next = computeNextMoodReminder({ lastCheckInAt: last, now, timezone: "UTC" });
  assert.equal(next.toISOString(), "2026-01-15T12:00:00.000Z");
});

test("without any saved check-in the interval starts from now (no fabricated entry)", () => {
  const now = new Date("2026-01-15T10:00:00.000Z");
  const next = computeNextMoodReminder({ lastCheckInAt: null, now, timezone: "UTC" });
  assert.equal(next.getTime(), now.getTime() + MOOD_CHECKIN_INTERVAL_HOURS * HOUR);
});

test("a device reconnecting after a long gap gets exactly one future reminder (no burst)", () => {
  const last = new Date("2026-01-15T09:00:00.000Z");
  const now = new Date("2026-01-15T19:30:00.000Z"); // ~3.5 intervals later
  const next = computeNextMoodReminder({ lastCheckInAt: last, now, timezone: "UTC" });
  assert.ok(next.getTime() > now.getTime(), "next must be in the future");
  assert.ok(next.getTime() - now.getTime() <= MOOD_CHECKIN_INTERVAL_HOURS * HOUR, "next is the first slot, not a backlog");
  // 09:00 + k*3h strictly after 19:30 is 21:00.
  assert.equal(next.toISOString(), "2026-01-15T21:00:00.000Z");
});

test("a reminder landing in quiet hours is deferred to quiet-hours end", () => {
  const last = new Date("2026-01-15T20:00:00.000Z"); // +3h = 23:00, inside 22:00-07:00
  const now = new Date("2026-01-15T20:00:00.000Z");
  const next = computeNextMoodReminder({
    lastCheckInAt: last,
    now,
    timezone: "UTC",
    quietHoursStart: "22:00",
    quietHoursEnd: "07:00",
  });
  assert.equal(next.toISOString(), "2026-01-16T07:00:00.000Z");
});

test("isInQuietHours handles the wrap-around window and exclusive end", () => {
  const at = (hhmm: string) => new Date(`2026-01-15T${hhmm}:00.000Z`);
  assert.equal(isInQuietHours(at("23:30"), "UTC", "22:00", "07:00"), true);
  assert.equal(isInQuietHours(at("06:00"), "UTC", "22:00", "07:00"), true);
  assert.equal(isInQuietHours(at("12:00"), "UTC", "22:00", "07:00"), false);
  assert.equal(isInQuietHours(at("22:00"), "UTC", "22:00", "07:00"), true);
  assert.equal(isInQuietHours(at("07:00"), "UTC", "22:00", "07:00"), false);
});

test("equal or missing quiet-hour bounds mean no quiet hours", () => {
  const at = new Date("2026-01-15T23:30:00.000Z");
  assert.equal(isInQuietHours(at, "UTC", "22:00", "22:00"), false);
  assert.equal(isInQuietHours(at, "UTC", null, null), false);
});

test("quiet hours are evaluated in the user's timezone", () => {
  // 18:00 UTC is 23:30 in Asia/Kolkata (+05:30) — inside 22:00-07:00 local.
  const instant = new Date("2026-01-15T18:00:00.000Z");
  assert.equal(localMinutesOfDay(instant, "Asia/Kolkata"), 23 * 60 + 30);
  assert.equal(isInQuietHours(instant, "Asia/Kolkata", "22:00", "07:00"), true);
  assert.equal(isInQuietHours(instant, "UTC", "22:00", "07:00"), false);
});

test("hasCheckedInWithin is true only while inside the current window", () => {
  const now = new Date("2026-01-15T12:00:00.000Z");
  assert.equal(hasCheckedInWithin(new Date("2026-01-15T10:00:00.000Z"), now), true);
  assert.equal(hasCheckedInWithin(new Date("2026-01-15T08:00:00.000Z"), now), false);
  assert.equal(hasCheckedInWithin(null, now), false);
});

test("shouldScheduleMoodReminder never looks like success when blocked", () => {
  const now = new Date("2026-01-15T12:00:00.000Z");
  const due = new Date("2026-01-15T11:59:00.000Z");
  const future = new Date("2026-01-15T13:00:00.000Z");
  assert.equal(shouldScheduleMoodReminder({ enabled: true, permission: "granted", nextReminderAt: due, now }), true);
  assert.equal(shouldScheduleMoodReminder({ enabled: false, permission: "granted", nextReminderAt: due, now }), false);
  assert.equal(shouldScheduleMoodReminder({ enabled: true, permission: "denied", nextReminderAt: due, now }), false);
  assert.equal(shouldScheduleMoodReminder({ enabled: true, permission: "unsupported", nextReminderAt: due, now }), false);
  assert.equal(shouldScheduleMoodReminder({ enabled: true, permission: "granted", nextReminderAt: future, now }), false);
  assert.equal(shouldScheduleMoodReminder({ enabled: true, permission: "granted", nextReminderAt: null, now }), false);
});
