/**
 * Regression guards for TalkEasy 6.5-D Batch 2A-5 (A6).
 *
 * Source-level checks only. They verify that pages rendered inside the fixed
 * Layout shell use shell-aware sizing instead of nested full-viewport heights.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (p: string) => readFileSync(path.join(root, p), "utf-8");

const targetPages = [
  "client/src/pages/Insights.tsx",
  "client/src/pages/ReportLibrary.tsx",
  "client/src/pages/Trends30Days.tsx",
  "client/src/pages/Trends90Days.tsx",
  "client/src/pages/PrivacyPolicy.tsx",
  "client/src/pages/TermsConditions.tsx",
  "client/src/pages/CookiePolicy.tsx",
  "client/src/pages/CookiePreferences.tsx",
];

test("nested shell pages do not use full-viewport min-h-screen", () => {
  for (const pagePath of targetPages) {
    const page = read(pagePath);
    assert.doesNotMatch(
      page,
      /min-h-screen/,
      `${pagePath} must not create a nested full-viewport shell`,
    );
  }
});

test("nested shell pages use shell-aware flex sizing", () => {
  for (const pagePath of targetPages) {
    const page = read(pagePath);
    assert.match(
      page,
      /flex (?:w-full )?flex-1/,
      `${pagePath} must fill the Layout shell with flex-1 instead of 100vh`,
    );
  }
});

test("nested shell loading states remain centered without min-h-screen", () => {
  const report = read("client/src/pages/ReportLibrary.tsx");
  const trends30 = read("client/src/pages/Trends30Days.tsx");
  const trends90 = read("client/src/pages/Trends90Days.tsx");

  assert.match(report, /flex flex-1 items-center justify-center/);
  assert.match(trends30, /flex flex-1 items-center justify-center/);
  assert.match(trends90, /flex flex-1 items-center justify-center/);
});

test("Chatbot keeps its independent grow basis-0 layout", () => {
  const chat = read("client/src/pages/Chatbot.tsx");

  assert.match(chat, /flex min-h-0 w-full max-w-4xl grow basis-0 flex-col/);
  assert.match(chat, /min-h-0 grow basis-0[^"]*overflow-y-auto/);
});