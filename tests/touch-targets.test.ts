/**
 * Regression guards for TalkEasy 6.5-D Batch 2B-2.
 *
 * Source-level checks only. They verify that targeted interactive controls
 * expose at least a 44px hit area; they do not prove actual browser hit areas.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (p: string) => readFileSync(path.join(root, p), "utf-8");

test("Landing auth modal close has a 44px hit area", () => {
  const landing = read("client/src/pages/Landing.tsx");

  assert.match(landing, /aria-label="Close" className="absolute right-2 top-2 z-10 inline-flex h-11 w-11 items-center justify-center/);
});

test("ResetPassword visibility toggle has a 44px hit area and reserved input padding", () => {
  const reset = read("client/src/pages/ResetPassword.tsx");

  assert.match(reset, /absolute right-0 top-1\/2 -translate-y-1\/2 inline-flex h-11 w-11 items-center justify-center/);
  assert.match(reset, /pr-14 py-3 rounded-xl/);
});

test("Settings palette swatches have 44px targets and accessible names", () => {
  const settings = read("client/src/pages/Settings.tsx");

  assert.match(settings, /aria-label=\{p\.label\}/);
  assert.match(settings, /h-11 w-11 rounded-full border-2 transition-transform/);
});

test("Resources bookmark buttons have 44px targets", () => {
  const resources = read("client/src/pages/Resources.tsx");

  assert.match(resources, /h-11 w-11 rounded-lg flex items-center justify-center transition/);
});

test("Sidebar close and navigation rows have 44px targets", () => {
  const sidebar = read("client/src/components/Sidebar.tsx");

  assert.match(sidebar, /inline-flex items-center justify-center h-11 w-11 -mr-1 rounded-lg/);
  assert.match(sidebar, /px-3\.5 py-2\.5 text-sm rounded-xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 min-h-\[44px\]/);
  assert.match(sidebar, /inline-flex min-h-\[44px\] min-w-\[44px\] items-center justify-center rounded-md/);
});

test("Layout menu trigger has a 44px target", () => {
  const layout = read("client/src/components/Layout.tsx");

  assert.match(layout, /inline-flex items-center justify-center h-11 w-11 rounded-xl/);
});

test("Release Notes action buttons have 44px targets", () => {
  const release = read("client/src/components/ReleaseNotes.tsx");
  const matches = release.match(/min-h-\[44px\]/g) ?? [];

  assert.ok(matches.length >= 2, "both Release Notes action buttons should have 44px targets");
});

test("Report Library dialog close inherits the shared 44px target", () => {
  const dialog = read("client/src/components/ui/dialog.tsx");

  assert.match(dialog, /inline-flex h-11 w-11 items-center justify-center/);
});