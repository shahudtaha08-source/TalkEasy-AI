import { test } from "node:test";
import assert from "node:assert/strict";
import {
  computeEntitlementStatus,
  trialWindow,
  TRIAL_DAYS,
  PREMIUM_PRICE_INR_MONTH,
} from "../shared/entitlement";

const NOW = new Date("2026-01-10T00:00:00.000Z");

test("free trial is 7 days and priced at Rs.199/month", () => {
  assert.equal(TRIAL_DAYS, 7);
  assert.equal(PREMIUM_PRICE_INR_MONTH, 199);
});

test("trialWindow spans exactly 7 days", () => {
  const w = trialWindow(NOW);
  const spanDays = (w.trialEndsAt.getTime() - w.trialStartedAt.getTime()) / (24 * 60 * 60 * 1000);
  assert.equal(spanDays, 7);
});

test("active trial grants 90-day access with correct remaining days", () => {
  const w = trialWindow(new Date("2026-01-08T00:00:00.000Z"));
  const status = computeEntitlementStatus(
    { plan: "free", trialStartedAt: w.trialStartedAt, trialEndsAt: w.trialEndsAt, premiumUntil: null },
    NOW,
  );
  assert.equal(status.state, "trial");
  assert.equal(status.trialActive, true);
  assert.equal(status.canAccess90Day, true);
  assert.equal(status.trialDaysRemaining, 5);
  assert.equal(status.plan, "free");
  assert.equal(status.priceInrPerMonth, 199);
});

test("expired trial denies 90-day access and reports trial_expired", () => {
  const w = trialWindow(new Date("2025-12-01T00:00:00.000Z"));
  const status = computeEntitlementStatus(
    { plan: "free", trialStartedAt: w.trialStartedAt, trialEndsAt: w.trialEndsAt, premiumUntil: null },
    NOW,
  );
  assert.equal(status.state, "trial_expired");
  assert.equal(status.trialActive, false);
  assert.equal(status.canAccess90Day, false);
  assert.equal(status.trialDaysRemaining, 0);
});

test("premium overrides trial state while active", () => {
  const status = computeEntitlementStatus(
    {
      plan: "premium",
      trialStartedAt: null,
      trialEndsAt: null,
      premiumUntil: new Date("2026-06-01T00:00:00.000Z"),
    },
    NOW,
  );
  assert.equal(status.state, "premium");
  assert.equal(status.plan, "premium");
  assert.equal(status.premiumActive, true);
  assert.equal(status.canAccess90Day, true);
});

test("lapsed premium returns to locked (trial_expired) not premium", () => {
  const status = computeEntitlementStatus(
    {
      plan: "premium",
      trialStartedAt: new Date("2025-11-01T00:00:00.000Z"),
      trialEndsAt: new Date("2025-11-08T00:00:00.000Z"),
      premiumUntil: new Date("2025-12-01T00:00:00.000Z"),
    },
    NOW,
  );
  assert.equal(status.plan, "free");
  assert.equal(status.premiumActive, false);
  assert.equal(status.canAccess90Day, false);
});

test("brand new account with no trial row cannot access 90-day data", () => {
  const status = computeEntitlementStatus(
    { plan: "free", trialStartedAt: null, trialEndsAt: null, premiumUntil: null },
    NOW,
  );
  assert.equal(status.state, "free");
  assert.equal(status.canAccess90Day, false);
});
