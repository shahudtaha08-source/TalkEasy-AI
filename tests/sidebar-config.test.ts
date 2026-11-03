import { test } from "node:test";
import assert from "node:assert/strict";
import {
  SIDEBAR_ITEM_IDS,
  ESSENTIAL_SIDEBAR_ITEMS,
  DEFAULT_SIDEBAR_CONFIG,
  parseSidebarConfig,
  serializeSidebarConfig,
  isSidebarItemVisible,
  toggleSidebarItemVisibility,
  moveSidebarItem,
  resetSidebarConfig,
  isValidSidebarItemId,
} from "../shared/sidebar-config";

// ─── Default config ──────────────────────────────────────────────────────────

test("default config includes all items", () => {
  assert.equal(DEFAULT_SIDEBAR_CONFIG.visible.length, SIDEBAR_ITEM_IDS.length);
  assert.equal(DEFAULT_SIDEBAR_CONFIG.hidden.length, 0);
  assert.equal(DEFAULT_SIDEBAR_CONFIG.order.length, SIDEBAR_ITEM_IDS.length);
});

test("essential items are in default visible", () => {
  for (const id of ESSENTIAL_SIDEBAR_ITEMS) {
    assert.ok(DEFAULT_SIDEBAR_CONFIG.visible.includes(id));
  }
});

// ─── Valid/invalid IDs ───────────────────────────────────────────────────────

test("isValidSidebarItemId accepts known IDs", () => {
  for (const id of SIDEBAR_ITEM_IDS) {
    assert.equal(isValidSidebarItemId(id), true);
  }
});

test("isValidSidebarItemId rejects unknown IDs", () => {
  assert.equal(isValidSidebarItemId("/unknown"), false);
  assert.equal(isValidSidebarItemId(""), false);
  assert.equal(isValidSidebarItemId("/dashboard/extra"), false);
});

// ─── Parsing ─────────────────────────────────────────────────────────────────

test("parseSidebarConfig returns default for null", () => {
  const config = parseSidebarConfig(null);
  assert.deepEqual(config.visible, [...SIDEBAR_ITEM_IDS]);
  assert.deepEqual(config.hidden, []);
});

test("parseSidebarConfig returns default for undefined", () => {
  const config = parseSidebarConfig(undefined);
  assert.deepEqual(config.visible, [...SIDEBAR_ITEM_IDS]);
});

test("parseSidebarConfig returns default for empty string", () => {
  const config = parseSidebarConfig("");
  assert.deepEqual(config.visible, [...SIDEBAR_ITEM_IDS]);
});

test("parseSidebarConfig returns default for invalid JSON", () => {
  const config = parseSidebarConfig("not json");
  assert.deepEqual(config.visible, [...SIDEBAR_ITEM_IDS]);
});

test("parseSidebarConfig returns default for non-object JSON", () => {
  const config = parseSidebarConfig("42");
  assert.deepEqual(config.visible, [...SIDEBAR_ITEM_IDS]);
});

test("parseSidebarConfig returns default for JSON array", () => {
  const config = parseSidebarConfig('["a","b"]');
  assert.deepEqual(config.visible, [...SIDEBAR_ITEM_IDS]);
});

test("parseSidebarConfig filters unknown item IDs", () => {
  const config = parseSidebarConfig(JSON.stringify({ version: 1, visible: ["/dashboard", "/unknown"], hidden: [], order: ["/dashboard"] }));
  assert.ok(config.visible.includes("/dashboard"));
  assert.ok(!config.visible.includes("/unknown" as any));
});

test("parseSidebarConfig ensures essential items are always visible", () => {
  const config = parseSidebarConfig(JSON.stringify({ version: 1, visible: ["/journal"], hidden: ["/dashboard"], order: ["/journal"] }));
  assert.ok(config.visible.includes("/dashboard"));
  assert.ok(!config.hidden.includes("/dashboard"));
});

test("parseSidebarConfig prevents essential items from being hidden", () => {
  const config = parseSidebarConfig(JSON.stringify({ version: 1, visible: [], hidden: ["/settings", "/help"], order: [] }));
  assert.ok(!config.hidden.includes("/settings"));
  assert.ok(!config.hidden.includes("/help"));
  assert.ok(config.visible.includes("/settings"));
  assert.ok(config.visible.includes("/help"));
});

test("parseSidebarConfig adds missing items", () => {
  const config = parseSidebarConfig(JSON.stringify({ version: 1, visible: ["/dashboard"], hidden: [], order: ["/dashboard"] }));
  const all = new Set([...config.visible, ...config.hidden, ...config.order]);
  assert.equal(all.size, SIDEBAR_ITEM_IDS.length);
});

test("parseSidebarConfig removes duplicates", () => {
  const config = parseSidebarConfig(JSON.stringify({ version: 1, visible: ["/dashboard", "/dashboard"], hidden: [], order: ["/dashboard", "/dashboard"] }));
  const count = config.visible.filter((v) => v === "/dashboard").length;
  assert.equal(count, 1);
});

// ─── Visibility ──────────────────────────────────────────────────────────────

test("isSidebarItemVisible returns true for visible item", () => {
  const config = { version: 1, visible: ["/dashboard", "/chat"], hidden: [], order: ["/dashboard", "/chat"] };
  assert.equal(isSidebarItemVisible(config, "/dashboard"), true);
});

test("isSidebarItemVisible returns false for hidden item", () => {
  const config = { version: 1, visible: ["/chat"], hidden: ["/journal"], order: ["/chat", "/journal"] };
  assert.equal(isSidebarItemVisible(config, "/journal"), false);
});

