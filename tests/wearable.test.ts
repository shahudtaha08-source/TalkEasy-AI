import { test } from "node:test";
import assert from "node:assert/strict";
import {
  validateWearableMeasurement,
  isKnownMetric,
  isKnownSource,
  WEARABLE_PROVIDERS,
} from "../shared/wearable";

test("valid heart-rate reading is accepted and normalised", () => {
  const r = validateWearableMeasurement({
    metric: "heart_rate",
    value: 72,
    source: "manual_import",
    recordedAt: "2026-01-10T08:00:00.000Z",
  });
  assert.equal(r.ok, true);
  if (r.ok) {
    assert.equal(r.value.metric, "heart_rate");
    assert.equal(r.value.value, 72);
    assert.equal(r.value.unit, "bpm");
    assert.equal(r.value.date, "2026-01-10");
    assert.equal(r.value.isDemo, false);
  }
});

test("unknown metric is rejected", () => {
  const r = validateWearableMeasurement({ metric: "aura", value: 1, source: "manual_import" });
  assert.equal(r.ok, false);
});

test("unknown source is rejected", () => {
  const r = validateWearableMeasurement({ metric: "steps", value: 100, source: "hacked_feed" });
  assert.equal(r.ok, false);
});

test("out-of-range SpO2 is rejected", () => {
  assert.equal(validateWearableMeasurement({ metric: "spo2", value: 150, source: "manual_import" }).ok, false);
  assert.equal(validateWearableMeasurement({ metric: "spo2", value: 98, source: "manual_import" }).ok, true);
});

test("non-numeric value is rejected, null value is allowed", () => {
  assert.equal(validateWearableMeasurement({ metric: "steps", value: "many", source: "manual_import" }).ok, false);
  assert.equal(validateWearableMeasurement({ metric: "steps", value: null, source: "manual_import" }).ok, true);
});

test("demo flag is only true when explicitly set to boolean true", () => {
  const r = validateWearableMeasurement({ metric: "steps", value: 10, source: "manual_import", isDemo: "yes" });
  assert.equal(r.ok, true);
  if (r.ok) assert.equal(r.value.isDemo, false);
});

test("metric/source registries behave", () => {
  assert.equal(isKnownMetric("heart_rate"), true);
  assert.equal(isKnownMetric("nope"), false);
  assert.equal(isKnownSource("demo"), true);
  assert.ok(WEARABLE_PROVIDERS.some((p) => p.id === "manual_import" && p.status === "available"));
});
