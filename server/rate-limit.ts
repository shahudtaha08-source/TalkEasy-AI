/**
 * TalkEasy v6.1.3 — small in-memory rate limiter.
 *
 * Used to throttle sensitive endpoints (password-reset requests, token
 * verification). Deterministic and dependency-free so it can be unit-tested.
 *
 * NOTE: state is per-process. In a multi-instance deployment this should be
 * backed by a shared store (e.g. Redis / Postgres); the interface is designed so
 * the backing store can be swapped without touching call sites.
 */

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export class RateLimiter {
  private hits = new Map<string, number[]>();

  constructor(
    private readonly limit: number,
    private readonly windowMs: number,
  ) {}

  /** Records an attempt and returns whether it is allowed. */
  check(key: string, now: number = Date.now()): RateLimitResult {
    const since = now - this.windowMs;
    const existing = (this.hits.get(key) || []).filter((t) => t > since);

    if (existing.length >= this.limit) {
      const oldest = existing[0];
      const retryAfterSeconds = Math.max(1, Math.ceil((oldest + this.windowMs - now) / 1000));
      this.hits.set(key, existing);
      return { allowed: false, remaining: 0, retryAfterSeconds };
    }

    existing.push(now);
    this.hits.set(key, existing);
    return { allowed: true, remaining: Math.max(0, this.limit - existing.length), retryAfterSeconds: 0 };
  }

  reset(key?: string): void {
    if (key) this.hits.delete(key);
    else this.hits.clear();
  }

  /** Periodic cleanup so the map does not grow unbounded. */
  prune(now: number = Date.now()): void {
    const since = now - this.windowMs;
    this.hits.forEach((timestamps: number[], key: string) => {
      const kept = timestamps.filter((t) => t > since);
      if (kept.length === 0) this.hits.delete(key);
      else this.hits.set(key, kept);
    });
  }
}

export const forgotPasswordLimiter = new RateLimiter(5, 60 * 60 * 1000); // 5 / hour / key
export const verifyTokenLimiter = new RateLimiter(20, 15 * 60 * 1000); // 20 / 15 min / key
export const resetPasswordLimiter = new RateLimiter(10, 15 * 60 * 1000); // 10 / 15 min / key
export const pushSubscriptionLimiter = new RateLimiter(30, 60 * 60 * 1000); // 30 / hour / user
