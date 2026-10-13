/**
 * TalkEasy v6.3.0 — Web Push (RFC 8030) shared helpers.
 *
 * Pure and free of database/network access so subscription validation and the
 * VAPID key-format check can be unit-tested in isolation. Server-side delivery
 * lives in `server/web-push.ts`; the browser flow lives in
 * `client/src/lib/web-push.ts` and `client/public/sw.js`.
 */

export interface RawPushSubscription {
  endpoint?: unknown;
  keys?: { p256dh?: unknown; auth?: unknown } | null;
}

export interface NormalizedPushSubscription {
  endpoint: string;
  p256dh: string;
  auth: string;
}

export type SubscriptionValidation =
  | { ok: true; value: NormalizedPushSubscription }
  | { ok: false; error: string };

const MAX_ENDPOINT_LENGTH = 1024;
const MAX_KEY_LENGTH = 512;

/** The lock-screen / notification tag so a re-fire replaces rather than stacks. */
export const MOOD_REMINDER_PUSH_TAG = "talkeasy-mood";

/**
 * Accepts only http(s) endpoints. Plain http is allowed solely for localhost so
 * local development works; real push services are always https.
 */
export function isValidPushEndpoint(endpoint: string): boolean {
  if (!endpoint || endpoint.length > MAX_ENDPOINT_LENGTH) return false;
  let url: URL;
  try {
    url = new URL(endpoint);
  } catch {
    return false;
  }
  if (url.protocol === "https:") return true;
  if (url.protocol === "http:" && (url.hostname === "localhost" || url.hostname === "127.0.0.1")) return true;
  return false;
}

/**
 * Validates an untrusted subscription payload from the browser. Never trusts
 * extra fields; only the endpoint and the two client keys are kept.
 */
export function normalizePushSubscription(body: unknown): SubscriptionValidation {
  if (!body || typeof body !== "object") return { ok: false, error: "A subscription object is required" };
  const b = body as RawPushSubscription;
  const endpoint = typeof b.endpoint === "string" ? b.endpoint.trim() : "";
  if (!isValidPushEndpoint(endpoint)) return { ok: false, error: "A valid push endpoint is required" };

  const keys = b.keys;
  const p256dh = keys && typeof keys.p256dh === "string" ? keys.p256dh.trim() : "";
  const auth = keys && typeof keys.auth === "string" ? keys.auth.trim() : "";
  if (!p256dh || p256dh.length > MAX_KEY_LENGTH) return { ok: false, error: "A valid p256dh key is required" };
  if (!auth || auth.length > MAX_KEY_LENGTH) return { ok: false, error: "A valid auth key is required" };

  return { ok: true, value: { endpoint, p256dh, auth } };
}

/**
 * A VAPID public key is an uncompressed NIST P-256 point: 65 bytes with the
 * first byte 0x04, base64url-encoded. This rejects placeholder/typo'd keys
 * before the push library is ever configured.
 */
export function isValidVapidPublicKey(key: string): boolean {
  if (!key) return false;
  try {
    const buf = Buffer.from(key, "base64url");
    return buf.length === 65 && buf[0] === 0x04;
  } catch {
    return false;
  }
}

/** Privacy-safe payload for the mood check-in reminder (no health values). */
export function buildMoodReminderPushPayload(): { title: string; body: string; deepLink: string; category: string; tag: string } {
  return {
    title: "TalkEasy",
    body: "Time for your TalkEasy mood check-in.",
    deepLink: "/mood-enhanced",
    category: "mood",
    tag: MOOD_REMINDER_PUSH_TAG,
  };
}
