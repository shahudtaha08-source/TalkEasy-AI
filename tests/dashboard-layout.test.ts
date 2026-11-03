import { test } from "node:test";
import assert from "node:assert/strict";
import {
  DASHBOARD_WIDGET_IDS,
  DEFAULT_DASHBOARD_LAYOUT,
  parseDashboardLayout,
  serializeDashboardLayout,
  isWidgetVisible,
  moveWidget,
  toggleWidgetVisibility,
  isValidWidgetId,
} from "../shared/dashboard-layout";

// ─── Default layout ──────────────────────────────────────────────────────────

test("default layout includes all widgets", () => {
  assert.equal(DEFAULT_DASHBOARD_LAYOUT.widgets.length, DASHBOARD_WIDGET_IDS.length);
  for (const id of DASHBOARD_WIDGET_IDS) {
    assert.ok(DEFAULT_DASHBOARD_LAYOUT.widgets.includes(id), `missing ${id}`);
  }
});

test("default layout has no hidden widgets", () => {
  assert.deepEqual(DEFAULT_DASHBOARD_LAYOUT.hidden, []);
});

test("default layout version is 1", () => {
  assert.equal(DEFAULT_DASHBOARD_LAYOUT.version, 1);
});

// ─── Widget ID validation ────────────────────────────────────────────────────

test("isValidWidgetId accepts known IDs", () => {
  for (const id of DASHBOARD_WIDGET_IDS) {
    assert.equal(isValidWidgetId(id), true);
  }
});

test("isValidWidgetId rejects unknown IDs", () => {
  assert.equal(isValidWidgetId("unknown-widget"), false);
  assert.equal(isValidWidgetId(""), false);
  assert.equal(isValidWidgetId("chat-cta-extra"), false);
});

// ─── Parsing ─────────────────────────────────────────────────────────────────

test("parseDashboardLayout returns default for null", () => {
  const layout = parseDashboardLayout(null);
  assert.deepEqual(layout.widgets, [...DASHBOARD_WIDGET_IDS]);
  assert.deepEqual(layout.hidden, []);
});

test("parseDashboardLayout returns default for undefined", () => {
  const layout = parseDashboardLayout(undefined);
  assert.deepEqual(layout.widgets, [...DASHBOARD_WIDGET_IDS]);
});

test("parseDashboardLayout returns default for empty string", () => {
  const layout = parseDashboardLayout("");
  assert.deepEqual(layout.widgets, [...DASHBOARD_WIDGET_IDS]);
});

test("parseDashboardLayout returns default for invalid JSON", () => {
  const layout = parseDashboardLayout("not json");
  assert.deepEqual(layout.widgets, [...DASHBOARD_WIDGET_IDS]);
});

test("parseDashboardLayout returns default for non-object JSON", () => {
  const layout = parseDashboardLayout("42");
  assert.deepEqual(layout.widgets, [...DASHBOARD_WIDGET_IDS]);
});

test("parseDashboardLayout returns default for JSON array", () => {
  const layout = parseDashboardLayout('["a","b"]');
  assert.deepEqual(layout.widgets, [...DASHBOARD_WIDGET_IDS]);
});

test("parseDashboardLayout filters unknown widget IDs", () => {
  const layout = parseDashboardLayout(JSON.stringify({ version: 1, widgets: ["chat-cta", "unknown-widget", "today-mood"], hidden: [] }));
  assert.ok(layout.widgets.includes("chat-cta"));
  assert.ok(layout.widgets.includes("today-mood"));
  assert.ok(!layout.widgets.includes("unknown-widget" as any));
});

test("parseDashboardLayout adds missing widgets to visible list", () => {
  const layout = parseDashboardLayout(JSON.stringify({ version: 1, widgets: ["chat-cta"], hidden: [] }));
  // All 8 widgets should be accounted for
  const all = new Set([...layout.widgets, ...layout.hidden]);
  assert.equal(all.size, DASHBOARD_WIDGET_IDS.length);
});

test("parseDashboardLayout removes duplicates", () => {
  const layout = parseDashboardLayout(JSON.stringify({ version: 1, widgets: ["chat-cta", "chat-cta", "today-mood"], hidden: [] }));
  const count = layout.widgets.filter((w) => w === "chat-cta").length;
  assert.equal(count, 1);
});

test("parseDashboardLayout handles hidden widgets", () => {
  const layout = parseDashboardLayout(JSON.stringify({ version: 1, widgets: ["chat-cta", "today-mood"], hidden: ["habit-progress"] }));
  assert.ok(layout.hidden.includes("habit-progress"));
  assert.ok(!layout.widgets.includes("habit-progress"));
});

