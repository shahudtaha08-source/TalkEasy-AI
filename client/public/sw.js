/* TalkEasy v6.3.0 — service worker
 *
 * Two jobs:
 *   1. Offline app-shell so the installed PWA opens without a network (and never
 *      shows a stale HTML shell that points at deleted build assets).
 *   2. Web Push display + notification routing, so mood reminders arrive while
 *      the site is closed.
 *
 * Safety rules:
 *   • `/api/*` is NEVER cached and NEVER served from cache — a failed API call
 *     must surface as a real failure, never as stale private wellness data or a
 *     fake success.
 *   • Only same-origin GET requests are handled. Cross-origin requests
 *     (Google Fonts, push services) fall through to the browser untouched.
 *   • HTML navigations are network-first, so a new deploy is picked up
 *     immediately; the cached shell is only a fallback when the network fails.
 *   • Caches are versioned and old versions are deleted on activate, so an
 *     update never leaves stale assets behind.
 */

const CACHE_VERSION = "v6.3.0-2";
const SHELL_CACHE = `talkeasy-shell-${CACHE_VERSION}`;
const RUNTIME_CACHE = `talkeasy-runtime-${CACHE_VERSION}`;
const CURRENT_CACHES = new Set([SHELL_CACHE, RUNTIME_CACHE]);

// Minimal app shell. The HTML shell is route-agnostic; hashed JS/CSS are cached
// at runtime as they are requested.
const PRECACHE_URLS = [
  "/",
  "/manifest.webmanifest",
  "/favicon.svg",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-maskable-512.png",
  "/icons/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(SHELL_CACHE);
      // addAll fails the whole install if any single URL 404s; add individually
      // so one missing optional icon cannot block service-worker installation.
      await Promise.all(
        PRECACHE_URLS.map((url) =>
          cache.add(new Request(url, { cache: "reload" })).catch(() => undefined),
        ),
      );

      // The HTML shell references hashed JS/CSS. Cache those too, otherwise an
      // offline reload would get the shell but a blank screen (the worker was
      // not controlling the first load, so they were never runtime-cached).
      try {
        const shell = await cache.match("/");
        const html = shell ? await shell.clone().text() : "";
        const assetUrls = Array.from(html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g), (m) => m[1]);
        if (assetUrls.length) {
          const runtime = await caches.open(RUNTIME_CACHE);
          await Promise.all(assetUrls.map((url) => runtime.add(url).catch(() => undefined)));
        }
      } catch {
        /* asset precache is best-effort; runtime cache still covers repeat visits */
      }

      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key.startsWith("talkeasy-") && !CURRENT_CACHES.has(key))
          .map((key) => caches.delete(key)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Only handle same-origin GETs. Everything else (POST/PUT/DELETE, /api/*,
  // cross-origin fonts & push endpoints) is left to the network so failures and
  // responses are always real.
  if (request.method !== "GET") return;

  let url;
  try {
    url = new URL(request.url);
  } catch {
    return;
  }
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  // HTML navigations: network-first, fall back to the cached shell offline.
  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const response = await fetch(request);
          if (response && response.ok) {
            const cache = await caches.open(SHELL_CACHE);
            cache.put("/", response.clone());
          }
          return response;
        } catch {
          const cache = await caches.open(SHELL_CACHE);
          const cachedShell = (await cache.match("/")) || (await cache.match("/index.html"));
          if (cachedShell) return cachedShell;
          return new Response(
            "<!doctype html><title>TalkEasy</title><body style=\"font-family:system-ui;padding:2rem\"><h1>TalkEasy is offline</h1><p>Reconnect to load your dashboard.</p></body>",
            { status: 503, headers: { "Content-Type": "text/html; charset=utf-8" } },
          );
        }
      })(),
    );
    return;
  }

  // Static same-origin assets: cache-first with a background refresh.
  event.respondWith(
    (async () => {
      const runtime = await caches.open(RUNTIME_CACHE);
      const shell = await caches.open(SHELL_CACHE);
      const cached = (await runtime.match(request)) || (await shell.match(request));
      const network = fetch(request)
        .then((response) => {
          if (response && response.ok && response.type === "basic") {
            runtime.put(request, response.clone());
          }
          return response;
        })
        .catch(() => undefined);

      if (cached) return cached;
      const response = await network;
      if (response) return response;
      return new Response("", { status: 504, statusText: "Offline" });
    })(),
  );
});

// ── Web Push ──────────────────────────────────────────────────────────────────

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (error) {
    data = { body: event.data ? event.data.text() : "" };
  }

  const title = data.title || "TalkEasy";
  const options = {
    body: data.body || "Time for your TalkEasy mood check-in.",
    tag: data.tag || "talkeasy-mood",
    renotify: false,
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    data: {
      deepLink: data.deepLink || "/dashboard",
      category: data.category || "",
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const deepLink = (event.notification.data && event.notification.data.deepLink) || "/dashboard";

  event.waitUntil(
    (async () => {
      const windowClients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const client of windowClients) {
        if ("focus" in client) {
          try {
            await client.navigate(deepLink);
          } catch (error) {
            /* navigation is best-effort */
          }
          return client.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(deepLink);
      return undefined;
    })(),
  );
});
