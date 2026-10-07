import type { ClusterInsight, ClusterLabelKey, ClustersData, DailyFeature, FeatureKey } from "@shared/ml-types";
import { clamp, mean, mulberry32, round } from "./stats";

/**
 * K-Means clustering of days (with silhouette-based model selection) over the
 * tracked wellness features. Missing values are imputed with the feature mean
 * before min-max normalisation.
 */

const CANDIDATE_FEATURES: FeatureKey[] = ["sleep", "mood", "stress", "water", "habits", "steps"];
const MIN_DAYS = 8;
const MIN_COVERAGE = 0.5;
const MIN_VALUES_PER_DAY = 3;
const MAX_K = 4;
const RESTARTS = 6;
const ITERATIONS = 50;

const LABEL_POOL: ClusterLabelKey[] = [
  "mlClusterHighStress",
  "mlClusterLowSleep",
  "mlClusterActive",
  "mlClusterRecovery",
  "mlClusterBalanced",
];

function roundFor(feature: FeatureKey, x: number): number {
  return feature === "water" || feature === "steps" || feature === "habits" ? Math.round(x) : round(x, 1);
}

interface Point {
  values: number[];
  dayIndex: number;
}

function kmeans(points: number[][], k: number, seed: number): { assignment: number[]; centroids: number[][]; inertia: number } {
  const dims = points[0].length;
  const rand = mulberry32(seed);

  // deterministic k-means++ style seeding: first centroid furthest from origin mean, then max-min distance
  const globalMean = new Array(dims).fill(0).map((_, d) => mean(points.map((p) => p[d])));
  const distTo = (p: number[], q: number[]) => {
    let s = 0;
    for (let d = 0; d < dims; d++) s += (p[d] - q[d]) ** 2;
    return s;
  };
  const centroids: number[][] = [];
  let first = 0;
  let best = -1;
  for (let i = 0; i < points.length; i++) {
    const dist = distTo(points[i], globalMean);
    if (dist > best) {
      best = dist;
      first = i;
    }
  }
  centroids.push([...points[first]]);
  while (centroids.length < k) {
    let pick = 0;
    let pickDist = -1;
    for (let i = 0; i < points.length; i++) {
      let nearest = Infinity;
      for (const c of centroids) nearest = Math.min(nearest, distTo(points[i], c));
      const score = nearest * (0.75 + 0.5 * rand());
      if (score > pickDist) {
        pickDist = score;
        pick = i;
      }
    }
    centroids.push([...points[pick]]);
  }

  let assignment = new Array(points.length).fill(0);
  for (let iter = 0; iter < ITERATIONS; iter++) {
    let changed = false;
    for (let i = 0; i < points.length; i++) {
      let bestC = 0;
      let bestD = Infinity;
      for (let c = 0; c < k; c++) {
        const d = distTo(points[i], centroids[c]);
        if (d < bestD) {
          bestD = d;
          bestC = c;
        }
      }
      if (assignment[i] !== bestC) {
        assignment[i] = bestC;
        changed = true;
      }
    }
    for (let c = 0; c < k; c++) {
      const members = points.filter((_, i) => assignment[i] === c);
      if (members.length === 0) {
        // re-seed empty cluster on a random-ish point (deterministic index)
        centroids[c] = [...points[Math.floor(rand() * points.length)]];
        continue;
      }
      for (let d = 0; d < dims; d++) centroids[c][d] = mean(members.map((m) => m[d]));
    }
    if (!changed) break;
  }

  let inertia = 0;
  for (let i = 0; i < points.length; i++) inertia += distTo(points[i], centroids[assignment[i]]);
  return { assignment, centroids, inertia };
}

function silhouette(points: number[][], assignment: number[], k: number): number {
  const n = points.length;
  if (n <= k) return 0;
  const dist = (a: number[], b: number[]) => {
    let s = 0;
    for (let d = 0; d < a.length; d++) s += (a[d] - b[d]) ** 2;
    return Math.sqrt(s);
  };
  let total = 0;
  for (let i = 0; i < n; i++) {
    const own = assignment[i];
    const same = [];
    for (let j = 0; j < n; j++) if (j !== i && assignment[j] === own) same.push(points[j]);
    if (same.length === 0) continue;
    const a = mean(same.map((p) => dist(points[i], p)));
    let b = Infinity;
    for (let c = 0; c < k; c++) {
      if (c === own) continue;
      const others = points.filter((_, j) => j !== i && assignment[j] === c);
      if (others.length === 0) continue;
      b = Math.min(b, mean(others.map((p) => dist(points[i], p))));
    }
    if (!isFinite(b)) continue;
    total += (b - a) / Math.max(a, b);
  }
  return total / n;
}

