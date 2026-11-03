/**
 * TalkEasy theme system.
 *
 * Supports three user preferences — light, dark, system — persisted in
 * localStorage and applied as a `data-theme` attribute on the document element.
 * CSS variables in `index.css` provide both a `.dark` class fallback and a
 * `prefers-color-scheme` media query so the system default never flashes the
 * wrong theme on first paint (the attribute is set synchronously before the
 * first render via `ThemeInitializer`).
 */

import * as React from "react";

type Theme = "light" | "dark" | "system";

const THEME_KEY = "talkeasy_theme";

/**
 * Reads the persisted theme preference. In non-browser environments (SSR /
 * tests without `window`) we default to "system" so the caller can resolve
 * against the actual environment.
 */
function readStoredTheme(): Theme {
  if (typeof window === "undefined") return "system";
  try {
    const raw = localStorage.getItem(THEME_KEY);
    if (raw === "light" || raw === "dark" || raw === "system") return raw;
  } catch {
    /* storage unavailable — fall back to system */
  }
  return "system";
}

function resolveTheme(stored: Theme): "light" | "dark" {
  if (stored === "system") {
    if (typeof window === "undefined") return "light";
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
  return stored;
}

export function useTheme() {
  const [stored, setStored] = React.useState<Theme>(readStoredTheme);
  const [effective, setEffective] = React.useState<"light" | "dark">(() =>
    resolveTheme(stored),
  );

  React.useEffect(() => {
    const resolved = resolveTheme(stored);
    setEffective(resolved);
    try {
      document.documentElement.setAttribute("data-theme", resolved);
      document.documentElement.classList.toggle("dark", resolved === "dark");
    } catch {
      /* non-browser environment */
    }
  }, [stored]);

  const setTheme = (next: Theme) => {
    setStored(next);
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      /* storage unavailable — preference lives only for this session */
    }
  };

  const toggle = React.useCallback(() => {
    setTheme(effective === "light" ? "dark" : "light");
  }, [effective]);

  return { theme: stored, effective, setTheme, toggle };
}

/**
 * Mounts once at the top of the app so the resolved theme attribute is present
 * before React paints, preventing a flash of the wrong theme.
 */
export function ThemeInitializer() {
  const { effective } = useTheme();
  return null;
}
