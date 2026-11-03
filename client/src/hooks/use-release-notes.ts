/**
 * TalkEasy release-notes hook.
 *
 * Tracks which release versions the user has acknowledged so the "What's New"
 * announcement is shown once per new version and never repeatedly. The
 * release content itself lives in `client/src/lib/release-notes.ts`.
 */

import * as React from "react";
import { getLatestReleaseNotes } from "../lib/release-notes";

const ACKNOWLEDGED_KEY = "talkeasy_acknowledged_versions";

/**
 * Current TalkEasy application version. Keep in sync with package.json and
 * the service worker cache version when releasing.
 */
export const APP_VERSION = "6.4.0";

function readAcknowledged(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(ACKNOWLEDGED_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.filter((v) => typeof v === "string");
  } catch {
    /* storage unavailable */
  }
  return [];
}

function writeAcknowledged(versions: string[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(ACKNOWLEDGED_KEY, JSON.stringify(versions));
  } catch {
    /* storage unavailable */
  }
}

export function useReleaseNotes() {
  const [acknowledged, setAcknowledged] = React.useState<string[]>(() =>
    readAcknowledged(),
  );

  const latest = getLatestReleaseNotes();
  const isLatestAcknowledged = latest
    ? acknowledged.includes(latest.version)
    : true;

  /**
   * Whether the "What's New" announcement should be shown. It is shown for the
   * newest shipped release until the user acknowledges it. This covers both
   * updates from an older version and first-time installs of a new release. It
   * never announces a version that isn't present in `RELEASE_NOTES`.
   */
  const shouldShowAnnouncement = Boolean(latest && !isLatestAcknowledged);

  const acknowledge = (version: string) => {
    const next = Array.from(new Set([...acknowledged, version]));
    setAcknowledged(next);
    writeAcknowledged(next);
  };

  return {
    appVersion: APP_VERSION,
    latest,
    acknowledged,
    shouldShowAnnouncement,
    acknowledge,
    isLatestAcknowledged,
  };
}