function labelCandidates(profile: Partial<Record<FeatureKey, number>>): ClusterLabelKey[] {
  const out: ClusterLabelKey[] = [];
  const stress = profile.stress;
  const sleep = profile.sleep;
  const steps = profile.steps;
  const mood = profile.mood;
  if (typeof stress === "number" && stress >= 6) out.push("mlClusterHighStress");
  if (typeof sleep === "number" && sleep <= 6.5) out.push("mlClusterLowSleep");
  if (typeof steps === "number" && steps >= 8000) out.push("mlClusterActive");
  if (typeof mood === "number" && mood >= 7 && typeof stress === "number" && stress <= 4.5) out.push("mlClusterRecovery");
  out.push("mlClusterBalanced");
  for (const label of LABEL_POOL) if (!out.includes(label)) out.push(label);
  return out;
}

export function clusterDays(features: DailyFeature[]): ClustersData | null {
  if (features.length < MIN_DAYS) return null;

  const coverage = new Map<FeatureKey, number>();
  for (const f of CANDIDATE_FEATURES) {
    const n = features.filter((x) => typeof x[f] === "number").length;
    coverage.set(f, n / features.length);
  }
  const active = CANDIDATE_FEATURES.filter((f) => (coverage.get(f) ?? 0) >= MIN_COVERAGE);
  if (active.length < 2) return null;

  const dayIndexes: number[] = [];
  for (let i = 0; i < features.length; i++) {
    const observed = active.filter((f) => typeof features[i][f] === "number").length;
    if (observed >= Math.min(MIN_VALUES_PER_DAY, active.length)) dayIndexes.push(i);
  }
  if (dayIndexes.length < MIN_DAYS) return null;

  const columns = active.map((f) => ({
    f,
    values: dayIndexes
      .map((i) => features[i][f])
      .filter((v): v is number => typeof v === "number"),
  }));
  const mins = columns.map((c) => (c.values.length ? Math.min(...c.values) : 0));
  const maxs = columns.map((c) => (c.values.length ? Math.max(...c.values) : 1));

  const normalized: Point[] = dayIndexes.map((dayIndex, row) => ({
    dayIndex,
    values: active.map((f, d) => {
      const raw = features[dayIndex][f];
      if (typeof raw !== "number") return 0.5;
      const span = maxs[d] - mins[d];
      return span === 0 ? 0.5 : clamp((raw - mins[d]) / span, 0, 1);
    }),
  }));

  const points = normalized.map((p) => p.values);
  const kMax = Math.min(MAX_K, Math.floor(points.length / 3));
  if (kMax < 2) return null;

  let best: { assignment: number[]; centroids: number[][]; k: number; silhouette: number } | null = null;
  for (let k = 2; k <= kMax; k++) {
    for (let r = 0; r < RESTARTS; r++) {
      const run = kmeans(points, k, 97 + r * 31 + k);
      const score = silhouette(points, run.assignment, k);
      if (!best || score > best.silhouette) {
        best = { assignment: run.assignment, centroids: run.centroids, k, silhouette: score };
      }
    }
  }
  if (!best) return null;

  const rawClusters: { size: number; profile: Partial<Record<FeatureKey, number>>; order: number }[] = [];
  for (let c = 0; c < best.k; c++) {
    const members = normalized.filter((_, i) => best!.assignment[i] === c);
    if (members.length === 0) continue;
    const profile: Partial<Record<FeatureKey, number>> = {};
    active.forEach((f, d) => {
      const meanNorm = mean(members.map((m) => m.values[d]));
      profile[f] = roundFor(f, mins[d] + meanNorm * (maxs[d] - mins[d]));
    });
    rawClusters.push({ size: members.length, profile, order: c });
  }

  const bySize = [...rawClusters].sort((a, b) => b.size - a.size);
  const used = new Set<ClusterLabelKey>();
  const labels = new Map<number, ClusterLabelKey>();
  for (const cluster of bySize) {
    const candidates = labelCandidates(cluster.profile);
    const pick = candidates.find((c) => !used.has(c)) ?? "mlClusterBalanced";
    used.add(pick);
    labels.set(cluster.order, pick);
  }

  const clusters: ClusterInsight[] = rawClusters.map((c) => ({
    labelKey: labels.get(c.order) ?? "mlClusterBalanced",
    size: c.size,
    profile: c.profile,
  }));

  return {
    sampleDays: features.length,
    k: clusters.length,
    silhouette: round(best.silhouette, 3),
    clusters,
  };
}
