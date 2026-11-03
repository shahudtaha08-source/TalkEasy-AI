/**
 * TalkEasy release notes.
 *
 * Release content is kept separate from application logic here so future
 * releases (6.5, 6.6, 6.7, 7.x ...) can add a new entry to `RELEASE_NOTES`
 * without touching any UI or hook code. Entries are ordered newest first.
 *
 * Each entry must include a `version` that matches a real deployed release.
 * Never fabricate an entry for a version that has not been shipped.
 */

export interface ReleaseNotesSection {
  title: string;
  items: string[];
}

export interface ReleaseNotesEntry {
  /** Semantic version of the release (e.g. "6.4.0"). */
  version: string;
  /** Human-readable release date (ISO). */
  date: string;
  /** Banner/heading shown in the announcement. */
  title: string;
  /** Organized sections. */
  sections: ReleaseNotesSection[];
}

export const RELEASE_NOTES: ReleaseNotesEntry[] = [
  {
    version: "6.4.0",
    date: "2026-11-02",
    title: "What's New in TalkEasy 6.4?",
    sections: [
      {
        title: "New Features",
        items: [
          "New warm beige and soft cream visual theme with Light, Dark and System-default modes.",
          "Reorganized sidebar with a dedicated Trackers category (Mood, Sleep, Stress, Exercise, Water, Habits).",
          "New Exercise tracker page for logging phone-tracked activity sessions (camera recognition is not part of this release).",
        ],
      },
      {
        title: "Improvements",
        items: [
          "Consistent navigation with clear categories and active states.",
          "Appearance selector in Settings to choose your preferred theme.",
        ],
      },
      {
        title: "Bug Fixes",
        items: [
          "Resolved duplicate mood tracker navigation — the dashboard and sidebar now open the same experience.",
        ],
      },
    ],
  },
];

/**
 * Returns the newest release notes entry (the most recent shipped version).
 */
export function getLatestReleaseNotes(): ReleaseNotesEntry | undefined {
  return RELEASE_NOTES[0];
}

/**
 * Returns the entry for a specific version, if it exists.
 */
export function getReleaseNotes(version: string): ReleaseNotesEntry | undefined {
  return RELEASE_NOTES.find((e) => e.version === version);
}
