import { test } from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_WEIGHT_KG,
  DEFERRED_WORKOUT_SOURCES,
  EXERCISE_ACTIVITIES,
  RepCounter,
  activityById,
  estimateCalories,
  summarizeWorkouts,
  validateWorkoutSession,
} from "../shared/exercise";

/* ── catalogue ─────────────────────────────────────────────────────────────── */

test("catalogue has categories across the registry and resolves by id", () => {
  assert.ok(EXERCISE_ACTIVITIES.length >= 15);
  const run = activityById("running");
  assert.equal(run?.category, "cardio");
  assert.equal(run?.supportsGps, true);
  assert.equal(activityById("nope"), undefined);
});

test("camera source is declared deferred (never silently supported)", () => {
  assert.deepEqual([...DEFERRED_WORKOUT_SOURCES], ["camera"]);
});

/* ── calorie estimate (deterministic, labelled) ─────────────────────────────── */

test("calorie estimate uses MET formula and flags assumed weight", () => {
  // running MET 9.8, 10 minutes, 70kg default:
  // 9.8 * 3.5 * 70 / 200 * 10 = 120.05 -> 120
  const est = estimateCalories({ activityId: "running", durationSeconds: 600 });
  assert.ok(est);
  assert.equal(est!.kcal, 120);
  assert.equal(est!.weightKg, DEFAULT_WEIGHT_KG);
  assert.equal(est!.weightAssumed, true);
  assert.equal(est!.method, "met");
});

test("calorie estimate uses supplied weight and does not assume one", () => {
  const est = estimateCalories({ activityId: "running", durationSeconds: 600, weightKg: 50 });
  assert.ok(est);
  assert.equal(est!.weightAssumed, false);
  assert.equal(est!.weightKg, 50);
  assert.ok(est!.kcal < 120);
});

test("calorie estimate returns null for unknown activity or bad duration", () => {
  assert.equal(estimateCalories({ activityId: "teleporting", durationSeconds: 60 }), null);
  assert.equal(estimateCalories({ activityId: "running", durationSeconds: 0 }), null);
  assert.equal(estimateCalories({ activityId: "running", durationSeconds: -5 }), null);
});

/* ── rep counter state machine ──────────────────────────────────────────────── */

test("rep counter counts only full extended→flexed→extended cycles", () => {
  const c = new RepCounter();
  assert.equal(c.ingest({ angle: 170, atMs: 0 }).counted, false); // still extended
  assert.equal(c.ingest({ angle: 60, atMs: 500 }).counted, false); // went flexed
  const done = c.ingest({ angle: 165, atMs: 1000 }); // returned extended -> rep
  assert.equal(done.counted, true);
  assert.equal(done.reps, 1);
  assert.equal(c.count, 1);
});

test("rep counter rejects duplicate / out-of-order frames", () => {
  const c = new RepCounter();
  c.ingest({ angle: 60, atMs: 1000 });
  const dup = c.ingest({ angle: 170, atMs: 1000 });
  assert.equal(dup.duplicate, true);
  assert.equal(dup.counted, false);
  const back = c.ingest({ angle: 170, atMs: 900 });
  assert.equal(back.duplicate, true);
});

test("rep counter treats an unreadable frame as uncertain, not a rep", () => {
  const c = new RepCounter();
  c.ingest({ angle: 60, atMs: 100 });
  const r = c.ingest({ angle: null, atMs: 400 });
  assert.equal(r.uncertain, true);
  assert.equal(r.counted, false);
  assert.equal(c.count, 0);
});

test("rep counter rejects implausibly fast cycles (jitter protection)", () => {
  const c = new RepCounter({ minRepMs: 1000 });
  c.ingest({ angle: 60, atMs: 100 });
  const fast = c.ingest({ angle: 170, atMs: 300 });
  assert.equal(fast.counted, false);
  assert.equal(fast.rejectedFast, true);
  // a genuine later cycle still counts
  c.ingest({ angle: 60, atMs: 1500 });
  const ok = c.ingest({ angle: 170, atMs: 2500 });
  assert.equal(ok.counted, true);
  assert.equal(c.count, 1);
});

test("rep counter reset clears state", () => {
  const c = new RepCounter();
  c.ingest({ angle: 60, atMs: 0 });
  c.ingest({ angle: 170, atMs: 500 });
  assert.equal(c.count, 1);
  c.reset();
  assert.equal(c.count, 0);
  assert.equal(c.currentPhase, "extended");
});

