/**
 * TalkEasy v6.3.0 — Web Push delivery (server side, RFC 8030 / VAPID).
 *
 * This is the standard browser Push API channel, independent from the FCM device
 * channel in `server/push.ts`. Delivery is attempted only when a VAPID key pair
 * is configured (`VAPID_PUBLIC_KEY` + `VAPID_PRIVATE_KEY`, optional
 * `VAPID_SUBJECT`); otherwise callers receive `configured: false` and no
 * delivery is ever claimed.
 *
 * Privacy: payloads are neutral ("Time for your TalkEasy mood check-in.") with a
 * deep link only. No journal text, mood values, or other health data is placed
 * in a push payload.
 *
 * Expired subscriptions (404/410 from the push service) are soft-invalidated;
 * repeated other failures also invalidate after a small threshold so a dead
 * endpoint is not retried forever.
 */
import webpush from "web-push";
import { and, eq } from "drizzle-orm";
import { db } from "./db";
import { pushSubscriptions } from "@shared/schema";
import { isValidVapidPublicKey, type NormalizedPushSubscription } from "@shared/web-push";

export interface WebPushPayload {
  title: string;
  body: string;
  deepLink?: string;
  category?: string;
  tag?: string;
}

export interface WebPushSendResult {
  configured: boolean;
  sent: number;
  failed: number;
  invalidSubscriptionsRemoved: number;
}

const SUPPORT_SUBJECT = "mailto:talkeasysupport@gmail.com";
const MAX_FAILURES = 5;

export interface VapidConfig {
  configured: boolean;
  publicKey: string | null;
  subject: string;
  missing: string[];
}

export function getVapidConfig(): VapidConfig {
  const publicKey = (process.env.VAPID_PUBLIC_KEY || "").trim();
  const privateKey = (process.env.VAPID_PRIVATE_KEY || "").trim();
  const subject = (process.env.VAPID_SUBJECT || "").trim() || SUPPORT_SUBJECT;
  const missing: string[] = [];
  if (!publicKey || !isValidVapidPublicKey(publicKey)) missing.push("VAPID_PUBLIC_KEY");
  if (!privateKey) missing.push("VAPID_PRIVATE_KEY");
  return { configured: missing.length === 0, publicKey: publicKey || null, subject, missing };
}

export function isWebPushConfigured(): boolean {
  return getVapidConfig().configured;
}

/** Public VAPID key for the browser to pass to pushManager.subscribe (or null). */
export function getVapidPublicKey(): string | null {
  const cfg = getVapidConfig();
  return cfg.configured ? cfg.publicKey : null;
}

let vapidApplied = false;

/** Lazily configures web-push once. Returns false when not configured. */
function applyVapid(): boolean {
  const cfg = getVapidConfig();
  if (!cfg.configured || !cfg.publicKey) return false;
  if (!vapidApplied) {
    webpush.setVapidDetails(cfg.subject, cfg.publicKey, process.env.VAPID_PRIVATE_KEY as string);
    vapidApplied = true;
  }
  return true;
}

/** Upserts a validated subscription, scoped to the owning user. */
export async function saveSubscription(
  userId: string,
  sub: NormalizedPushSubscription,
  userAgent?: string,
): Promise<{ created: boolean }> {
  const [existing] = await db.select().from(pushSubscriptions).where(eq(pushSubscriptions.endpoint, sub.endpoint));
  if (existing) {
    await db
      .update(pushSubscriptions)
      .set({
        userId,
        p256dh: sub.p256dh,
        auth: sub.auth,
        userAgent: userAgent ?? existing.userAgent,
        invalid: false,
        failureCount: 0,
        updatedAt: new Date(),
      })
      .where(eq(pushSubscriptions.endpoint, sub.endpoint));
    return { created: false };
  }
  await db.insert(pushSubscriptions).values({
    userId,
    endpoint: sub.endpoint,
    p256dh: sub.p256dh,
    auth: sub.auth,
    userAgent: userAgent ?? null,
  });
  return { created: true };
}

/** Removes a subscription only when it belongs to the requesting user. */
export async function removeSubscription(userId: string, endpoint: string): Promise<boolean> {
  const deleted = await db
    .delete(pushSubscriptions)
    .where(and(eq(pushSubscriptions.endpoint, endpoint), eq(pushSubscriptions.userId, userId)))
    .returning();
  return deleted.length > 0;
}

export async function countSubscriptions(userId: string): Promise<number> {
  const rows = await db
    .select({ id: pushSubscriptions.id })
    .from(pushSubscriptions)
    .where(and(eq(pushSubscriptions.userId, userId), eq(pushSubscriptions.invalid, false)));
  return rows.length;
}

/** Most recent browser subscription time, used as the reminder anchor fallback. */
export async function firstSubscriptionAt(userId: string): Promise<Date | null> {
  const rows = await db
    .select({ createdAt: pushSubscriptions.createdAt })
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.userId, userId));
  const dates = rows.map((r) => r.createdAt).filter((v): v is Date => v instanceof Date);
  if (!dates.length) return null;
  return dates.reduce((a, b) => (a.getTime() <= b.getTime() ? a : b));
}

/**
 * Delivers a Web Push to every active subscription owned by the user. Never
 * throws; delivery problems are reflected in the returned counts.
 */
export async function sendWebPushToUser(userId: string, payload: WebPushPayload): Promise<WebPushSendResult> {
  if (!applyVapid()) {
    return { configured: false, sent: 0, failed: 0, invalidSubscriptionsRemoved: 0 };
  }

  const subs = await db
    .select()
    .from(pushSubscriptions)
    .where(and(eq(pushSubscriptions.userId, userId), eq(pushSubscriptions.invalid, false)));

  const body = JSON.stringify(payload);
  let sent = 0;
  let failed = 0;
  let invalidSubscriptionsRemoved = 0;

  for (const row of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: row.endpoint, keys: { p256dh: row.p256dh, auth: row.auth } },
        body,
        { TTL: 60 * 60 },
      );
      await db
        .update(pushSubscriptions)
        .set({ lastSuccessAt: new Date(), failureCount: 0, updatedAt: new Date() })
        .where(eq(pushSubscriptions.id, row.id));
      sent++;
    } catch (error) {
      const status = (error as { statusCode?: number })?.statusCode;
      const fatal = status === 404 || status === 410;
      const nextFailures = (row.failureCount || 0) + 1;
      if (fatal || nextFailures >= MAX_FAILURES) {
        await db
          .update(pushSubscriptions)
          .set({ invalid: true, failureCount: nextFailures, updatedAt: new Date() })
          .where(eq(pushSubscriptions.id, row.id));
        invalidSubscriptionsRemoved++;
      } else {
        await db
          .update(pushSubscriptions)
          .set({ failureCount: nextFailures, updatedAt: new Date() })
          .where(eq(pushSubscriptions.id, row.id));
        failed++;
      }
    }
  }

  return { configured: true, sent, failed, invalidSubscriptionsRemoved };
}
