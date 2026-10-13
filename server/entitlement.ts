/**
 * TalkEasy v6.1.3 — server-authoritative trial & premium entitlement.
 *
 * The free trial is 7 days and begins the first time an authenticated account
 * touches the entitlement service. Because the start time is recorded server
 * side, a client cannot reset the trial by clearing storage or re-calling an
 * endpoint. Premium activation is intentionally NOT exposed: no payment
 * provider is configured, so no endpoint fabricates a successful purchase.
 */
import { db } from "./db";
import { entitlements } from "@shared/schema";
import { eq } from "drizzle-orm";
import {
  computeEntitlementStatus,
  trialWindow,
  TRIAL_DAYS,
  PREMIUM_PRICE_INR_MONTH,
  type EntitlementStatus,
  type EntitlementRowLike,
} from "@shared/entitlement";

export { TRIAL_DAYS, PREMIUM_PRICE_INR_MONTH, computeEntitlementStatus };
export type { EntitlementStatus };

/**
 * Fetches the user's entitlement, starting the trial on first access.
 * This is the single source of truth used by both the web app and Flutter.
 */
export async function getOrCreateEntitlement(userId: string, now: Date = new Date()): Promise<EntitlementStatus> {
  const [existing] = await db.select().from(entitlements).where(eq(entitlements.userId, userId)).limit(1);
  if (existing) {
    return computeEntitlementStatus(existing as EntitlementRowLike, now);
  }

  const { trialStartedAt, trialEndsAt } = trialWindow(now);
  const [created] = await db
    .insert(entitlements)
    .values({ userId, trialStartedAt, trialEndsAt, plan: "free" })
    .onConflictDoNothing()
    .returning();

  if (!created) {
    // A concurrent request won the insert race — read back its row.
    const [row] = await db.select().from(entitlements).where(eq(entitlements.userId, userId)).limit(1);
    return computeEntitlementStatus(row as EntitlementRowLike, now);
  }
  return computeEntitlementStatus(created as EntitlementRowLike, now);
}

/** Read-only status (creates the trial row on first read, by design). */
export async function getEntitlementStatus(userId: string, now: Date = new Date()): Promise<EntitlementStatus> {
  return getOrCreateEntitlement(userId, now);
}