/* ── session validation ─────────────────────────────────────────────────────── */

const NOW = new Date("2026-06-01T12:00:00.000Z");

function validSession(overrides: Record<string, unknown> = {}) {
  return {
    activityId: "running",
    category: "cardio",
    source: "gps",
    startedAt: "2026-06-01T11:00:00.000Z",
    durationSeconds: 1800,
    distanceMeters: 5000,
    ...overrides,
  };
}

test("a well-formed session validates and gets a canonical calorie estimate", () => {
  const r = validateWorkoutSession(validSession(), NOW);
  assert.equal(r.ok, true);
  if (r.ok) {
    assert.equal(r.value.category, "cardio");
    assert.equal(r.value.source, "gps");
    assert.equal(r.value.caloriesEstimated, true);
    assert.ok(r.value.caloriesKcal > 0);
  }
});

test("unknown activity and category mismatch are rejected", () => {
  assert.equal(validateWorkoutSession(validSession({ activityId: "moonwalk" }), NOW).ok, false);
  assert.equal(validateWorkoutSession(validSession({ category: "strength" }), NOW).ok, false);
});

test("camera source is rejected with a clear deferred message", () => {
  const r = validateWorkoutSession(validSession({ source: "camera" }), NOW);
  assert.equal(r.ok, false);
  if (!r.ok) assert.match(r.error, /not part of this release/i);
});

test("unknown source is rejected", () => {
  assert.equal(validateWorkoutSession(validSession({ source: "telepathy" }), NOW).ok, false);
});

test("non-finite / non-positive / future / oversized values are rejected", () => {
  assert.equal(validateWorkoutSession(validSession({ durationSeconds: Number.NaN }), NOW).ok, false);
  assert.equal(validateWorkoutSession(validSession({ durationSeconds: 0 }), NOW).ok, false);
  assert.equal(validateWorkoutSession(validSession({ durationSeconds: 90000 }), NOW).ok, false);
  assert.equal(validateWorkoutSession(validSession({ startedAt: "2026-06-02T00:00:00.000Z" }), NOW).ok, false);
  assert.equal(validateWorkoutSession(validSession({ startedAt: "not-a-date" }), NOW).ok, false);
  assert.equal(validateWorkoutSession(validSession({ repetitions: 1.5 }), NOW).ok, false);
  assert.equal(validateWorkoutSession(validSession({ sets: 0 }), NOW).ok, false);
  assert.equal(validateWorkoutSession(validSession({ weightKg: 5 }), NOW).ok, false);
  assert.equal(validateWorkoutSession(validSession({ distanceMeters: -1 }), NOW).ok, false);
  assert.equal(validateWorkoutSession(validSession({ notes: "x".repeat(2001) }), NOW).ok, false);
});

test("absent optional metrics stay null, never coerced to 0", () => {
  const r = validateWorkoutSession(
    { activityId: "yoga", category: "mind_body", source: "manual", startedAt: "2026-06-01T11:00:00.000Z", durationSeconds: 300 },
    NOW,
  );
  assert.equal(r.ok, true);
  if (r.ok) {
    assert.equal(r.value.repetitions, null);
    assert.equal(r.value.distanceMeters, null);
    assert.equal(r.value.weightKg, null);
  }
});

/* ── summary (missing data stays missing) ───────────────────────────────────── */

test("summary aggregates and leaves calories null when none recorded", () => {
  const s = summarizeWorkouts([
    { category: "cardio", durationSeconds: 600, caloriesKcal: 100, distanceMeters: 1000, repetitions: null },
    { category: "cardio", durationSeconds: 300, caloriesKcal: 50, distanceMeters: null, repetitions: null },
    { category: "strength", durationSeconds: 120, repetitions: 30, caloriesKcal: null, distanceMeters: null },
  ]);
  assert.equal(s.sessions, 3);
  assert.equal(s.totalDurationSeconds, 1020);
  assert.equal(s.totalCaloriesKcal, 150);
  assert.equal(s.totalRepetitions, 30);
  assert.equal(s.totalDistanceMeters, 1000);
  assert.deepEqual(s.byCategory, { cardio: 2, strength: 1 });

  const none = summarizeWorkouts([{ category: "mobility", durationSeconds: 60 }]);
  assert.equal(none.totalCaloriesKcal, null);
});
