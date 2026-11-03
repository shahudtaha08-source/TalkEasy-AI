/**
 * Regression guards for TalkEasy 6.5-D Batch 2B-3 (P2-B3 and P2-B4).
 *
 * Source-level checks only. They verify responsive layout choices and preserved
 * handlers/data; they do not prove actual browser layout or chart rendering.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (p: string) => readFileSync(path.join(root, p), "utf-8");

test("FindHelp action pills stack on mobile and restore a row at sm", () => {
  const findHelp = read("client/src/pages/FindHelp.tsx");

  assert.match(findHelp, /flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between/);
  assert.match(findHelp, /flex flex-col gap-2 sm:flex-row sm:items-center/);
  assert.match(findHelp, /min-h-\[44px\] w-full items-center justify-center/);
});

test("FindHelp action handlers and labels remain connected", () => {
  const findHelp = read("client/src/pages/FindHelp.tsx");

  assert.match(findHelp, /onClick=\{handleUseLocation\}/);
  assert.match(findHelp, /onClick=\{\(\) => setShowFilters\(\(f\) => !f\)\}/);
  assert.match(findHelp, /t\("useMyLocation"\)/);
  assert.match(findHelp, /t\("budgetLabel"\)/);
  assert.match(findHelp, /t\("modeLabel"\)/);
});

test("SleepTracker trend rows stack on mobile and restore the row at sm", () => {
  const sleep = read("client/src/pages/SleepTracker.tsx");

  assert.match(sleep, /flex flex-col gap-2 rounded-xl bg-slate-50 p-3 dark:bg-slate-800\/50 sm:flex-row sm:items-center sm:gap-4/);
  assert.match(sleep, /sm:contents/);
  assert.match(sleep, /flex-1 min-w-0 bg-slate-200/);
});

test("SleepTracker preserves sleep calculations, units and detail labels", () => {
  const sleep = read("client/src/pages/SleepTracker.tsx");

  assert.match(sleep, /Math\.min\(\(day\.total \/ 12\) \* 100, 100\)/);
  assert.match(sleep, /day\.total > 0 \? `\$\{day\.total\}h` : '-'/);
  assert.match(sleep, /day\.nightSleep > 0 && `\$\{day\.nightSleep\}h night`/);
  assert.match(sleep, /day\.nap > 0 && ` \+ \$\{day\.nap\}h nap`/);
  assert.match(sleep, /averageSleep\.toFixed\(1\)/);
});