/**
 * TalkEasy v6.3.0 — PWA bootstrap (browser side).
 *
 * Registers the service worker that powers offline shell + Web Push, and keeps
 * the installed app on the latest build: when a new worker takes control we
 * reload once so the page never runs stale markup against fresh hashed assets.
 *
 * Registration is production-only. In Vite dev the module graph is served live,
 * and caching it would fight HMR; the built app is what actually installs.
 */

const SW_URL = "/sw.js";

let reloading = false;

export function registerServiceWorker(): void {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  if (!import.meta.env.PROD) return;

  window.addEventListener("load", () => {
    // Whether a worker already controlled this page at load. If not, this is the
    // first install; the `clients.claim()` takeover would fire controllerchange
    // and must NOT trigger a reload.
    const hadController = Boolean(navigator.serviceWorker.controller);

    navigator.serviceWorker
      .register(SW_URL, { scope: "/" })
      .then((registration) => {
        registration.addEventListener("updatefound", () => {
          const installing = registration.installing;
          if (!installing) return;
          installing.addEventListener("statechange", () => {
            if (installing.state === "installed" && navigator.serviceWorker.controller) {
              // An updated worker is ready. Activate it now.
              installing.postMessage({ type: "SKIP_WAITING" });
            }
          });
        });
      })
      .catch(() => {
        /* registration failure only disables offline/push; the app still runs */
      });

    // Reload exactly once when an *update* takes control (never on first install),
    // so UI and assets never mismatch.
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (!hadController || reloading) return;
      reloading = true;
      window.location.reload();
    });
  });
}

/** True when the app is already running as an installed/standalone window. */
export function isStandaloneDisplay(): boolean {
  if (typeof window === "undefined") return false;
  const mq = window.matchMedia?.("(display-mode: standalone)")?.matches;
  const iosStandalone = (window.navigator as { standalone?: boolean }).standalone === true;
  return Boolean(mq || iosStandalone);
}
