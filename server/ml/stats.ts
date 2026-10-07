/** Small deterministic statistics helpers for the ML layer. */

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function clamp(x: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, x));
}

export function mean(xs: number[]): number {
  if (xs.length === 0) return 0;
  let s = 0;
  for (const x of xs) s += x;
  return s / xs.length;
}

export function median(xs: number[]): number {
  if (xs.length === 0) return 0;
  const sorted = [...xs].sort((a, b) => a - b);
  const mid = sorted.length >> 1;
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function std(xs: number[]): number {
  if (xs.length < 2) return 0;
  const m = mean(xs);
  let acc = 0;
  for (const x of xs) acc += (x - m) * (x - m);
  return Math.sqrt(acc / (xs.length - 1));
}

export function mad(xs: number[]): number {
  const med = median(xs);
  return median(xs.map((x) => Math.abs(x - med)));
}

export function pearson(xs: number[], ys: number[]): number {
  const n = Math.min(xs.length, ys.length);
  if (n < 2) return 0;
  const mx = mean(xs.slice(0, n));
  const my = mean(ys.slice(0, n));
  let num = 0;
  let dx = 0;
  let dy = 0;
  for (let i = 0; i < n; i++) {
    const ax = xs[i] - mx;
    const ay = ys[i] - my;
    num += ax * ay;
    dx += ax * ax;
    dy += ay * ay;
  }
  const denom = Math.sqrt(dx * dy);
  return denom === 0 ? 0 : clamp(num / denom, -1, 1);
}

/** Two-sided permutation test for |pearson r|; deterministic for a given seed. */
export function permutationPValue(xs: number[], ys: number[], perms = 300, seed = 42): number {
  const n = Math.min(xs.length, ys.length);
  if (n < 4) return 1;
  const observed = Math.abs(pearson(xs.slice(0, n), ys.slice(0, n)));
  const rand = mulberry32(seed);
  const pool = ys.slice(0, n);
  let hits = 0;
  for (let p = 0; p < perms; p++) {
    const shuffled = [...pool];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      const tmp = shuffled[i];
      shuffled[i] = shuffled[j];
      shuffled[j] = tmp;
    }
    if (Math.abs(pearson(xs.slice(0, n), shuffled)) >= observed) hits++;
  }
  return (hits + 1) / (perms + 1);
}

export function round(x: number, decimals = 1): number {
  const f = 10 ** decimals;
  return Math.round(x * f) / f;
}

/** Coefficient of variation in percent (0 when the mean is 0). */
export function cvPct(xs: number[]): number {
  const m = mean(xs);
  if (xs.length < 3 || m === 0) return 0;
  return (std(xs) / Math.abs(m)) * 100;
}
