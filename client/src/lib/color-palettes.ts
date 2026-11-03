/**
 * TalkEasy v6.5.0 — Theme color palette definitions.
 *
 * Preset palettes that override the accent (primary) color. Applied as a
 * data attribute on the document element: `data-palette="teal|blue|..."`.
 * CSS variables in index.css define the overrides for each palette.
 */

export type AccentPalette = "teal" | "blue" | "green" | "purple" | "rose" | "amber";

export const ACCENT_PALETTES: { key: AccentPalette; label: string; color: string }[] = [
  { key: "teal", label: "Teal", color: "hsl(170 52% 44%)" },
  { key: "blue", label: "Blue", color: "hsl(210 80% 50%)" },
  { key: "green", label: "Green", color: "hsl(140 60% 45%)" },
  { key: "purple", label: "Purple", color: "hsl(270 60% 55%)" },
  { key: "rose", label: "Rose", color: "hsl(350 70% 55%)" },
  { key: "amber", label: "Amber", color: "hsl(40 80% 50%)" },
];

export function applyPalette(palette: AccentPalette): void {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-palette", palette);
  try {
    localStorage.setItem("talkeasy_palette", palette);
  } catch {
    /* storage unavailable */
  }
}

export function readStoredPalette(): AccentPalette {
  if (typeof window === "undefined") return "teal";
  try {
    const raw = localStorage.getItem("talkeasy_palette");
    if (raw && ACCENT_PALETTES.some((p) => p.key === raw)) {
      return raw as AccentPalette;
    }
  } catch {
    /* storage unavailable */
  }
  return "teal";
}