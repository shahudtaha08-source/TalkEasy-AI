import { test } from "node:test";
import assert from "node:assert/strict";
import { RateLimiter } from "../server/rate-limit";

test("allows up to the limit, then blocks within the window", () => {
  const rl = new RateLimiter(3, 60_000);
  const t = 1_000_000;
  assert.equal(rl.check("k", t).allowed, true);
  assert.equal(rl.check("k", t + 1).allowed, true);
  const third = rl.check("k", t + 2);
  assert.equal(third.allowed, true);
  assert.equal(third.remaining, 0);
  const fourth = rl.check("k", t + 3);
  assert.equal(fourth.allowed, false);
  assert.ok(fourth.retryAfterSeconds > 0);
});

test("limits are per key", () => {
  const rl = new RateLimiter(1, 60_000);
  assert.equal(rl.check("a", 1000).allowed, true);
  assert.equal(rl.check("a", 1001).allowed, false);
  assert.equal(rl.check("b", 1001).allowed, true);
});

test("window expiry frees the key", () => {
  const rl = new RateLimiter(1, 1000);
  assert.equal(rl.check("k", 10_000).allowed, true);
  assert.equal(rl.check("k", 10_500).allowed, false);
  assert.equal(rl.check("k", 11_500).allowed, true);
});

test("reset clears state and prune removes stale keys", () => {
  const rl = new RateLimiter(2, 1000);
  rl.check("k", 5000);
  rl.check("k", 5001);
  assert.equal(rl.check("k", 5002).allowed, false);
  rl.reset("k");
  assert.equal(rl.check("k", 5003).allowed, true);

  rl.prune(100_000);
  // After pruning, the old attempts are gone.
  assert.equal(rl.check("k", 100_001).allowed, true);
});
