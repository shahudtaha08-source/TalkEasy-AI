/**
 * TalkEasy v6.5.0 — User preference validation (shared, pure, testable).
 *
 * Zod schemas for validating user preference payloads. Used by both the
 * server (PUT /api/user-preferences) and tests.
 */

import { z } from "zod";

export const VALID_THEMES = ["light", "dark", "system"] as const;
export const VALID_PALETTES = ["teal", "blue", "green", "purple", "rose", "amber"] as const;

export const userPreferenceUpdateSchema = z.object({
  theme: z.enum(VALID_THEMES).optional(),
  accentPalette: z.enum(VALID_PALETTES).optional(),
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).nullable().optional(),
  backgroundColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).nullable().optional(),
  surfaceColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).nullable().optional(),
  dashboardLayout: z.string().refine((v) => {
    try { const p = JSON.parse(v); return typeof p === "object" && p !== null && !Array.isArray(p); } catch { return false; }
  }, "dashboardLayout must be valid JSON object").optional(),
  sidebarConfig: z.string().refine((v) => {
    try { const p = JSON.parse(v); return typeof p === "object" && p !== null && !Array.isArray(p); } catch { return false; }
  }, "sidebarConfig must be valid JSON object").optional(),
  homeShortcuts: z.string().refine((v) => {
    try { const p = JSON.parse(v); return typeof p === "object" && p !== null && !Array.isArray(p); } catch { return false; }
  }, "homeShortcuts must be valid JSON object").optional(),
});

export type UserPreferenceUpdate = z.infer<typeof userPreferenceUpdateSchema>;

export const DEFAULT_USER_PREFERENCES = {
  theme: "system" as const,
  accentPalette: "teal" as const,
  accentColor: null,
  backgroundColor: null,
  surfaceColor: null,
  dashboardLayout: "{}",
  sidebarConfig: "{}",
  homeShortcuts: "{}",
};