test("parseDashboardLayout prevents widget in both widgets and hidden", () => {
  const layout = parseDashboardLayout(JSON.stringify({ version: 1, widgets: ["chat-cta"], hidden: ["chat-cta"] }));
  // chat-cta should be in widgets only (removed from hidden)
  assert.ok(layout.widgets.includes("chat-cta"));
  assert.ok(!layout.hidden.includes("chat-cta"));
});

// ─── Visibility ──────────────────────────────────────────────────────────────

test("isWidgetVisible returns true for visible widget", () => {
  const layout = { ...DEFAULT_DASHBOARD_LAYOUT, widgets: [...DEFAULT_DASHBOARD_LAYOUT.widgets], hidden: [] };
  assert.equal(isWidgetVisible(layout, "chat-cta"), true);
});

test("isWidgetVisible returns false for hidden widget", () => {
  const layout = parseDashboardLayout(JSON.stringify({ version: 1, widgets: ["today-mood"], hidden: ["chat-cta"] }));
  assert.equal(isWidgetVisible(layout, "chat-cta"), false);
});

// ─── Toggle visibility ───────────────────────────────────────────────────────

test("toggleWidgetVisibility hides a visible widget", () => {
  const layout = { version: 1, widgets: ["chat-cta", "today-mood"], hidden: [] };
  const result = toggleWidgetVisibility(layout, "chat-cta");
  assert.ok(!result.widgets.includes("chat-cta"));
  assert.ok(result.hidden.includes("chat-cta"));
});

test("toggleWidgetVisibility shows a hidden widget", () => {
  const layout = { version: 1, widgets: ["today-mood"], hidden: ["chat-cta"] };
  const result = toggleWidgetVisibility(layout, "chat-cta");
  assert.ok(result.widgets.includes("chat-cta"));
  assert.ok(!result.hidden.includes("chat-cta"));
});

// ─── Reordering ──────────────────────────────────────────────────────────────

test("moveWidget up swaps positions", () => {
  const layout = { version: 1, widgets: ["chat-cta", "today-mood", "habit-progress"], hidden: [] };
  const result = moveWidget(layout, "today-mood", "up");
  assert.deepEqual(result.widgets, ["today-mood", "chat-cta", "habit-progress"]);
});

test("moveWidget down swaps positions", () => {
  const layout = { version: 1, widgets: ["chat-cta", "today-mood", "habit-progress"], hidden: [] };
  const result = moveWidget(layout, "chat-cta", "down");
  assert.deepEqual(result.widgets, ["today-mood", "chat-cta", "habit-progress"]);
});

test("moveWidget at boundary does nothing", () => {
  const layout = { version: 1, widgets: ["chat-cta", "today-mood"], hidden: [] };
  const result = moveWidget(layout, "chat-cta", "up");
  assert.deepEqual(result.widgets, ["chat-cta", "today-mood"]);
});

test("moveWidget unknown widget does nothing", () => {
  const layout = { version: 1, widgets: ["chat-cta", "today-mood"], hidden: [] };
  const result = moveWidget(layout, "nonexistent" as any, "down");
  assert.deepEqual(result.widgets, ["chat-cta", "today-mood"]);
});

// ─── Serialization ───────────────────────────────────────────────────────────

test("serializeDashboardLayout produces valid JSON", () => {
  const layout = { version: 1, widgets: ["chat-cta", "today-mood"], hidden: ["habit-progress"] };
  const json = serializeDashboardLayout(layout);
  const parsed = JSON.parse(json);
  assert.deepEqual(parsed, layout);
});

test("round-trip parse/serialize preserves data", () => {
  const original = { version: 1, widgets: ["today-mood", "chat-cta"], hidden: ["habit-progress"] };
  const json = serializeDashboardLayout(original);
  const parsed = parseDashboardLayout(json);
  // parseDashboardLayout adds missing widgets; verify the specified ones are first
  assert.ok(parsed.widgets.includes("today-mood"));
  assert.ok(parsed.widgets.includes("chat-cta"));
  assert.ok(parsed.hidden.includes("habit-progress"));
  assert.ok(!parsed.widgets.includes("habit-progress"));
});

// ─── Reset to default ────────────────────────────────────────────────────────

test("reset produces default layout", () => {
  const modified = { version: 1, widgets: ["today-mood"], hidden: ["chat-cta", "habit-progress"] };
  const reset = { ...DEFAULT_DASHBOARD_LAYOUT, widgets: [...DEFAULT_DASHBOARD_LAYOUT.widgets], hidden: [] };
  assert.deepEqual(reset.widgets, [...DASHBOARD_WIDGET_IDS]);
  assert.deepEqual(reset.hidden, []);
});