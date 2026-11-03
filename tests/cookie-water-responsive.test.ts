/**
 * Regression guards for TalkEasy 6.5-D Batch 2A-2.
 *
 * Source-level checks only. They assert the structural choices that make the
 * Cookie Preferences and Water Intake controls usable on narrow screens; they
 * do not prove actual browser layout or touch behaviour.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (p: string) => readFileSync(path.join(root, p), "utf-8");

test("Cookie Preferences actions stack on mobile and restore a row at sm", () => {
  const cookie = read("client/src/pages/CookiePreferences.tsx");

  assert.match(cookie, /<div className="flex flex-col gap-2 sm:flex-row">/);
  assert.match(cookie, /className="w-full sm:flex-1"/, "Save button must be full-width on mobile");
  assert.match(cookie, /className="w-full sm:w-auto"/, "Reset button must be full-width on mobile");
});

test("Cookie Preferences buttons remain connected to their original handlers", () => {
  const cookie = read("client/src/pages/CookiePreferences.tsx");

  assert.match(cookie, /<Button onClick=\{handleSave\}/);
  assert.match(cookie, /<Button onClick=\{handleReset\}/);
});

test("Water custom amount layout stacks on mobile and restores the row at sm", () => {
  const water = read("client/src/pages/WaterIntake.tsx");

  assert.match(water, /<div className="mt-3 flex flex-col gap-2 sm:flex-row">/);
  assert.match(water, /relative min-w-0 flex-1/, "input wrapper must be able to shrink without overflow");
});

test("Water custom input reserves space for the unit suffix", () => {
  const water = read("client/src/pages/WaterIntake.tsx");

  assert.match(water, /className="[^"]*\bpr-12\b[^"]*"/, "input needs right padding for the ml suffix and spinner");
  assert.match(water, /min-h-\[44px\]/, "mobile controls need a comfortable touch target");
});

test("Water custom amount handlers and Enter submission remain connected", () => {
  const water = read("client/src/pages/WaterIntake.tsx");

  assert.match(water, /onKeyDown=\{\(e\) => e\.key === "Enter" && handleCustomAdd\(\)\}/);
  assert.match(water, /onClick=\{handleCustomAdd\}/);
  assert.match(water, /onClick=\{\(\) => \{ setShowCustom\(false\); setCustomMl\(""\); \}\}/);
});
