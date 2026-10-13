import { test } from "node:test";
import assert from "node:assert/strict";
import { computeMoodReminderDue } from "../shared/mood-reminder";

const iso = (d: Date) => d.toISOString();

test("nothing is due before the first interval elapses", () => {
  const anchor = new Date("2026-01-15T09:00:00.000Z");
  const now = new Date("2026-01-15T11:59:00.000Z");
  assert.equal(computeMoodReminderDue({ anchorAt: anchor, now, timezone: "UTC" }), null);
});

test("a null anchor means nothing is due yet", () => {
  const now = new Date("2026-01-15T19:00:00.000Z");
  assert.equal(computeMoodReminderDue({ anchorAt: null, now, timezone: "UTC" }), null);
  assert.equal(computeMoodReminderDue({ anchorAt: undefined, now, timezone: "UTC" }), null);
});

test("the due reminder is the most recent elapsed slot", () => {
  const anchor = new Date("2026-01-15T09:00:00.000Z");
  const now = new Date("2026-01-15T12:00:00.000Z");
  const due = computeMoodReminderDue({ anchorAt: anchor, now, timezone: "UTC" });
  assert.ok(due);
  assert.equal(iso(due as Date), "2026-01-15T12:00:00.000Z");
});

test("many missed slots collapse into exactly one due reminder (no burst)", () => {
  const anchor = new Date("2026-01-15T09:00:00.000Z");
  const now = new Date("2026-01-15T19:30:00.000Z");
  const due = computeMoodReminderDue({ anchorAt: anchor, now, timezone: "UTC" });
  assert.ok(due);
  // 09:00 + 3*3h = 18:00 (the latest elapsed slot before 19:30).
  assert.equal(iso(due as Date), "2026-01-15T18:00:00.000Z");
});

test("a reminder already delivered for the slot is not offered again (dedupe)", () => {
  const anchor = new Date("2026-01-15T09:00:00.000Z");
  const now = new Date("2026-01-15T19:30:00.000Z");
  const due = computeMoodReminderDue({
    anchorAt: anchor,
    now,
    timezone: "UTC",
    lastNotifiedAt: new Date("2026-01-15T18:00:00.000Z"),
  });
  assert.equal(due, null);
});

test("advancing to the next slot after a notification is offered once", () => {
  const anchor = new Date("2026-01-15T09:00:00.000Z");
  const now = new Date("2026-01-15T21:10:00.000Z");
  const due = computeMoodReminderDue({
    anchorAt: anchor,
    now,
    timezone: "UTC",
    lastNotifiedAt: new Date("2026-01-15T18:00:00.000Z"),
  });
  assert.ok(due);
  assert.equal(iso(due as Date), "2026-01-15T21:00:00.000Z");
});

test("a slot inside quiet hours is deferred, and suppressed while still in the future", () => {
  const anchor = new Date("2026-01-15T10:00:00.000Z");
  const now = new Date("2026-01-15T22:30:00.000Z"); // slot 22:00 is inside 22:00-07:00
  const due = computeMoodReminderDue({
    anchorAt: anchor,
    now,
    timezone: "UTC",
    quietHoursStart: "22:00",
    quietHoursEnd: "07:00",
  });
  assert.equal(due, null);
});

test("after quiet hours end the deferred reminder becomes due", () => {
  const anchor = new Date("2026-01-15T08:00:00.000Z");
  const now = new Date("2026-01-16T07:30:00.000Z"); // slot 2026-01-16T05:00 inside quiet hours
  const due = computeMoodReminderDue({
    anchorAt: anchor,
    now,
    timezone: "UTC",
    quietHoursStart: "22:00",
    quietHoursEnd: "07:00",
  });
  assert.ok(due);
  assert.equal(iso(due as Date), "2026-01-16T07:00:00.000Z");
});

test("quiet hours are evaluated in the user's timezone", () => {
  const anchor = new Date("2026-01-15T18:00:00.000Z");
  const now = new Date("2026-01-15T21:30:00.000Z");
  // In UTC the 21:00 slot is fine; in Asia/Kolkata that instant is 02:30 local (quiet).
  const utc = computeMoodReminderDue({
    anchorAt: anchor,
    now,
    timezone: "UTC",
    quietHoursStart: "22:00",
    quietHoursEnd: "07:00",
  });
  assert.ok(utc);
  const kolkata = computeMoodReminderDue({
    anchorAt: anchor,
    now,
    timezone: "Asia/Kolkata",
    quietHoursStart: "22:00",
    quietHoursEnd: "07:00",
  });
  assert.equal(kolkata, null);
});

test("a custom interval is honoured", () => {
  const anchor = new Date("2026-01-15T09:00:00.000Z");
  const due = computeMoodReminderDue({
    anchorAt: anchor,
    now: new Date("2026-01-15T12:30:00.000Z"),
    intervalHours: 6,
    timezone: "UTC",
  });
  assert.equal(due, null, "6-hour interval has not elapsed at +3.5h");
  const due2 = computeMoodReminderDue({
    anchorAt: anchor,
    now: new Date("2026-01-15T15:05:00.000Z"),
    intervalHours: 6,
    timezone: "UTC",
  });
  assert.ok(due2);
  assert.equal(iso(due2 as Date), "2026-01-15T15:00:00.000Z");
});
