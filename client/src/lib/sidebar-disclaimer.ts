/**
 * Local (device-only) state for the informational sidebar disclaimer.
 *
 * This is NOT used for safety/crisis alerts — only for the static
 * "TalkEasy supports emotional wellbeing..." note at the bottom of the sidebar.
 * Nothing sensitive is stored, only a boolean flag.
 */
export const SIDEBAR_DISCLAIMER_KEY = "talkeasy_sidebar_disclaimer_dismissed";
export const SIDEBAR_DISCLAIMER_RESET_EVENT = "talkeasy:sidebar-disclaimer-reset";

export function isSidebarDisclaimerDismissed(): boolean {
  try {
    return localStorage.getItem(SIDEBAR_DISCLAIMER_KEY) === "true";
  } catch {
    return false;
  }
}

export function setSidebarDisclaimerDismissed(dismissed: boolean): void {
  try {
    if (dismissed) {
      localStorage.setItem(SIDEBAR_DISCLAIMER_KEY, "true");
    } else {
      localStorage.removeItem(SIDEBAR_DISCLAIMER_KEY);
    }
  } catch {
    /* storage unavailable — disclaimer simply stays visible */
  }
}

/** Restore the disclaimer (e.g. from Settings) and notify open sidebars. */
export function restoreSidebarDisclaimer(): void {
  setSidebarDisclaimerDismissed(false);
  try {
    window.dispatchEvent(new Event(SIDEBAR_DISCLAIMER_RESET_EVENT));
  } catch {
    /* non-browser environment */
  }
}