// ─── Toggle visibility ───────────────────────────────────────────────────────

test("toggleSidebarItemVisibility hides a non-essential item", () => {
  const config = { version: 1, visible: ["/dashboard", "/journal"], hidden: [], order: ["/dashboard", "/journal"] };
  const result = toggleSidebarItemVisibility(config, "/journal");
  assert.ok(!result.visible.includes("/journal"));
  assert.ok(result.hidden.includes("/journal"));
});

test("toggleSidebarItemVisibility shows a hidden item", () => {
  const config = { version: 1, visible: ["/dashboard"], hidden: ["/journal"], order: ["/dashboard", "/journal"] };
  const result = toggleSidebarItemVisibility(config, "/journal");
  assert.ok(result.visible.includes("/journal"));
  assert.ok(!result.hidden.includes("/journal"));
});

test("toggleSidebarItemVisibility cannot hide essential items", () => {
  const config = { version: 1, visible: ["/dashboard", "/settings"], hidden: [], order: ["/dashboard", "/settings"] };
  const result = toggleSidebarItemVisibility(config, "/dashboard");
  assert.deepEqual(result, config);
});

test("toggleSidebarItemVisibility cannot hide /help", () => {
  const config = { version: 1, visible: ["/dashboard", "/help"], hidden: [], order: ["/dashboard", "/help"] };
  const result = toggleSidebarItemVisibility(config, "/help");
  assert.deepEqual(result, config);
});

test("toggleSidebarItemVisibility cannot hide /settings", () => {
  const config = { version: 1, visible: ["/dashboard", "/settings"], hidden: [], order: ["/dashboard", "/settings"] };
  const result = toggleSidebarItemVisibility(config, "/settings");
  assert.deepEqual(result, config);
});

// ─── Reordering ──────────────────────────────────────────────────────────────

test("moveSidebarItem up swaps positions within category", () => {
  // /sleep and /water are both in the Trackers category
  const config = { version: 1, visible: ["/sleep", "/water", "/stress"], hidden: [], order: ["/sleep", "/water", "/stress"] };
  const result = moveSidebarItem(config, "/water", "up");
  assert.deepEqual(result.order, ["/water", "/sleep", "/stress"]);
});

test("moveSidebarItem down swaps positions within category", () => {
  // /sleep and /water are both in the Trackers category
  const config = { version: 1, visible: ["/sleep", "/water", "/stress"], hidden: [], order: ["/sleep", "/water", "/stress"] };
  const result = moveSidebarItem(config, "/sleep", "down");
  assert.deepEqual(result.order, ["/water", "/sleep", "/stress"]);
});

test("moveSidebarItem cannot move across categories", () => {
  // /dashboard (Dashboard) and /chat (Support) are in different categories
  const config = { version: 1, visible: ["/dashboard", "/chat"], hidden: [], order: ["/dashboard", "/chat"] };
  const result = moveSidebarItem(config, "/chat", "up");
  // No change because /chat is already first in its category
  assert.deepEqual(result.order, ["/dashboard", "/chat"]);
});

test("moveSidebarItem handles hidden items in category", () => {
  // /sleep hidden, /water and /stress visible in Trackers
  const config = { version: 1, visible: ["/water", "/stress"], hidden: ["/sleep"], order: ["/sleep", "/water", "/stress"] };
  const result = moveSidebarItem(config, "/stress", "up");
  // /stress moves up past /water (both visible)
  assert.deepEqual(result.order, ["/sleep", "/stress", "/water"]);
});

test("moveSidebarItem at boundary does nothing", () => {
  const config = { version: 1, visible: ["/dashboard", "/chat"], hidden: [], order: ["/dashboard", "/chat"] };
  const result = moveSidebarItem(config, "/dashboard", "up");
  assert.deepEqual(result.order, ["/dashboard", "/chat"]);
});

test("moveSidebarItem unknown item does nothing", () => {
  const config = { version: 1, visible: ["/dashboard", "/chat"], hidden: [], order: ["/dashboard", "/chat"] };
  const result = moveSidebarItem(config, "/unknown" as any, "down");
  assert.deepEqual(result.order, ["/dashboard", "/chat"]);
});

// ─── Reset ───────────────────────────────────────────────────────────────────

test("resetSidebarConfig restores defaults", () => {
  const reset = resetSidebarConfig();
  assert.deepEqual(reset.visible, [...SIDEBAR_ITEM_IDS]);
  assert.deepEqual(reset.hidden, []);
  assert.deepEqual(reset.order, [...SIDEBAR_ITEM_IDS]);
  assert.equal(reset.version, 1);
});

// ─── Serialization ───────────────────────────────────────────────────────────

test("serializeSidebarConfig produces valid JSON", () => {
  const config = { version: 1, visible: ["/dashboard", "/chat"], hidden: ["/journal"], order: ["/dashboard", "/chat", "/journal"] };
  const json = serializeSidebarConfig(config);
  const parsed = JSON.parse(json);
  assert.deepEqual(parsed, config);
});

test("round-trip parse/serialize preserves data", () => {
  const original = { version: 1, visible: ["/dashboard", "/chat"], hidden: ["/journal"], order: ["/dashboard", "/chat", "/journal"] };
  const json = serializeSidebarConfig(original);
  const parsed = parseSidebarConfig(json);
  assert.ok(parsed.visible.includes("/dashboard"));
  assert.ok(parsed.visible.includes("/chat"));
  assert.ok(parsed.hidden.includes("/journal"));
});