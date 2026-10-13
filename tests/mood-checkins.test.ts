import { test } from "node:test";
import assert from "node:assert/strict";
import {
  dayKeyOf,
  groupCheckInsByDay,
  latestCheckInAt,
  summarizeCheckInDay,
  summarizeCheckInsByDay,
  totalCheckIns,
  type MoodCheckInRow,
} from "../shared/mood-checkins";

test("dayKeyOf normalises dates, timestamps and Date objects", () => {
  assert.equal(dayKeyOf("2026-01-15"), "2026-01-15");
  assert.equal(dayKeyOf("2026-01-15T23:30:00.000Z"), "2026-01-15");
  assert.equal(dayKeyOf(new Date("2026-01-15T05:00:00.000Z")), "2026-01-15");
});

test("several check-ins on one day are grouped together", () => {
  const rows: MoodCheckInRow[] = [
    { date: "2026-01-15", mood: "Happy", createdAt: "2026-01-15T08:00:00Z" },
    { date: "2026-01-15", mood: "Neutral", createdAt: "2026-01-15T13:00:00Z" },
    { date: "2026-01-15", mood: "Happy", createdAt: "2026-01-15T18:00:00Z" },
    { date: "2026-01-16", mood: "Sad", createdAt: "2026-01-16T09:00:00Z" },
  ];
  const grouped = groupCheckInsByDay(rows);
  assert.equal(grouped.size, 2);
  assert.equal(grouped.get("2026-01-15")!.length, 3);
  assert.equal(grouped.get("2026-01-16")!.length, 1);
});

test("each check-in is counted exactly once — no double counting", () => {
  const rows: MoodCheckInRow[] = [
    { date: "2026-01-15", mood: "Happy", createdAt: "2026-01-15T08:00:00Z" },
    { date: "2026-01-15", mood: "Happy", createdAt: "2026-01-15T12:00:00Z" },
  ];
  const totals = totalCheckIns(rows);
  assert.equal(totals.totalCheckIns, 2, "two saved check-ins count as two");
  assert.equal(totals.daysWithCheckIns, 1, "but only one calendar day");
});

test("a day summary aggregates intensity, dominant mood and shares", () => {
  const rows: MoodCheckInRow[] = [
    { date: "2026-01-15", mood: "Happy", intensity: 8, createdAt: "2026-01-15T08:00:00Z" },
    { date: "2026-01-15", mood: "Happy", intensity: 6, createdAt: "2026-01-15T13:00:00Z" },
    { date: "2026-01-15", mood: "Sad", intensity: 2, createdAt: "2026-01-15T18:00:00Z" },
  ];
  const summary = summarizeCheckInDay("2026-01-15", rows);
  assert.equal(summary.count, 3);
  assert.equal(summary.dominantMood, "Happy");
  assert.equal(summary.avgIntensity, 5.3);
  assert.equal(summary.positiveShare, 2 / 3);
  assert.equal(summary.negativeShare, 1 / 3);
  assert.equal(summary.firstAt!.toISOString(), "2026-01-15T08:00:00.000Z");
  assert.equal(summary.lastAt!.toISOString(), "2026-01-15T18:00:00.000Z");
});

test("a day with no numeric intensity leaves avgIntensity null rather than 0", () => {
  const summary = summarizeCheckInDay("2026-01-15", [
    { date: "2026-01-15", mood: "Neutral", createdAt: "2026-01-15T08:00:00Z" },
  ]);
  assert.equal(summary.avgIntensity, null);
});

test("summarizeCheckInsByDay returns one entry per day, sorted by date", () => {
  const rows: MoodCheckInRow[] = [
    { date: "2026-01-16", mood: "Sad", createdAt: "2026-01-16T09:00:00Z" },
    { date: "2026-01-15", mood: "Happy", createdAt: "2026-01-15T09:00:00Z" },
    { date: "2026-01-15", mood: "Happy", createdAt: "2026-01-15T15:00:00Z" },
  ];
  const summaries = summarizeCheckInsByDay(rows);
  assert.deepEqual(summaries.map((s) => s.date), ["2026-01-15", "2026-01-16"]);
  assert.equal(summaries[0].count, 2);
  assert.equal(summaries[1].count, 1);
});

test("latestCheckInAt picks the newest absolute timestamp", () => {
  const rows: MoodCheckInRow[] = [
    { date: "2026-01-15", mood: "Happy", createdAt: "2026-01-15T08:00:00Z" },
    { date: "2026-01-15", mood: "Neutral", createdAt: "2026-01-15T20:00:00Z" },
    { date: "2026-01-14", mood: "Sad", createdAt: "2026-01-14T22:00:00Z" },
  ];
  assert.equal(latestCheckInAt(rows)!.toISOString(), "2026-01-15T20:00:00.000Z");
  assert.equal(latestCheckInAt([]), null);
});
