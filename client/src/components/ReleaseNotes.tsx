/**
 * TalkEasy "What's New" release-notes UI.
 *
 * Two parts:
 *   1. A non-blocking announcement banner shown when a new release is
 *      available and not yet acknowledged. Dismissing acknowledges the release
 *      so it is never shown again.
 *   2. A dialog with the full, sectioned release notes for the current and any
 *      previous versions. Reachable from Settings so users can revisit notes.
 *
 * Release content lives in `client/src/lib/release-notes.ts`; this component
 * only renders it.
 */

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useReleaseNotes } from "@/hooks/use-release-notes";
import { RELEASE_NOTES, type ReleaseNotesEntry } from "@/lib/release-notes";
import { useTranslation } from "@/i18n/LanguageContext";
import { Rocket, Trophy } from "lucide-react";

interface ReleaseNotesProps {
  /** When true, render the full notes dialog instead of the announcement banner. */
  full?: boolean;
}

export function ReleaseNotes({ full = false }: ReleaseNotesProps) {
  const { t } = useTranslation();
  const {
    shouldShowAnnouncement,
    acknowledge,
    latest,
  } = useReleaseNotes();
  const [dialogOpen, setDialogOpen] = React.useState(false);

  // Banner: only render when there is something to announce.
  if (!full && !shouldShowAnnouncement && !dialogOpen) return null;

  const openDialog = () => setDialogOpen(true);

  return (
    <div>
      {/* Non-blocking announcement banner (shown once per new release). */}
      {!full && shouldShowAnnouncement && latest && (
        <div className="fixed bottom-4 left-4 right-4 sm:bottom-6 sm:left-auto sm:right-6 sm:w-80 lg:w-96 z-50">
          <div className="bg-card border border-background rounded-2xl p-4 shadow-lg shadow-teal-900/10 flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <Rocket className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {t("whatsNewTitle", { version: latest.version })}
              </h3>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {t("whatsNewDesc")}
              </p>
            </div>
            <div className="flex items-end gap-2">
              <Button
                size="sm"
                onClick={() => acknowledge(latest.version)}
                className="text-xs py-1.5 px-3"
              >
                {t("dismiss")}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={openDialog}
                className="text-xs py-1.5 px-3"
              >
                {t("viewNotes")}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Full-mode trigger button (shown in Settings so users can revisit notes). */}
      {full && (
        <Button variant="outline" size="sm" onClick={openDialog}>
          {t("viewNotes")}
        </Button>
      )}

      {/* Full release-notes dialog. */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{t("whatsNew")}</DialogTitle>
            <DialogDescription>{t("whatsNewDesc")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 pt-4">
            {RELEASE_NOTES.map((entry: ReleaseNotesEntry) => (
              <section key={entry.version} className="space-y-2">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-teal-600" />
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">
                    TalkEasy {entry.version}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    · {entry.date}
                  </span>
                </div>
                {entry.sections.map((section) => (
                  <div key={section.title} className="space-y-1">
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      {section.title}
                    </h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-slate-700 dark:text-slate-300">
                      {section.items.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </section>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="w-full">
              {t("done")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {full && (
        <p className="text-xs text-center text-muted-foreground mt-4">
          {t("appVersionLabel", { version: "6.4.0" })}
        </p>
      )}
    </div>
  );
}
