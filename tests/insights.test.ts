import { test } from "node:test";
import assert from "node:assert/strict";
import {
  aggregateWellnessInsights,
  aggregateWearableInsights,
  getPeriodRange,
  buildFallbackSummary,
} from "../shared/insights";

const NOW = new Date("2026-01-10T12:00:00.000Z");

test("getPeriodRange returns local dates for the requested window", () => {
  const weekly = getPeriodRange("weekly", NOW, 0);
  assert.equal(weekly.end, "2026-01-10");
  assert.equal(weekly.start, "2026-01-04");
  assert.equal(weekly.days, 7);
  assert.equal(weekly.dates.length, 7);

  const daily = getPeriodRange("daily", NOW, 0);
  assert.deepEqual(daily.dates, ["2026-01-10"]);

  const ninety = getPeriodRange("90day", NOW, 0);
  assert.equal(ninety.days, 90);
  assert.equal(ninety.start, "2025-10-13");
});

test("getPeriodRange respects a positive timezone offset (IST)", () => {
  // 2026-01-10T20:00Z is already 2026-01-11 in IST (+330).
  const range = getPeriodRange("daily", new Date("2026-01-10T20:00:00.000Z"), 330);
  assert.equal(range.end, "2026-01-11");
});

test("habit completionPercentage of 44 is preserved, not coerced to 0 or 100", () => {
  const bundle = aggregateWellnessInsights(
    {
      habits: [
        { date: "2026-01-10", type: "Meditation", completed: false, completionPercentage: 44 },
      ],
    },
    "daily",
    NOW,
    0,
  );
  const habits = bundle.metrics.find((m) => m.key === "habits");
  assert.ok(habits);
  assert.equal(habits!.value, 44);
  assert.equal(habits!.unit, "%");
  assert.equal(habits!.sampleCount, 1);
  assert.equal(bundle.insufficientData, false);
});

test("wellness bundle never contains wearable/device metrics", () => {
  const bundle = aggregateWellnessInsights(
    { moods: [{ date: "2026-01-10", mood: "Calm", intensity: 7 }] },
    "daily",
    NOW,
    0,
  );
  const wearableKeys = ["heart_rate", "spo2", "steps", "blood_pressure", "ecg", "sleep_duration"];
  for (const key of wearableKeys) {
    assert.equal(bundle.metrics.find((m) => m.key === key), undefined, `wellness must not expose ${key}`);
  }
  assert.equal(bundle.source, "wellness");
});

test("wearable bundle only uses device rows and exposes no mood/habit metrics", () => {
  const bundle = aggregateWearableInsights(
    {
      measurements: [
        { date: "2026-01-10", metric: "heart_rate", value: 72, unit: "bpm", source: "manual_import", isDemo: false },
        { date: "2026-01-10", metric: "steps", value: 8000, unit: "steps", source: "manual_import", isDemo: false },
      ],
    },
    "daily",
    NOW,
    0,
  );
  assert.equal(bundle.source, "wearable");
  assert.ok(bundle.metrics.find((m) => m.key === "heart_rate"));
  assert.ok(bundle.metrics.find((m) => m.key === "steps"));
  assert.equal(bundle.metrics.find((m) => m.key === "mood"), undefined);
  assert.equal(bundle.metrics.find((m) => m.key === "habits"), undefined);
});

test("wearable bundle flags demo-only data and cannot masquerade as real", () => {
  const bundle = aggregateWearableInsights(
    {
      measurements: [
        { date: "2026-01-10", metric: "heart_rate", value: 72, unit: "bpm", source: "demo", isDemo: true },
      ],
    },
    "daily",
    NOW,
    0,
  );
  assert.equal(bundle.isDemoData, true);
  assert.ok(bundle.highlights.some((h) => h.id === "wearable-demo"));
});

test("30-day and 90-day enforce increased minimum-data requirements", () => {
  const oneDay = { moods: [{ date: "2026-01-10", mood: "Calm", intensity: 5 }] };
  const thirty = aggregateWellnessInsights(oneDay, "30day", NOW, 0);
  assert.equal(thirty.insufficientData, true);
  assert.match(thirty.insufficientReason || "", /at least 3/);

  const ninety = aggregateWellnessInsights(oneDay, "90day", NOW, 0);
  assert.equal(ninety.insufficientData, true);
  assert.match(ninety.insufficientReason || "", /at least 7/);

  // daily is satisfied by a single day.
  const daily = aggregateWellnessInsights(oneDay, "daily", NOW, 0);
  assert.equal(daily.insufficientData, false);
});

test("fallback summary is deterministic and never empty when data exists", () => {
  const bundle = aggregateWearableInsights(
    { measurements: [{ date: "2026-01-10", metric: "heart_rate", value: 70, unit: "bpm", source: "manual_import" }] },
    "daily",
    NOW,
    0,
  );
  const summary = buildFallbackSummary(bundle);
  assert.match(summary, /Heart rate/);
});

test("a mirrored mood check-in is not double-counted across the two mood tables", () => {
  // POST /api/moods writes both `moods` and `mood_entries` for the same event,
  // so understanding them as two events would double the sample count.
  const bundle = aggregateWellnessInsights(
    {
      moods: [{ date: "2026-01-10", mood: "Calm", intensity: 6 }],
      moodEntries: [{ date: "2026-01-10", mood: "Calm", intensity: 6 }],
    },
    "daily",
    NOW,
    0,
  );
  const mood = bundle.metrics.find((m) => m.key === "mood");
  assert.ok(mood);
  assert.equal(mood!.sampleCount, 1);
});

test("several check-ins on the same day are each counted once (not deduped)", () => {
  const bundle = aggregateWellnessInsights(
    {
      moodEntries: [
        { date: "2026-01-10", mood: "Calm", intensity: 6 },
        { date: "2026-01-10", mood: "Happy", intensity: 8 },
        { date: "2026-01-10", mood: "Tired", intensity: 3 },
      ],
    },
    "daily",
    NOW,
    0,
  );
  const mood = bundle.metrics.find((m) => m.key === "mood");
  assert.ok(mood);
  assert.equal(mood!.sampleCount, 3);
});

test("legacy moods are used only when there are no structured entries", () => {
  const bundle = aggregateWellnessInsights(
    {
      moods: [
        { date: "2026-01-10", mood: "Calm", intensity: 6 },
        { date: "2026-01-10", mood: "Happy", intensity: 9 },
      ],
    },
    "daily",
    NOW,
    0,
  );
  const mood = bundle.metrics.find((m) => m.key === "mood");
  assert.ok(mood);
  assert.equal(mood!.sampleCount, 2);
});
