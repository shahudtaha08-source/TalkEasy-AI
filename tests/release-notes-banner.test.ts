/**
 * Regression guards for TalkEasy 6.5-D Batch 2A-4 (A2).
 *
 * Source-level checks only. They verify the Release Notes banner's mobile
 * chat suppression and responsive layout contract; they do not prove runtime
 * browser layout or viewport behaviour.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (p: string) => readFileSync(path.join(root, p), "utf-8");

test("Release Notes banner is suppressed on narrow chat screens", () => {
  const release = read("client/src/components/ReleaseNotes.tsx");

  assert.match(release, /import \{ useLocation \} from "wouter"/);
  assert.match(release, /import \{ useIsDrawer \} from "@\/hooks\/use-mobile"/);
  assert.match(release, /const \[location\] = useLocation\(\)/);
  assert.match(release, /const isDrawerViewport = useIsDrawer\(\)/);
  assert.match(release, /const suppressMobileChatBanner = !full && location === "\/chat" && isDrawerViewport/);
  assert.match(release, /if \(suppressMobileChatBanner && !dialogOpen\) return null;/);
});

test("Release Notes banner stacks actions and avoids mobile text squeezing", () => {
  const release = read("client/src/components/ReleaseNotes.tsx");

  assert.match(release, /flex flex-col gap-3 .*sm:flex-row sm:items-start/s);
  assert.match(release, /flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-end/);
  assert.match(release, /min-w-0 flex-1/);
  assert.match(release, /w-full sm:w-auto/);
});

test("Release Notes desktop fixed banner behaviour is preserved", () => {
  const release = read("client/src/components/ReleaseNotes.tsx");

  assert.match(release, /bottom-safe-banner fixed left-4 right-4 z-50 sm:left-auto sm:right-6 sm:w-80 lg:w-96/);
});

test("Release Notes acknowledgement and view-notes handlers remain connected", () => {
  const release = read("client/src/components/ReleaseNotes.tsx");

  assert.match(release, /const \{[\s\S]*shouldShowAnnouncement[\s\S]*acknowledge[\s\S]*latest[\s\S]*\} = useReleaseNotes\(\)/);
  assert.match(release, /onClick=\{\(\) => acknowledge\(latest\.version\)\}/);
  assert.match(release, /onClick=\{openDialog\}/);
});

test("Chatbot keeps its fill-height message area while the banner is handled separately", () => {
  const chat = read("client/src/pages/Chatbot.tsx");

  assert.match(chat, /flex min-h-0 w-full max-w-4xl grow basis-0 flex-col/, "chat root must keep grow basis-0");
  assert.match(chat, /min-h-0 grow basis-0[^"]*overflow-y-auto/, "message list must remain the independent scroll area");
  assert.match(chat, /shrink-0/, "composer and footer controls must remain fixed");
});
