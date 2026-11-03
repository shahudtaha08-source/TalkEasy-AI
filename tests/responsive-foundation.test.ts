/**
 * Regression guards for TalkEasy 6.5-D Batch 1 (critical responsive foundation).
 *
 * These are source-level checks: the project has no DOM/browser test harness,
 * so they assert the structural choices that make the layout resilient on
 * small/dynamic viewports. Real viewport behaviour is verified manually.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (p: string) => readFileSync(path.join(root, p), "utf-8");

test("PWA manifest is orientation-agnostic and uses the app canvas colour", () => {
  const manifest = JSON.parse(read("client/public/manifest.webmanifest"));
  assert.equal(
    manifest.orientation,
    undefined,
    "portrait-only orientation lock must not be shipped without a product requirement",
  );
  assert.equal(manifest.background_color, "#faf8f4", "splash background must match the warm app canvas");
  assert.equal(manifest.theme_color, "#0d9488", "existing PWA theme colour must be preserved");
});

test("shared viewport and safe-area utilities exist with non-dvh fallbacks", () => {
  const css = read("client/src/index.css");
  assert.match(css, /\.h-app-viewport\s*\{[^}]*height:\s*100vh;[^}]*height:\s*100dvh;/s);
  assert.match(css, /\.max-h-app-dialog\s*\{[^}]*calc\(100vh - 2rem\)/s);
  assert.match(css, /\.max-h-app-dialog\s*\{[^}]*100dvh[^}]*env\(safe-area-inset-top/s);
  assert.match(css, /\.bottom-safe-banner\s*\{[^}]*env\(safe-area-inset-bottom/s);
  assert.match(css, /\.pb-safe-footer\s*\{[^}]*env\(safe-area-inset-bottom/s);
  assert.match(css, /\.app-main-safe-top\s*\{[^}]*env\(safe-area-inset-top/s);
  assert.match(css, /\.app-mobile-header\s*\{[^}]*env\(safe-area-inset-top/s);
});

test("app shell uses a flex column with an independent scroll area", () => {
  const layout = read("client/src/components/Layout.tsx");
  assert.match(layout, /h-app-viewport[^"]*flex flex-col|flex flex-col[^"]*h-app-viewport/);
  assert.match(layout, /flex-1 min-h-0 overflow-y-auto/);
  assert.match(layout, /app-main-safe-top/);
  assert.match(layout, /app-mobile-header/);
  assert.match(layout, /min-h-full[^"]*flex-col/);
  assert.doesNotMatch(layout, /"h-screen /, "main scroll container should use dynamic viewport sizing");
});

test("chat page fills available height without 100vh subtraction", () => {
  const chat = read("client/src/pages/Chatbot.tsx");
  assert.doesNotMatch(chat, /100vh/, "chat must not subtract fixed viewport units");
  assert.match(chat, /min-h-0[^"]*grow basis-0/, "chat root must use a pixel basis so it fills the flex shell");
  assert.match(chat, /min-h-0 grow basis-0[^"]*overflow-y-auto/, "message list must be the independent scroll area");
  assert.match(chat, /shrink-0/, "composer/footer controls must not be squeezed out");
  assert.match(chat, /aria-label="Send message"/, "icon-only send control needs an accessible name");
});

test("dialogs cap to the dynamic viewport and scroll internally", () => {
  const dialog = read("client/src/components/ui/dialog.tsx");
  assert.match(dialog, /scrollable\?: boolean/);
  assert.match(dialog, /max-h-app-dialog/);
  assert.match(dialog, /overflow-y-auto/);
  assert.match(dialog, /overscroll-contain/);
  // The close control lives outside the scroll area so it stays reachable.
  const scrollIndex = dialog.indexOf('data-slot="dialog-scroll"');
  const closeIndex = dialog.indexOf("<DialogPrimitive.Close");
  assert.ok(scrollIndex > -1 && closeIndex > scrollIndex, "close control must render after/outside the scroll area");

  const command = read("client/src/components/ui/command.tsx");
  assert.match(command, /scrollable=\{false\}/, "command palette manages its own scroll/layout");
});

test("habit composer stacks on narrow screens", () => {
  const habits = read("client/src/pages/HabitTracker.tsx");
  assert.match(habits, /<form[^>]*className="flex flex-col gap-2 sm:flex-row"/);
  assert.match(habits, /min-w-0 flex-1/);
  assert.match(habits, /min-h-\[48px\]/);
});

test("landing header wraps and the signup modal scrolls on short screens", () => {
  const landing = read("client/src/pages/Landing.tsx");
  assert.match(landing, /app-public-safe-top/);
  assert.match(landing, /flex flex-wrap items-center justify-between/);
  assert.match(landing, /hidden sm:inline/, "login label should collapse to an icon on narrow screens");
  assert.match(landing, /max-h-full[^"]*flex-col[^"]*overflow-hidden/);
  assert.match(landing, /overflow-y-auto overscroll-contain/);
  assert.match(landing, /grid grid-cols-1 gap-3 sm:grid-cols-2/);
});

test("mobile drawer and release banner respect safe areas", () => {
  const sidebar = read("client/src/components/Sidebar.tsx");
  assert.match(sidebar, /h-app-viewport/);
  assert.match(sidebar, /app-sidebar-safe-top/);
  assert.match(sidebar, /pb-safe-footer/);
  assert.match(sidebar, /min-h-0 flex-1 overflow-y-auto/);

  const release = read("client/src/components/ReleaseNotes.tsx");
  assert.match(release, /bottom-safe-banner/);
});
