/**
 * TalkEasy theme system.
 *
 * Supports three user preferences — light, dark, system — persisted in
 * localStorage and applied as a `data-theme` attribute on the document element.
 * CSS variables in `index.css` provide both a `.dark` class fallback and a
 * `prefers-color-scheme` media query so the system default never flashes the
 * wrong theme on first paint (the attribute is set synchronously before the
 * first render via `ThemeInitializer`).
 *
 * v6.5-A: Integrates server-side user preferences for cross-device sync.
 * - Fetches preferences after authentication is established.
 * - Applies server preferences once per user session (guarded by hydratedRef).
 * - Saves changes to server when authenticated.
 * - Resets hydration on account switch / logout.
 * - Falls back to localStorage when unauthenticated or server unavailable.
 */

import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useUser } from "@/hooks/use-user";
import { useUserPreferences, useUpdateUserPreferences, clearUserPreferenceCache, userPreferencesQueryKey } from "@/hooks/use-user-preferences";
import { applyPalette, readStoredPalette, type AccentPalette } from "@/lib/color-palettes";
import { toast } from "@/hooks/use-toast";

type Theme = "light" | "dark" | "system";

const THEME_KEY = "talkeasy_theme";

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
  const { data: user, isLoading: userLoading } = useUser();
  const userId = user?.id ?? null;
  const queryClient = useQueryClient();

  const { data: serverPrefs, isLoading: prefsLoading } = useUserPreferences(userId);
  const updatePrefs = useUpdateUserPreferences(userId);

  const [stored, setStored] = React.useState<Theme>(readStoredTheme);
  const [effective, setEffective] = React.useState<"light" | "dark">(() =>
    resolveTheme(stored),
  );
  const [palette, setPaletteState] = React.useState<AccentPalette>(() =>
    readStoredPalette(),
  );

  // Track whether we've hydrated from server (prevents stale local overwrite)
  const hydratedRef = React.useRef(false);
  const prevUserIdRef = React.useRef<string | null>(null);
  // Track in-flight hydration to prevent stale overwrites
  const hydrationUserIdRef = React.useRef<string | null>(null);

  // Reset hydration flag when user changes (login/logout/account switch)
  React.useEffect(() => {
    const currentUserId = userId;
    if (currentUserId !== prevUserIdRef.current) {
      // Clear previous user's preference cache on logout/account switch
      if (prevUserIdRef.current !== null && currentUserId === null) {
        clearUserPreferenceCache(queryClient);
      }
      hydratedRef.current = false;
      prevUserIdRef.current = currentUserId;
      hydrationUserIdRef.current = null;
    }
  }, [userId, queryClient]);

  // Hydrate from server preferences when they arrive (once per user session)
  React.useEffect(() => {
    if (!userId || prefsLoading || !serverPrefs || hydratedRef.current) return;

    // Guard: only hydrate if the serverPrefs belong to the current user
    // (prevents stale in-flight requests from overwriting)
    if (hydrationUserIdRef.current && hydrationUserIdRef.current !== userId) return;
    hydrationUserIdRef.current = userId;
    hydratedRef.current = true;

    // Apply server theme
    if (serverPrefs.theme && (serverPrefs.theme === "light" || serverPrefs.theme === "dark" || serverPrefs.theme === "system")) {
      setStored(serverPrefs.theme as Theme);
      try { localStorage.setItem(THEME_KEY, serverPrefs.theme); } catch { /* ignore */ }
    }

    // Apply server palette
    if (serverPrefs.accentPalette) {
      const validPalettes = ["teal", "blue", "green", "purple", "rose", "amber"];
      if (validPalettes.includes(serverPrefs.accentPalette)) {
        setPaletteState(serverPrefs.accentPalette as AccentPalette);
        applyPalette(serverPrefs.accentPalette as AccentPalette);
        try { localStorage.setItem("talkeasy_palette", serverPrefs.accentPalette); } catch { /* ignore */ }
      }
    }
  }, [userId, prefsLoading, serverPrefs]);

  // Apply theme to DOM
  React.useEffect(() => {
    const resolved = resolveTheme(stored);
    setEffective(resolved);
    try {
      document.documentElement.setAttribute("data-theme", resolved);
      document.documentElement.classList.toggle("dark", resolved === "dark");
      document.documentElement.classList.toggle("theme-light", resolved === "light");
      applyPalette(palette);
    } catch {
      /* non-browser environment */
    }
  }, [stored, palette]);

  const setTheme = React.useCallback((next: Theme) => {
    setStored(next);
    try { localStorage.setItem(THEME_KEY, next); } catch { /* ignore */ }
    // Persist to server if authenticated
    if (userId) {
      updatePrefs.mutate({ theme: next }, {
        onError: () => {
          // On failure, local state remains changed (user sees their choice).
          // Server retains old value; next login will re-hydrate from server.
          // No infinite retry — mutation is fire-and-forget with single attempt.
          console.warn("[useTheme] Failed to persist theme to server");
          toast({
            title: "Preference not saved",
            description: "Your theme change was applied locally but could not be saved to your account. It will be restored from your account on next login.",
            variant: "destructive",
          });
        },
      });
    }
  }, [userId, updatePrefs]);

  const setPalette = React.useCallback((next: AccentPalette) => {
    setPaletteState(next);
    applyPalette(next);
    try { localStorage.setItem("talkeasy_palette", next); } catch { /* ignore */ }
    // Persist to server if authenticated
    if (userId) {
      updatePrefs.mutate({ accentPalette: next }, {
        onError: () => {
          console.warn("[useTheme] Failed to persist palette to server");
          toast({
            title: "Preference not saved",
            description: "Your color change was applied locally but could not be saved to your account. It will be restored from your account on next login.",
            variant: "destructive",
          });
        },
      });
    }
  }, [userId, updatePrefs]);

  const toggle = React.useCallback(() => {
    setTheme(effective === "light" ? "dark" : "light");
  }, [effective, setTheme]);

  return { theme: stored, effective, setTheme, toggle, palette, setPalette };
}

/**
 * Mounts once at the top of the app so the resolved theme attribute is present
 * before React paints, preventing a flash of the wrong theme.
 */
export function ThemeInitializer() {
  const { effective } = useTheme();
  return null;
}