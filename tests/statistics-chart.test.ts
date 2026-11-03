/**
 * Regression guards for TalkEasy 6.5-D Batch 2A-6 (A7).
 *
 * Source-level checks only. They verify the Statistics habit chart's narrow
 * layout and that the underlying chart/data structure remains intact.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (p: string) => readFileSync(path.join(root, p), "utf-8");

test("Statistics imports the mobile breakpoint for chart density", () => {
  const statistics = read("client/src/pages/Statistics.tsx");

  assert.match(statistics, /import \{ useIsMobile \} from "@\/hooks\/use-mobile"/);
  assert.match(statistics, /const isNarrowChart = useIsMobile\(\)/);
});

test("Habit chart uses compact margins and axis sizing on narrow screens", () => {
  const statistics = read("client/src/pages/Statistics.tsx");

  assert.match(statistics, /margin=\{isNarrowChart \? \{ top: 5, right: 8, bottom: 5, left: 0 \} : \{ top: 5, right: 30, bottom: 5, left: 50 \}\}/);
  assert.match(statistics, /width=\{isNarrowChart \? 72 : 100\}/);
  assert.match(statistics, /tick=\{\{ fontSize: isNarrowChart \? 10 : 12 \}\}/);
  assert.match(statistics, /glass-card p-4 sm:p-6 rounded-3xl lg:col-span-2/);
});

test("Habit chart preserves its data, labels, tooltip and percentage axis", () => {
  const statistics = read("client/src/pages/Statistics.tsx");

  assert.match(statistics, /<BarChart data=\{habitData\} layout="vertical"/);
  assert.match(statistics, /<XAxis type="number" domain=\{\[0, 100\]\} unit="%" /);
  assert.match(statistics, /<YAxis dataKey="name" type="category"/);
  assert.match(statistics, /formatter=\{\(value: any\) => \[\`\$\{value\}%`, t\("completionRate"\)\]\}/);
});

test("Mood and Sleep charts retain their original axis configuration", () => {
  const statistics = read("client/src/pages/Statistics.tsx");

  assert.match(statistics, /<LineChart data=\{moodData\} margin=\{\{ top: 5, right: 20, bottom: 5, left: 0 \}\}/);
  assert.match(statistics, /<AreaChart data=\{sleepTrendData\} margin=\{\{ top: 5, right: 20, bottom: 5, left: 0 \}\}/);
});