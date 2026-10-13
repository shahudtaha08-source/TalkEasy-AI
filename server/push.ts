/**
 * TalkEasy v6.1.3 — remote push delivery (server side).
 *
 * Remote push is an independent capability from local Flutter reminders. It is
 * only attempted when a provider is configured; otherwise callers receive
 * `configured: false` and no delivery is claimed.
 *
 * Supported provider: `fcm` via the legacy HTTP endpoint using FCM_SERVER_KEY.
 * For production, migrate to FCM HTTP v1 with a service account; the
 * `PushPayload` interface below is provider-agnostic so that swap is contained.
 *
 * Privacy: never place journal contents or detailed health values in a push
 * payload. Callers must send a neutral title/body and a deep link; the app
 * fetches protected details after the user opens it.
 */
import { db } from "./db";
import { deviceTokens } from "@shared/schema";
import { and, eq } from "drizzle-orm";

export interface PushPayload {
  title: string;
  body: string;
  /** Deep link, e.g. "talkeasy://habits" or a route path. */
  deepLink?: string;
  /** Coarse category for client-side routing/analytics (no health values). */
  category?: string;
}

export interface PushResult {
  configured: boolean;
  sent: number;
  failed: number;
  invalidTokensRemoved: number;
}

export function isPushConfigured(): boolean {
  return !!process.env.FCM_SERVER_KEY;
}

export function getPushProvider(): string {
  return (process.env.PUSH_PROVIDER || (process.env.FCM_SERVER_KEY ? "fcm" : "noop")).toLowerCase();
}

/** Sends a push to a single FCM token. Returns "ok", "invalid", or throws. */
async function sendFcm(token: string, payload: PushPayload): Promise<"ok" | "invalid"> {
  const res = await fetch("https://fcm.googleapis.com/fcm/send", {
    method: "POST",
    headers: {
      Authorization: `key=${process.env.FCM_SERVER_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      to: token,
      notification: { title: payload.title, body: payload.body },
      data: { deepLink: payload.deepLink || "", category: payload.category || "" },
    }),
  });
  const data = (await res.json().catch(() => ({}))) as any;
  if (data?.results?.[0]?.error && /NotRegistered|InvalidRegistration|MismatchSenderId/i.test(data.results[0].error)) {
    return "invalid";
  }
  if (!res.ok) throw new Error(`FCM HTTP ${res.status}`);
  if (data?.failure) throw new Error("FCM reported failure");
  return "ok";
}

/**
 * Delivers a push to every active device token owned by the user.
 * Invalid tokens are marked invalid (soft-deleted) so they are not retried.
 */
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<PushResult> {
  if (!isPushConfigured()) {
    return { configured: false, sent: 0, failed: 0, invalidTokensRemoved: 0 };
  }
  const tokens = await db
    .select()
    .from(deviceTokens)
    .where(and(eq(deviceTokens.userId, userId), eq(deviceTokens.invalid, false)));

  let sent = 0;
  let failed = 0;
  let invalidTokensRemoved = 0;

  for (const row of tokens) {
    try {
      const outcome = await sendFcm(row.token, payload);
      if (outcome === "invalid") {
        await db.update(deviceTokens).set({ invalid: true, updatedAt: new Date() }).where(eq(deviceTokens.id, row.id));
        invalidTokensRemoved++;
      } else {
        sent++;
      }
    } catch {
      failed++;
    }
  }
  return { configured: true, sent, failed, invalidTokensRemoved };
}
