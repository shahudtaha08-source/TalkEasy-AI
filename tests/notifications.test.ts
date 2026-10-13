import { test } from "node:test";
import assert from "node:assert/strict";
import {
  defaultNotificationPreferences,
  defaultCategoriesMap,
  mergeNotificationPreferences,
  normalizeTime,
  categoriesForSource,
  DEFAULT_NOTIFICATION_CATEGORIES,
} from "../shared/notifications";

test("every default category is bound to exactly one source", () => {
  for (const c of DEFAULT_NOTIFICATION_CATEGORIES) {
    assert.ok(c.source === "wellness" || c.source === "wearable", `${c.key} has unknown source`);
  }
});

test("wellness and wearable categories are fully separated", () => {
  const prefs = defaultNotificationPreferences();
  const wellness = categoriesForSource(prefs, "wellness");
  const wearable = categoriesForSource(prefs, "wearable");
  assert.ok(wellness.length > 0);
  assert.ok(wearable.length > 0);
  assert.equal(
    wellness.length + wearable.length,
    Object.keys(prefs.categories).length,
  );
  for (const c of wearable) assert.equal(c.source, "wearable");
  for (const c of wellness) assert.equal(c.source, "wellness");
});

test("the mood check-in category is a 3-hour interval reminder", () => {
  const mood = defaultCategoriesMap()["wellness.mood"];
  assert.equal(mood.source, "wellness");
  assert.equal(mood.frequency, "interval");
  assert.equal(mood.intervalHours, 3);
});

test("merge applies valid changes to a known category", () => {
  const base = defaultNotificationPreferences();
  const merged = mergeNotificationPreferences(base, {
    categories: { "wellness.mood": { enabled: false, time: "07:30" } as any },
  });
  assert.equal(merged.categories["wellness.mood"].enabled, false);
  assert.equal(merged.categories["wellness.mood"].time, "07:30");
});

test("merge ignores unknown categories and does not create them", () => {
  const base = defaultNotificationPreferences();
  const merged = mergeNotificationPreferences(base, {
    categories: { "evil.injected": { enabled: true } as any },
  });
  assert.equal(merged.categories["evil.injected"], undefined);
  assert.equal(Object.keys(merged.categories).length, Object.keys(base.categories).length);
});

test("client cannot spoof the source binding of a category", () => {
  const base = defaultNotificationPreferences();
  const merged = mergeNotificationPreferences(base, {
    categories: { "wellness.mood": { enabled: true, source: "wearable" } as any },
  });
  assert.equal(merged.categories["wellness.mood"].source, "wellness");
});

test("invalid times fall back to the canonical default", () => {
  const base = defaultNotificationPreferences();
  const canonicalTime = defaultCategoriesMap()["wellness.habits"].time;
  const merged = mergeNotificationPreferences(base, {
    categories: { "wellness.habits": { time: "25:99" } as any },
  });
  assert.equal(merged.categories["wellness.habits"].time, canonicalTime);
});

test("normalizeTime accepts only valid HH:mm and rejects the rest", () => {
  assert.equal(normalizeTime("09:05"), "09:05");
  assert.equal(normalizeTime("23:59"), "23:59");
  assert.equal(normalizeTime("24:00"), null);
  assert.equal(normalizeTime("7:5"), null);
  assert.equal(normalizeTime(""), null);
  assert.equal(normalizeTime(12345), null);
});

test("weekday and intervalHours are range-validated", () => {
  const base = defaultNotificationPreferences();
  const merged = mergeNotificationPreferences(base, {
    categories: { "wellness.weeklyInsights": { weekday: 9 } as any },
  });
  assert.equal(merged.categories["wellness.weeklyInsights"].weekday, 0);
});

test("quiet hours validate and preserve valid values", () => {
  const base = defaultNotificationPreferences();
  const merged = mergeNotificationPreferences(base, { quietHoursStart: "21:00", quietHoursEnd: "not-a-time" });
  assert.equal(merged.quietHoursStart, "21:00");
  // Invalid end time normalizes to null (explicitly cleared), never a bogus string.
  assert.equal(merged.quietHoursEnd, null);
});

test("timezone is only replaced by a non-empty string", () => {
  const base = defaultNotificationPreferences();
  assert.equal(mergeNotificationPreferences(base, { timezone: "Asia/Kolkata" }).timezone, "Asia/Kolkata");
  assert.equal(mergeNotificationPreferences(base, { timezone: "" }).timezone, base.timezone);
});
