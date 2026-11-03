import { test } from "node:test";
import assert from "node:assert/strict";
import {
  userPreferenceUpdateSchema,
  VALID_THEMES,
  VALID_PALETTES,
  DEFAULT_USER_PREFERENCES,
} from "../shared/user-preferences";

// ─── Valid theme values ──────────────────────────────────────────────────────

test("accepts valid theme: light", () => {
  const result = userPreferenceUpdateSchema.safeParse({ theme: "light" });
  assert.equal(result.success, true);
});

test("accepts valid theme: dark", () => {
  const result = userPreferenceUpdateSchema.safeParse({ theme: "dark" });
  assert.equal(result.success, true);
});

test("accepts valid theme: system", () => {
  const result = userPreferenceUpdateSchema.safeParse({ theme: "system" });
  assert.equal(result.success, true);
});

test("rejects invalid theme: foo", () => {
  const result = userPreferenceUpdateSchema.safeParse({ theme: "foo" });
  assert.equal(result.success, false);
});

test("rejects invalid theme: empty string", () => {
  const result = userPreferenceUpdateSchema.safeParse({ theme: "" });
  assert.equal(result.success, false);
});

test("rejects invalid theme: number", () => {
  const result = userPreferenceUpdateSchema.safeParse({ theme: 123 });
  assert.equal(result.success, false);
});

// ─── Valid palette values ────────────────────────────────────────────────────

for (const palette of VALID_PALETTES) {
  test(`accepts valid palette: ${palette}`, () => {
    const result = userPreferenceUpdateSchema.safeParse({ accentPalette: palette });
    assert.equal(result.success, true);
  });
}

test("rejects invalid palette: neon", () => {
  const result = userPreferenceUpdateSchema.safeParse({ accentPalette: "neon" });
  assert.equal(result.success, false);
});

test("rejects invalid palette: empty string", () => {
  const result = userPreferenceUpdateSchema.safeParse({ accentPalette: "" });
  assert.equal(result.success, false);
});

// ─── Custom color validation ─────────────────────────────────────────────────

test("accepts valid hex color: #ff0000", () => {
  const result = userPreferenceUpdateSchema.safeParse({ accentColor: "#ff0000" });
  assert.equal(result.success, true);
});

test("accepts valid hex color: #ABCDEF", () => {
  const result = userPreferenceUpdateSchema.safeParse({ accentColor: "#ABCDEF" });
  assert.equal(result.success, true);
});

test("accepts null for accentColor (clear override)", () => {
  const result = userPreferenceUpdateSchema.safeParse({ accentColor: null });
  assert.equal(result.success, true);
});

test("rejects invalid hex color: ff0000 (no hash)", () => {
  const result = userPreferenceUpdateSchema.safeParse({ accentColor: "ff0000" });
  assert.equal(result.success, false);
});

test("rejects invalid hex color: #fff (short)", () => {
  const result = userPreferenceUpdateSchema.safeParse({ accentColor: "#fff" });
  assert.equal(result.success, false);
});

test("rejects invalid hex color: #gggggg", () => {
  const result = userPreferenceUpdateSchema.safeParse({ accentColor: "#gggggg" });
  assert.equal(result.success, false);
});

test("accepts valid backgroundColor hex", () => {
  const result = userPreferenceUpdateSchema.safeParse({ backgroundColor: "#1a1a2e" });
  assert.equal(result.success, true);
});

test("accepts null for backgroundColor", () => {
  const result = userPreferenceUpdateSchema.safeParse({ backgroundColor: null });
  assert.equal(result.success, true);
});

test("rejects invalid backgroundColor", () => {
  const result = userPreferenceUpdateSchema.safeParse({ backgroundColor: "red" });
  assert.equal(result.success, false);
});

test("accepts valid surfaceColor hex", () => {
  const result = userPreferenceUpdateSchema.safeParse({ surfaceColor: "#ffffff" });
  assert.equal(result.success, true);
});

// ─── JSON field validation ───────────────────────────────────────────────────

