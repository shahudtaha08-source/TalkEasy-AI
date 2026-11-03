/**
 * Regression guards for TalkEasy 6.5-D Batch 2B-1.
 *
 * Source-level checks only. They verify the customizer popover's accessible
 * trigger/content contract and responsive width; they do not prove runtime
 * focus, Escape, or outside-click behaviour.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (p: string) => readFileSync(path.join(root, p), "utf-8");

for (const [name, file] of [
  ["Dashboard", "client/src/components/DashboardCustomizer.tsx"],
  ["Sidebar", "client/src/components/SidebarCustomizer.tsx"],
] as const) {
  test(`${name} customizer uses an accessible Radix popover`, () => {
    const source = read(file);

    assert.match(source, /import \* as PopoverPrimitive from "@radix-ui\/react-popover"/);
    assert.match(source, /<PopoverPrimitive\.Root open=\{open\} onOpenChange=\{setOpen\}/);
    assert.match(source, /<PopoverPrimitive\.Trigger asChild>/);
    assert.match(source, /aria-expanded=\{open\}/);
    assert.match(source, /aria-controls=\{panelId\}/);
    assert.match(source, /aria-haspopup="dialog"/);
    assert.match(source, /<PopoverPrimitive\.Content/);
    assert.match(source, /align="end"/);
    assert.match(source, /sideOffset=\{8\}/);
    assert.match(source, /collisionPadding=\{8\}/);
    assert.match(source, /w-72 max-w-\[calc\(100vw-2\.5rem\)\]/);
  });

  test(`${name} customizer preserves its actions and live region`, () => {
    const source = read(file);

    assert.match(source, /aria-live="polite"/);
    assert.match(source, /handleReset/);
    assert.match(source, /handleToggle/);
    assert.match(source, /handleMoveUp/);
    assert.match(source, /handleMoveDown/);
  });
}