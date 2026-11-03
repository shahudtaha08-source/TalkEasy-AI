/**
 * Regression guards for TalkEasy 6.5-D Batch 2A-3.
 *
 * Source-level checks only. They verify the drawer's responsive/modal
 * contract and inert/focus wiring; they do not prove runtime focus trapping,
 * Escape handling, or screen-reader behaviour.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (p: string) => readFileSync(path.join(root, p), "utf-8");

test("drawer hook matches the 1024px desktop breakpoint without changing mobile hook", () => {
  const hooks = read("client/src/hooks/use-mobile.tsx");

  assert.match(hooks, /const MOBILE_BREAKPOINT = 768/);
  assert.match(hooks, /const DRAWER_BREAKPOINT = 1024/);
  assert.match(hooks, /export function useIsDrawer\(\)/);
  assert.match(hooks, /window\.matchMedia\(`\(max-width: \$\{DRAWER_BREAKPOINT - 1\}px\)`\)/);
  assert.match(hooks, /window\.innerWidth < DRAWER_BREAKPOINT/);
});

test("Sidebar drawer uses modal semantics only while open below 1024px", () => {
  const sidebar = read("client/src/components/Sidebar.tsx");

  assert.match(sidebar, /import \{ useIsMobile, useIsDrawer \} from "@\/hooks\/use-mobile"/);
  assert.match(sidebar, /const isDrawer = useIsDrawer\(\)/);
  assert.match(sidebar, /role=\{isDrawer && mobileOpen \? "dialog" : undefined\}/);
  assert.match(sidebar, /aria-modal=\{isDrawer && mobileOpen \? true : undefined\}/);
  assert.match(sidebar, /const hiddenOnDrawer = isDrawer && !mobileOpen/);
  assert.match(sidebar, /aria-hidden=\{hiddenOnDrawer \|\| undefined\}/);
  assert.match(sidebar, /const inertProps: any = hiddenOnDrawer \? \{ inert: "" \} : \{\}/);
  assert.match(sidebar, /mobileOpen && isDrawer && \(/);
});

test("Sidebar keeps Escape, close-button focus and menu focus return", () => {
  const sidebar = read("client/src/components/Sidebar.tsx");
  const layout = read("client/src/components/Layout.tsx");

  assert.match(sidebar, /if \(!mobileOpen \|\| !isDrawer\) return;/);
  assert.match(sidebar, /if \(e\.key === "Escape"\)/);
  assert.match(sidebar, /closeButtonRef\.current\?\.focus\(\)/);
  assert.match(layout, /requestAnimationFrame\(\(\) => menuButtonRef\.current\?\.focus\(\)\)/);
});

test("Layout inertializes background content while the drawer is open", () => {
  const layout = read("client/src/components/Layout.tsx");

  assert.match(layout, /import \{ useIsDrawer \} from "@\/hooks\/use-mobile"/);
  assert.match(layout, /const isDrawer = useIsDrawer\(\)/);
  assert.match(layout, /const drawerOpen = mobileNavOpen && isDrawer/);
  assert.match(layout, /const backgroundInertProps: any = drawerOpen \? \{ inert: "" \} : \{\}/);
  assert.match(layout, /aria-hidden=\{drawerOpen \? true : undefined\}/);
  assert.match(layout, /<div \{\.\.\.backgroundInertProps\} aria-hidden=\{drawerOpen \? true : undefined\}>\s*<ReleaseNotes/);
});

test("Sidebar traps Tab and Shift+Tab inside the open drawer", () => {
  const sidebar = read("client/src/components/Sidebar.tsx");

  assert.match(sidebar, /const sidebarRef = useRef<HTMLElement>\(null\)/);
  assert.match(sidebar, /ref=\{sidebarRef\}/);
  assert.match(sidebar, /tabIndex=\{-1\}/);
  assert.match(sidebar, /if \(event\.key !== "Tab"\) return;/);
  assert.match(sidebar, /const focusable = getFocusable\(\)/);
  assert.match(sidebar, /if \(focusable\.length === 0\) \{\s*event\.preventDefault\(\);\s*container\.focus\(\);/s);
  assert.match(sidebar, /if \(event\.shiftKey\) \{/);
  assert.match(sidebar, /event\.preventDefault\(\);\s*last\.focus\(\);/s);
  assert.match(sidebar, /event\.preventDefault\(\);\s*first\.focus\(\);/s);
  assert.match(sidebar, /container\.removeEventListener\("keydown", onKeyDown\)/);
});

test("Layout restores focus and drops modal state when crossing to desktop", () => {
  const layout = read("client/src/components/Layout.tsx");

  assert.match(layout, /if \(!isDrawer && mobileNavOpen\) \{/);
  assert.match(layout, /setMobileNavOpen\(false\)/);
  assert.match(layout, /mainRef\.current\?\.focus\(\)/);
  assert.match(layout, /tabIndex=\{-1\}/);
});
