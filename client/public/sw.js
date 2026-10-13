/* TalkEasy v6.3.0 — service worker: Web Push display + notification routing.
 *
 * This is what makes mood reminders work while the site is closed. It receives
 * the (privacy-safe) payload from the server's VAPID Web Push sender, shows the
 * notification, and deep-links into the app when tapped. No health data is
 * carried in the payload — only a neutral title/body and a route path.
 */
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

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
    icon: "/favicon.svg",
    badge: "/favicon.svg",
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
