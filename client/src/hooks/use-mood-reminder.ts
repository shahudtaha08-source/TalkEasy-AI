import { useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MOOD_REMINDER_MESSAGE } from "@shared/mood-reminder";

export interface MoodReminderStatus {
  enabled: boolean;
  intervalHours: number;
  timezone: string;
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
  lastCheckInAt: string | null;
  checkedInWithinInterval: boolean;
  nextReminderAt: string;
  message: string;
}

const REMINDER_KEY = ["/api/notifications/mood-reminder"];

export function useMoodReminder() {
  return useQuery<MoodReminderStatus>({
    queryKey: REMINDER_KEY,
    queryFn: async () => {
      const res = await fetch("/api/notifications/mood-reminder", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load mood reminder");
      return await res.json();
    },
    refetchInterval: 5 * 60 * 1000,
  });
}

/**
 * Schedules an in-app browser notification for the next mood check-in.
 *
 * Scope is deliberate and honest: this only fires while a TalkEasy tab is open
 * and notifications are granted. It never claims background/closed-app delivery
 * (that is handled by the Web Push service worker when subscribed). When a
 * background push subscription is active this timer stands down, so the user is
 * not nudged twice for the same slot. Missed reminders are not replayed in a
 * burst — a single future timer is set, and the server-derived `nextReminderAt`
 * already collapses missed slots.
 */
export function useMoodReminderScheduler(status: MoodReminderStatus | undefined) {
  const queryClient = useQueryClient();
  const firedFor = useRef<string | null>(null);

  useEffect(() => {
    if (!status) return;
    if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
    if (!status.enabled) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const schedule = async () => {
      // If background Web Push is active, let the service worker handle it.
      try {
        if (navigator.serviceWorker) {
          const reg = await navigator.serviceWorker.getRegistration();
          const sub = reg ? await reg.pushManager.getSubscription() : null;
          if (sub) return;
        }
      } catch {
        /* fall through to the in-tab timer */
      }
      if (cancelled) return;

      const target = new Date(status.nextReminderAt).getTime();
      if (Number.isNaN(target)) return;

      const now = Date.now();
      // Cap the timer at the max a browser setTimeout can reliably hold (~24.8 days).
      const delay = Math.min(Math.max(target - now, 0), 2_147_483_000);

      timer = setTimeout(async () => {
        const fireKey = status.nextReminderAt;
        if (firedFor.current === fireKey) return;
        firedFor.current = fireKey;
        try {
          new Notification("TalkEasy", { body: MOOD_REMINDER_MESSAGE, tag: "talkeasy-mood" });
        } catch {
          /* notification construction can throw if the platform refuses it */
        }
        try {
          await fetch("/api/notifications/mood-reminder", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ nextReminderAt: status.nextReminderAt, lastNotifiedAt: new Date().toISOString() }),
          });
        } catch {
          /* recording is best-effort; the next refetch recomputes the schedule */
        }
        queryClient.invalidateQueries({ queryKey: REMINDER_KEY });
      }, delay);
    };

    schedule();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [status, queryClient]);
}
