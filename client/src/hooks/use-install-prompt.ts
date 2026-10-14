import { useCallback, useEffect, useState } from "react";
import { isStandaloneDisplay } from "@/lib/pwa";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export type InstallPlatform = "android" | "ios" | "desktop" | "other";

export function detectPlatform(): InstallPlatform {
  if (typeof navigator === "undefined") return "other";
  const ua = navigator.userAgent || "";
  if (/android/i.test(ua)) return "android";
  if (/iphone|ipad|ipod/i.test(ua) || (/macintosh/i.test(ua) && "ontouchend" in document)) return "ios";
  if (/windows|macintosh|linux|cros/i.test(ua)) return "desktop";
  return "other";
}

export interface InstallPromptState {
  /** The browser handed us an install prompt we can trigger programmatically. */
  canInstall: boolean;
  /** The app is already running installed (standalone display mode). */
  installed: boolean;
  /** Ask the browser to show its native install prompt. */
  promptInstall: () => Promise<"accepted" | "dismissed" | "unavailable">;
  platform: InstallPlatform;
}

/**
 * Tracks the Android/Chromium `beforeinstallprompt` flow. When the browser does
 * not offer a programmatic prompt (iOS/Safari, already-installed, or a browser
 * that withholds the event), `canInstall` stays false and callers fall back to
 * written install steps — we never pretend an install button will work.
 */
export function useInstallPrompt(): InstallPromptState {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState<boolean>(() => isStandaloneDisplay());
  const [platform] = useState<InstallPlatform>(() => detectPlatform());

  useEffect(() => {
    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferred) return "unavailable" as const;
    try {
      await deferred.prompt();
      const choice = await deferred.userChoice;
      setDeferred(null);
      return choice.outcome;
    } catch {
      setDeferred(null);
      return "unavailable" as const;
    }
  }, [deferred]);

  return { canInstall: Boolean(deferred), installed, promptInstall, platform };
}
