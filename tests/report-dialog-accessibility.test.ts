/**
 * Regression guards for TalkEasy 6.5-D Batch 2A-1.
 *
 * These are source-level checks. They verify the structural contract for the
 * shared dialog close target and the Report Library dialog; they do not prove
 * runtime focus trapping, Escape handling, or focus restoration because the
 * project has no DOM/browser test harness.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (p: string) => readFileSync(path.join(root, p), "utf-8");

test("shared dialog close control has a 44x44 hit area and small icon", () => {
  const dialog = read("client/src/components/ui/dialog.tsx");
  const close = dialog.match(/<DialogPrimitive\.Close[\s\S]*?<\/DialogPrimitive\.Close>/)?.[0];

  assert.ok(close, "shared dialog close control must exist");
  assert.match(close, /\bh-11\b/, "close hit area must be at least 44px high");
  assert.match(close, /\bw-11\b/, "close hit area must be at least 44px wide");
  assert.match(close, /data-slot="dialog-close"/, "close control should be identifiable");
  assert.match(close, /<X className="h-4 w-4"/, "visual close icon should remain small");
  assert.match(close, /sr-only">Close</, "close control must keep its accessible name");
});

test("shared dialog close control stays outside the scrollable body", () => {
  const dialog = read("client/src/components/ui/dialog.tsx");
  const scrollIndex = dialog.indexOf('data-slot="dialog-scroll"');
  const closeIndex = dialog.indexOf("<DialogPrimitive.Close");
  const contentEndIndex = dialog.indexOf("</DialogPrimitive.Content>");

  assert.ok(scrollIndex > -1, "scrollable dialog body must exist");
  assert.ok(closeIndex > scrollIndex, "close control must render after the scrollable body");
  assert.ok(contentEndIndex > closeIndex, "close control must remain a sibling inside dialog content");
});

test("Report Library uses the shared Dialog implementation", () => {
  const report = read("client/src/pages/ReportLibrary.tsx");
  const dialogImport = report.match(/import \{([^}]*)\} from "@\/components\/ui\/dialog"/)?.[1] ?? "";

  assert.match(dialogImport, /\bDialog\b/, "shared Dialog must be imported");
  assert.match(dialogImport, /\bDialogContent\b/, "shared DialogContent must be imported");
  assert.match(dialogImport, /\bDialogTitle\b/, "shared DialogTitle must be imported");
  assert.match(dialogImport, /\bDialogDescription\b/, "shared DialogDescription must be imported");
  assert.match(report, /<Dialog\s/, "report viewer must be wrapped in the shared Dialog");
  assert.match(report, /<DialogContent\s+scrollable\b/, "report content must use the capped scrollable dialog body");
  assert.match(report, /w-\[calc\(100vw-2rem\)\]/, "report dialog must keep a 1rem viewport gutter on narrow screens");
});

test("Report Library dialog has an accessible title and description", () => {
  const report = read("client/src/pages/ReportLibrary.tsx");

  assert.match(
    report,
    /<DialogTitle[^>]*>\{selectedReport\.title\}<\/DialogTitle>/,
    "selected report title must be the dialog's accessible name",
  );
  assert.match(
    report,
    /<DialogDescription>\s*\{formatDate\(selectedReport\.periodStart\)\} – \{formatDate\(selectedReport\.periodEnd\)\}\s*<\/DialogDescription>/s,
    "selected report period must be the dialog's accessible description",
  );
});

test("Report Library custom fixed overlay is removed", () => {
  const report = read("client/src/pages/ReportLibrary.tsx");

  assert.doesNotMatch(report, /fixed inset-0 bg-black/, "hand-rolled fixed overlay must be removed");
  assert.doesNotMatch(report, /max-h-\[90vh\]/, "custom 90vh modal cap must be removed");
  assert.doesNotMatch(report, /<Card className="max-w-4xl/, "custom modal card must be removed");
});

test("Report Library download behaviour remains connected to the same handler", () => {
  const report = read("client/src/pages/ReportLibrary.tsx");

  assert.match(report, /const downloadReport = \(report: Report\) => \{/);
  assert.match(report, /onClick=\{\(\) => downloadReport\(report\)\}/);
  assert.match(report, /URL\.createObjectURL\(blob\)/);
  assert.match(report, /a\.download =/);
});
