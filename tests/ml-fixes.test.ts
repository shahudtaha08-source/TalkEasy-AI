import { test } from "node:test";
import assert from "node:assert/strict";
import { buildDailyFeatures, type RawWellnessData } from "../server/ml/feature-engineering";
import { silhouetteScore } from "../server/ml/clustering";

const today = new Date();
const dateAt = (back: number): string => new Date(today.getTime() - back * 86400000).toISOString().slice(0, 10);

function emptyRaw(): RawWellnessData {
  return { health: [], moods: [], stresses: [], waters: [], sleeps: [], habits: [] };
}

test("demo/simulated steps are excluded from ML features (no fabricated activity)", () => {
  const raw = emptyRaw();
  raw.health.push({ date: dateAt(0), steps: 9000, isDemo: true, mood: "Happy", moodIntensity: 7 });
  const features = buildDailyFeatures(raw, 90);
  assert.equal(features.length, 1);
  assert.equal(features[0].steps, undefined, "demo steps must not become an active-signal feature");
  assert.ok(typeof features[0].mood === "number", "genuine user mood is still used");
});

test("genuine (non-demo) steps are retained", () => {
  const raw = emptyRaw();
  raw.health.push({ date: dateAt(0), steps: 8000, isDemo: false, mood: "Happy", moodIntensity: 7 });
  const features = buildDailyFeatures(raw, 90);
  assert.equal(features[0].steps, 8000);
});

test("an explicit habit completionPercentage is preserved, not coerced to 100", () => {
  const raw = emptyRaw();
  raw.habits.push({ date: dateAt(0), completed: true, completionPercentage: 44 });
  const features = buildDailyFeatures(raw, 90);
  assert.equal(features[0].habits, 44);
});

test("habit with no percentage falls back to the boolean", () => {
  const raw = emptyRaw();
  raw.habits.push({ date: dateAt(1), completed: true, completionPercentage: null });
  const features = buildDailyFeatures(raw, 90);
  assert.equal(features[0].habits, 100);
});

test("silhouette excludes singleton clusters from the mean", () => {
  // clusters: {0: [p0,p1]}, {1: [p2]}, {2: [p3]}  -> p2/p3 are singletons.
  const points = [[0], [0.1], [5], [10]];
  const assignment = [0, 0, 1, 2];
  const score = silhouetteScore(points, assignment, 3);
  // Correct mean is over the two non-singleton points (~0.9798); the previous
  // bug divided by n=4, halving it to ~0.49.
  assert.ok(score > 0.9, `expected > 0.9, got ${score}`);
  assert.ok(Math.abs(score - 0.9798) < 0.01, `expected ~0.9798, got ${score}`);
});

test("silhouette returns 0 when every point is a singleton", () => {
  const score = silhouetteScore([[0], [5], [10]], [0, 1, 2], 3);
  assert.equal(score, 0);
});
