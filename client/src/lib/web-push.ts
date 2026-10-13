/**
 * TalkEasy v6.3.0 — browser Web Push client.
 *
 * Registers the service worker and subscribes the browser to the server's VAPID
 * Web Push channel so mood reminders arrive while the tab is closed. Every step
 * degrades honestly: unsupported browsers, denied permission, and an
 * unconfigured server are all reported back to the caller rather than pretending
 * success.
 */

export type WebPushState = "unsupported" | "unsubscribed" | "subscribed";

export interface WebPushConfig {
  configured: boolean;
  publicKey: string | null;
  subject?: string;
}

export function supportsWebPush(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof navigator !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
  return output;
}

export async function getWebPushConfig(): Promise<WebPushConfig> {
  try {
    const res = await fetch("/api/notifications/web-push/config", { credentials: "include" });
    if (!res.ok) return { configured: false, publicKey: null };
    return (await res.json()) as WebPushConfig;
  } catch {
    return { configured: false, publicKey: null };
  }
}

async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!supportsWebPush()) return null;
  const reg = await navigator.serviceWorker.register("/sw.js");
  await navigator.serviceWorker.ready;
  return reg;
}

export async function getWebPushState(): Promise<WebPushState> {
  if (!supportsWebPush()) return "unsupported";
  try {
    const reg = await navigator.serviceWorker.getRegistration();
    const sub = reg ? await reg.pushManager.getSubscription() : null;
    return sub ? "subscribed" : "unsubscribed";
  } catch {
    return "unsubscribed";
  }
}

export interface SubscribeResult {
  ok: boolean;
  reason?: "unsupported" | "permission-denied" | "server-not-configured" | "register-failed";
}

/** Requests permission, subscribes, and registers the subscription server-side. */
export async function subscribeToWebPush(): Promise<SubscribeResult> {
  if (!supportsWebPush()) return { ok: false, reason: "unsupported" };

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return { ok: false, reason: "permission-denied" };

  const config = await getWebPushConfig();
  if (!config.configured || !config.publicKey) return { ok: false, reason: "server-not-configured" };

  try {
    const reg = await registerServiceWorker();
    if (!reg) return { ok: false, reason: "unsupported" };

    const existing = await reg.pushManager.getSubscription();
    const subscription =
      existing ??
      (await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(config.publicKey),
      }));

    const res = await fetch("/api/notifications/web-push/subscriptions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(subscription.toJSON()),
    });
    if (!res.ok) return { ok: false, reason: "register-failed" };
    return { ok: true };
  } catch {
    return { ok: false, reason: "register-failed" };
  }
}

/** Unsubscribes locally and removes the subscription server-side. */
export async function unsubscribeFromWebPush(): Promise<boolean> {
  if (!supportsWebPush()) return true;
  try {
    const reg = await navigator.serviceWorker.getRegistration();
    const sub = reg ? await reg.pushManager.getSubscription() : null;
    const endpoint = sub?.endpoint ?? null;
    if (sub) await sub.unsubscribe();
    if (endpoint) {
      await fetch("/api/notifications/web-push/subscriptions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ endpoint }),
      });
    }
    return true;
  } catch {
    return false;
  }
}
