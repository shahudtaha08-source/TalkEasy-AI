/**
 * TalkEasy v6.1.3 — pure entitlement logic (no database access).
 *
 * The free trial is 7 days. Premium is planned at ₹199/month. This file is the
 * single definition of "can this account access 90-day experiences?" used by the
 * web app, the Flutter app and the server.
 */

export const TRIAL_DAYS = 7;
export const PREMIUM_PRICE_INR_MONTH = 199;

export type EntitlementState = "trial" | "trial_expired" | "premium" | "free";

export interface EntitlementRowLike {
  plan: string;
  trialStartedAt: Date | string | null;
  trialEndsAt: Date | string | null;
  premiumUntil: Date | string | null;
}

export interface EntitlementStatus {
  plan: "free" | "premium";
  state: EntitlementState;
  trialActive: boolean;
  trialStartedAt: string | null;
  trialEndsAt: string | null;
  trialDaysRemaining: number;
  premiumActive: boolean;
  premiumUntil: string | null;
  canAccess90Day: boolean;
  priceInrPerMonth: number;
}

function toDate(value: Date | string | null): Date | null {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function computeEntitlementStatus(ent: EntitlementRowLike, now: Date = new Date()): EntitlementStatus {
  const trialEndsAt = toDate(ent.trialEndsAt);
  const trialStartedAt = toDate(ent.trialStartedAt);
  const premiumUntil = toDate(ent.premiumUntil);

  const trialActive = !!trialEndsAt && trialEndsAt.getTime() > now.getTime();
  const premiumActive = ent.plan === "premium" && !!premiumUntil && premiumUntil.getTime() > now.getTime();

  const msRemaining = trialActive && trialEndsAt ? trialEndsAt.getTime() - now.getTime() : 0;
  const trialDaysRemaining = trialActive ? Math.max(0, Math.ceil(msRemaining / (24 * 60 * 60 * 1000))) : 0;

  let state: EntitlementState;
  if (premiumActive) state = "premium";
  else if (trialActive) state = "trial";
  else if (trialEndsAt) state = "trial_expired";
  else state = "free";

  return {
    plan: premiumActive ? "premium" : "free",
    state,
    trialActive,
    trialStartedAt: trialStartedAt ? trialStartedAt.toISOString() : null,
    trialEndsAt: trialEndsAt ? trialEndsAt.toISOString() : null,
    trialDaysRemaining,
    premiumActive,
    premiumUntil: premiumUntil ? premiumUntil.toISOString() : null,
    canAccess90Day: trialActive || premiumActive,
    priceInrPerMonth: PREMIUM_PRICE_INR_MONTH,
  };
}

/** Trial window for a given start time. */
export function trialWindow(start: Date): { trialStartedAt: Date; trialEndsAt: Date } {
  return { trialStartedAt: start, trialEndsAt: new Date(start.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000) };
}
