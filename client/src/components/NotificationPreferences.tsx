import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, BellRing, Brain, HeartPulse, Loader2, Save, Info } from "lucide-react";
import type {
  NotificationCategoryConfig,
  NotificationPreferences,
  NotificationSource,
} from "@shared/notifications";
import { useTranslation } from "@/i18n/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import {
  getWebPushConfig,
  getWebPushState,
  subscribeToWebPush,
  unsubscribeFromWebPush,
  type WebPushState,
} from "@/lib/web-push";

type PrefsResponse = NotificationPreferences & { pushConfigured?: boolean; webPushConfigured?: boolean };

const PREFS_KEY = ["/api/notifications/preferences"];

function notificationSupport(): "unsupported" | NotificationPermission {
  return typeof Notification === "undefined" ? "unsupported" : Notification.permission;
}

export function NotificationPreferencesCard() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [browserPermission, setBrowserPermission] = useState<"unsupported" | NotificationPermission>(notificationSupport());
  const [webPushState, setWebPushState] = useState<WebPushState>("unsupported");
  const [webPushConfigured, setWebPushConfigured] = useState(false);
  const [webPushBusy, setWebPushBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [config, state] = await Promise.all([getWebPushConfig(), getWebPushState()]);
      if (cancelled) return;
      setWebPushConfigured(config.configured);
      setWebPushState(state);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const { data, isLoading } = useQuery<PrefsResponse>({
    queryKey: PREFS_KEY,
    queryFn: async () => {
      const res = await fetch("/api/notifications/preferences", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load notification preferences");
      return await res.json();
    },
  });

  const [draft, setDraft] = useState<PrefsResponse | null>(null);
  useEffect(() => {
    if (data && !draft) setDraft(data);
  }, [data, draft]);

  const save = useMutation({
    mutationFn: async (payload: PrefsResponse) => {
      const res = await fetch("/api/notifications/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          timezone: payload.timezone,
          quietHoursStart: payload.quietHoursStart,
          quietHoursEnd: payload.quietHoursEnd,
          categories: payload.categories,
        }),
      });
      if (!res.ok) throw new Error("Failed to save notification preferences");
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PREFS_KEY });
      toast({ title: t("saveSettings"), description: "Notification preferences saved." });
    },
    onError: () => toast({ title: "Error", description: "Could not save notification preferences." }),
  });

  const toggle = (key: string) => {
    if (!draft) return;
    const cat = draft.categories[key];
    setDraft({
      ...draft,
      categories: { ...draft.categories, [key]: { ...cat, enabled: !cat.enabled } },
    });
  };

  const setTime = (key: string, time: string) => {
    if (!draft) return;
    const cat = draft.categories[key];
    setDraft({ ...draft, categories: { ...draft.categories, [key]: { ...cat, time } } });
  };

  const requestBrowserPermission = async () => {
    if (typeof Notification === "undefined") {
      setBrowserPermission("unsupported");
      return;
    }
    try {
      const result = await Notification.requestPermission();
      setBrowserPermission(result);
      if (result === "granted") {
        toast({ title: "Browser reminders enabled", description: "You will be nudged for mood check-ins while TalkEasy is open." });
      } else if (result === "denied") {
        toast({ title: "Reminders blocked", description: "Your browser blocked notifications. You can re-enable them in browser settings.", variant: "destructive" });
      }
    } catch {
      setBrowserPermission("unsupported");
    }
  };

  const enableBackgroundReminders = async () => {
    setWebPushBusy(true);
    try {
      const result = await subscribeToWebPush();
      if (result.ok) {
        setWebPushState("subscribed");
        toast({ title: "Background reminders enabled", description: "You will be nudged even when TalkEasy is closed." });
      } else if (result.reason === "permission-denied") {
        toast({ title: "Reminders blocked", description: "Your browser blocked notifications. Re-enable them in browser settings.", variant: "destructive" });
      } else if (result.reason === "server-not-configured") {
        toast({ title: "Not available yet", description: "Background push is not configured on the server.", variant: "destructive" });
      } else if (result.reason === "unsupported") {
        toast({ title: "Not supported", description: "This browser cannot receive background notifications.", variant: "destructive" });
      } else {
        toast({ title: "Could not enable", description: "Subscribing to background reminders failed. Please try again.", variant: "destructive" });
      }
    } finally {
      setWebPushBusy(false);
    }
  };

  const disableBackgroundReminders = async () => {
    setWebPushBusy(true);
    const ok = await unsubscribeFromWebPush();
    setWebPushBusy(false);
    if (ok) {
      setWebPushState("unsubscribed");
      toast({ title: "Background reminders off" });
    } else {
      toast({ title: "Error", description: "Could not turn off background reminders.", variant: "destructive" });
    }
  };

  const renderSource = (source: NotificationSource, title: string, icon: React.ReactNode, tint: string) => {
    if (!draft) return null;
    const cats: NotificationCategoryConfig[] = Object.values(draft.categories).filter((c) => c.source === source);
    return (
      <div className="space-y-2">
        <div className={`flex items-center gap-2 font-semibold text-sm ${tint}`}>
          {icon} {title}
        </div>
        {cats.map((cat) => (
          <div
            key={cat.key}
            className="flex items-center justify-between gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl"
          >
            <label className="flex items-center gap-3 flex-1 cursor-pointer">
              <input
                type="checkbox"
                checked={cat.enabled}
                onChange={() => toggle(cat.key)}
                className="w-4 h-4 accent-teal-600"
              />
              <span className="text-sm text-slate-800 dark:text-slate-200">{cat.label}</span>
            </label>
            {cat.frequency === "interval" && cat.intervalHours && (
              <span className="text-xs text-muted-foreground whitespace-nowrap">every {cat.intervalHours}h</span>
            )}
            {cat.time && cat.enabled && (
              <input
                type="time"
                value={cat.time}
                onChange={(e) => setTime(cat.key, e.target.value)}
                className="text-xs px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200"
              />
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <section className="glass-card rounded-3xl p-8 space-y-6">
      <h2 className="font-bold text-base text-slate-700 dark:text-slate-300 flex items-center gap-2">
        <Bell className="w-4 h-4 text-teal-600" /> Notifications
      </h2>

      {isLoading || !draft ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading notification preferences…
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <label className="text-xs text-muted-foreground">
              Timezone
              <input
                type="text"
                value={draft.timezone}
                onChange={(e) => setDraft({ ...draft, timezone: e.target.value })}
                placeholder="e.g. Asia/Kolkata"
                className="mt-1 w-full text-sm px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
              />
            </label>
            <label className="text-xs text-muted-foreground">
              Quiet hours start
              <input
                type="time"
                value={draft.quietHoursStart || ""}
                onChange={(e) => setDraft({ ...draft, quietHoursStart: e.target.value })}
                className="mt-1 w-full text-sm px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
              />
            </label>
            <label className="text-xs text-muted-foreground">
              Quiet hours end
              <input
                type="time"
                value={draft.quietHoursEnd || ""}
                onChange={(e) => setDraft({ ...draft, quietHoursEnd: e.target.value })}
                className="mt-1 w-full text-sm px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
              />
            </label>
          </div>

          {renderSource("wellness", t("navWellnessInsights"), <Brain className="w-4 h-4" />, "text-teal-600")}
          {renderSource("wearable", t("navWearableInsights"), <HeartPulse className="w-4 h-4" />, "text-rose-600")}

          {/* Background reminders via Web Push — fire even when the tab is closed. */}
          <div className="flex items-center justify-between gap-3 p-3 bg-teal-50/60 dark:bg-teal-900/20 rounded-xl border border-teal-100 dark:border-teal-900/40">
            <div className="flex items-start gap-2">
              <BellRing className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Background reminders</p>
                <p className="text-xs text-muted-foreground">
                  {webPushState === "unsupported"
                    ? "This browser does not support background notifications. Reminders appear while TalkEasy is open below."
                    : !webPushConfigured
                    ? "Background delivery is not configured on the server yet, so reminders only appear while TalkEasy is open."
                    : webPushState === "subscribed"
                    ? "Enabled — you will be nudged for mood check-ins even when TalkEasy is closed."
                    : "Get nudged for your mood check-in even when TalkEasy is closed."}
                </p>
              </div>
            </div>
            {webPushState !== "unsupported" && webPushConfigured && (
              webPushState === "subscribed" ? (
                <button
                  type="button"
                  onClick={disableBackgroundReminders}
                  disabled={webPushBusy}
                  className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 whitespace-nowrap disabled:opacity-50"
                >
                  Turn off
                </button>
              ) : (
                <button
                  type="button"
                  onClick={enableBackgroundReminders}
                  disabled={webPushBusy}
                  className="px-4 py-2 rounded-lg bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 whitespace-nowrap disabled:opacity-50 flex items-center gap-2"
                >
                  {webPushBusy && <Loader2 className="w-4 h-4 animate-spin" />}
                  Enable
                </button>
              )
            )}
          </div>

          {/* In-tab reminder permission — honest about the open-tab limitation. */}
          <div className="flex items-center justify-between gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
            <div>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Reminders while TalkEasy is open</p>
              <p className="text-xs text-muted-foreground">
                {browserPermission === "unsupported"
                  ? "This browser cannot show notifications. You can still use the in-app check-in."
                  : browserPermission === "granted"
                  ? "Enabled. Reminders appear while TalkEasy is open in a tab."
                  : browserPermission === "denied"
                  ? "Blocked in browser settings. Re-enable notifications for this site to receive reminders."
                  : "Allow notifications to be nudged when it is time to check in."}
              </p>
            </div>
            {browserPermission !== "granted" && browserPermission !== "unsupported" && (
              <button
                type="button"
                onClick={requestBrowserPermission}
                className="px-4 py-2 rounded-lg border border-teal-600 text-teal-700 dark:text-teal-400 text-sm font-semibold hover:bg-teal-50 dark:hover:bg-teal-900/20 whitespace-nowrap"
              >
                Enable
              </button>
            )}
          </div>

          <div className="flex items-start gap-2 text-xs text-muted-foreground">
            <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            {draft.pushConfigured || draft.webPushConfigured
              ? "Push notifications are delivered through your device. Background reminders require browser permission and a configured server."
              : "Server push delivery is not configured yet. Preferences are saved and used for local reminders on your device."}
          </div>

          <button
            type="button"
            onClick={() => save.mutate(draft)}
            disabled={save.isPending}
            className="px-5 py-2.5 rounded-xl bg-teal-600 text-white font-bold hover:bg-teal-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {save.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save notifications
          </button>
        </>
      )}
    </section>
  );
}