test("accepts valid JSON object for dashboardLayout", () => {
  const result = userPreferenceUpdateSchema.safeParse({ dashboardLayout: '{"order":["a","b"]}' });
  assert.equal(result.success, true);
});

test("accepts empty object JSON for dashboardLayout", () => {
  const result = userPreferenceUpdateSchema.safeParse({ dashboardLayout: "{}" });
  assert.equal(result.success, true);
});

test("rejects invalid JSON for dashboardLayout", () => {
  const result = userPreferenceUpdateSchema.safeParse({ dashboardLayout: "not json" });
  assert.equal(result.success, false);
});

test("rejects JSON array for dashboardLayout (must be object)", () => {
  const result = userPreferenceUpdateSchema.safeParse({ dashboardLayout: "[1,2,3]" });
  assert.equal(result.success, false);
});

test("rejects JSON string for dashboardLayout (must be object)", () => {
  const result = userPreferenceUpdateSchema.safeParse({ dashboardLayout: '"hello"' });
  assert.equal(result.success, false);
});

test("accepts valid JSON for sidebarConfig", () => {
  const result = userPreferenceUpdateSchema.safeParse({ sidebarConfig: '{"visible":["dashboard"]}' });
  assert.equal(result.success, true);
});

test("rejects invalid JSON for sidebarConfig", () => {
  const result = userPreferenceUpdateSchema.safeParse({ sidebarConfig: "{bad" });
  assert.equal(result.success, false);
});

test("accepts valid JSON for homeShortcuts", () => {
  const result = userPreferenceUpdateSchema.safeParse({ homeShortcuts: '{"shortcuts":[]}' });
  assert.equal(result.success, true);
});

test("rejects invalid JSON for homeShortcuts", () => {
  const result = userPreferenceUpdateSchema.safeParse({ homeShortcuts: "undefined" });
  assert.equal(result.success, false);
});

// ─── Combined valid payload ──────────────────────────────────────────────────

test("accepts full valid payload", () => {
  const result = userPreferenceUpdateSchema.safeParse({
    theme: "dark",
    accentPalette: "blue",
    accentColor: "#1a1a2e",
    backgroundColor: "#0f0f23",
    surfaceColor: "#16213e",
    dashboardLayout: '{"widgets":["mood","habits"]}',
    sidebarConfig: '{"order":["dashboard","chat"]}',
    homeShortcuts: '{"visible":["mood","journal"]}',
  });
  assert.equal(result.success, true);
});

test("accepts empty payload (all optional)", () => {
  const result = userPreferenceUpdateSchema.safeParse({});
  assert.equal(result.success, true);
});

test("accepts null payload treated as empty", () => {
  const result = userPreferenceUpdateSchema.safeParse(null);
  // zod object with all optional: null is not an object, so should fail
  assert.equal(result.success, false);
});

// ─── Defaults ────────────────────────────────────────────────────────────────

test("DEFAULT_USER_PREFERENCES has safe defaults", () => {
  assert.equal(DEFAULT_USER_PREFERENCES.theme, "system");
  assert.equal(DEFAULT_USER_PREFERENCES.accentPalette, "teal");
  assert.equal(DEFAULT_USER_PREFERENCES.accentColor, null);
  assert.equal(DEFAULT_USER_PREFERENCES.backgroundColor, null);
  assert.equal(DEFAULT_USER_PREFERENCES.surfaceColor, null);
  assert.equal(DEFAULT_USER_PREFERENCES.dashboardLayout, "{}");
  assert.equal(DEFAULT_USER_PREFERENCES.sidebarConfig, "{}");
  assert.equal(DEFAULT_USER_PREFERENCES.homeShortcuts, "{}");
});

test("VALID_THEMES contains exactly light, dark, system", () => {
  assert.deepEqual([...VALID_THEMES], ["light", "dark", "system"]);
});

test("VALID_PALETTES contains exactly 6 palettes", () => {
  assert.equal(VALID_PALETTES.length, 6);
  assert.ok(VALID_PALETTES.includes("teal"));
  assert.ok(VALID_PALETTES.includes("amber"));
});