/**
 * TalkEasy v6.2.0 — phone-based exercise & activity tracking domain.
 *
 * This module is deliberately free of any AI. It defines the catalogue of
 * trackable activities, a deterministic (MET-based) calorie estimate, a
 * deterministic repetition-counting state machine that a future camera phase
 * may feed angle samples into, and strict validation for persisted sessions.
 *
 * Honesty rules baked in here:
 *  - Nothing invents sensor values. If a metric was not supplied it stays
 *    `null`/absent — it never silently becomes 0.
 *  - Calories are always an *estimate* with an explicit assumption (body
 *    weight), never presented as a measured value.
 *  - Camera-sourced sessions are rejected: on-device pose recognition is not
 *    part of v6.2.0.
 */

export type ExerciseCategory = "strength" | "cardio" | "mobility" | "sport" | "mind_body";

export interface ExerciseCategoryInfo {
  key: ExerciseCategory;
  labelKey: string;
}

export const EXERCISE_CATEGORIES: ExerciseCategoryInfo[] = [
  { key: "strength", labelKey: "exerciseCategoryStrength" },
  { key: "cardio", labelKey: "exerciseCategoryCardio" },
  { key: "mobility", labelKey: "exerciseCategoryMobility" },
  { key: "sport", labelKey: "exerciseCategorySport" },
  { key: "mind_body", labelKey: "exerciseCategoryMindBody" },
];

/** How an activity's effort is measured. */
export type TrackingMode = "reps" | "sets" | "duration" | "distance";

export interface ExerciseActivityInfo {
  id: string;
  category: ExerciseCategory;
  nameKey: string;
  /** The modes of measurement this activity understands. */
  tracking: TrackingMode[];
  /** Compendium-style MET value for a moderate-effort session (used for estimates). */
  met: number;
  /** True when phone GPS can meaningfully measure the session. */
  supportsGps?: boolean;
  /** True when the phone's step counter can meaningfully measure the session. */
  supportsSteps?: boolean;
}

/**
 * A compact, documented activity registry. MET values are approximate
 * compendium values for moderate effort and are only used to *estimate*
 * energy expenditure — never to claim a measurement.
 */
export const EXERCISE_ACTIVITIES: ExerciseActivityInfo[] = [
  // strength
  { id: "pushups", category: "strength", nameKey: "exercisePushups", tracking: ["reps", "sets"], met: 7.5 },
  { id: "squats", category: "strength", nameKey: "exerciseSquats", tracking: ["reps", "sets"], met: 5.0 },
  { id: "situps", category: "strength", nameKey: "exerciseSitups", tracking: ["reps", "sets"], met: 8.0 },
  { id: "pullups", category: "strength", nameKey: "exercisePullups", tracking: ["reps", "sets"], met: 8.0 },
  { id: "lunges", category: "strength", nameKey: "exerciseLunges", tracking: ["reps", "sets"], met: 6.0 },
  { id: "kettlebell_swing", category: "strength", nameKey: "exerciseKettlebellSwing", tracking: ["reps", "sets"], met: 9.8 },
  // cardio
  { id: "walking", category: "cardio", nameKey: "exerciseWalking", tracking: ["duration", "distance"], met: 3.5, supportsGps: true, supportsSteps: true },
  { id: "running", category: "cardio", nameKey: "exerciseRunning", tracking: ["duration", "distance"], met: 9.8, supportsGps: true, supportsSteps: true },
  { id: "cycling", category: "cardio", nameKey: "exerciseCycling", tracking: ["duration", "distance"], met: 7.5, supportsGps: true },
  { id: "jump_rope", category: "cardio", nameKey: "exerciseJumpRope", tracking: ["duration"], met: 12.3, supportsSteps: true },
  { id: "rowing", category: "cardio", nameKey: "exerciseRowing", tracking: ["duration", "distance"], met: 7.0 },
  { id: "elliptical", category: "cardio", nameKey: "exerciseElliptical", tracking: ["duration"], met: 5.0 },
  // mobility
  { id: "stretching", category: "mobility", nameKey: "exerciseStretching", tracking: ["duration"], met: 2.3 },
  { id: "pilates", category: "mobility", nameKey: "exercisePilates", tracking: ["duration"], met: 3.0 },
  // sport
  { id: "basketball", category: "sport", nameKey: "exerciseBasketball", tracking: ["duration"], met: 6.5 },
  { id: "football", category: "sport", nameKey: "exerciseFootball", tracking: ["duration"], met: 7.0 },
  { id: "badminton", category: "sport", nameKey: "exerciseBadminton", tracking: ["duration"], met: 5.5 },
  { id: "swimming", category: "sport", nameKey: "exerciseSwimming", tracking: ["duration"], met: 8.0 },
  // mind_body
  { id: "yoga", category: "mind_body", nameKey: "exerciseYoga", tracking: ["duration"], met: 2.5 },
  { id: "tai_chi", category: "mind_body", nameKey: "exerciseTaiChi", tracking: ["duration"], met: 3.0 },
];

export function activityById(id: string): ExerciseActivityInfo | undefined {
  return EXERCISE_ACTIVITIES.find((a) => a.id === id);
}

export function categoryLabelKey(category: string): string | undefined {
  return EXERCISE_CATEGORIES.find((c) => c.key === category)?.labelKey;
}

/** Body weight used when the user has not supplied one. Clearly surfaced. */
export const DEFAULT_WEIGHT_KG = 70;

/* ── Deterministic calorie estimate ───────────────────────────────────────── */

export interface CalorieEstimateInput {
  activityId: string;
  durationSeconds: number;
  /** User's body weight; falls back to DEFAULT_WEIGHT_KG when absent. */
  weightKg?: number | null;
}

export interface CalorieEstimate {
  kcal: number;
  met: number;
  weightKg: number;
  /** True when DEFAULT_WEIGHT_KG was substituted, so the UI can flag it. */
  weightAssumed: boolean;
  method: "met";
}

const MIN_WEIGHT_KG = 20;
const MAX_WEIGHT_KG = 400;

/**
 * MET-based energy estimate: kcal = MET × 3.5 × kg / 200 × minutes.
 * Returns null when the activity is unknown or the duration is not positive;
 * it never fabricates a number from missing inputs.
 */
export function estimateCalories(input: CalorieEstimateInput): CalorieEstimate | null {
  const activity = activityById(input.activityId);
  if (!activity) return null;
  const seconds = Number(input.durationSeconds);
  if (!Number.isFinite(seconds) || seconds <= 0) return null;

  const provided = input.weightKg;
  const hasWeight = typeof provided === "number" && Number.isFinite(provided) && provided >= MIN_WEIGHT_KG && provided <= MAX_WEIGHT_KG;
  const weightKg = hasWeight ? (provided as number) : DEFAULT_WEIGHT_KG;

  const minutes = seconds / 60;
  const kcal = (activity.met * 3.5 * weightKg) / 200 * minutes;
  return {
    kcal: Math.round(kcal),
    met: activity.met,
    weightKg,
    weightAssumed: !hasWeight,
    method: "met",
  };
}

/* ── Deterministic repetition counting (no AI) ─────────────────────────────── */

export interface RepCounterConfig {
  /** Angle at/below which the joint is considered flexed (bottom of a rep). */
  flexedAngle: number;
  /** Angle at/above which the joint is considered extended (top of a rep). */
  extendedAngle: number;
  /** Minimum time between counted reps; guards against jitter/double counts. */
  minRepMs: number;
}

export const DEFAULT_REP_CONFIG: RepCounterConfig = {
  flexedAngle: 85,
  extendedAngle: 150,
  minRepMs: 300,
};

export interface RepSample {
  /** Joint angle in degrees for this frame, or null when it could not be read. */
  angle: number | null;
  /** Monotonic timestamp in milliseconds. */
  atMs: number;
}

export interface RepCounterResult {
  reps: number;
  phase: "extended" | "flexed";
  /** True when this sample completed a new repetition. */
  counted: boolean;
  /** True when the frame was unusable (no angle) and was skipped. */
  uncertain: boolean;
  /** True when a duplicate or out-of-order frame was rejected. */
  duplicate: boolean;
  /** True when a cycle completed too fast to trust (not counted). */
  rejectedFast: boolean;
}

/**
 * Frame-driven state machine: a repetition is counted only after a full
 * extended → flexed → extended cycle, with duplicate-frame and minimum-duration
 * protection. It is the reusable core a future camera pose estimator would feed
 * with joint angles; today it is unit-tested directly and can be advanced by
 * explicit manual taps (which are labelled as manual, not AI).
 */
export class RepCounter {
  private readonly config: RepCounterConfig;
  private phase: "extended" | "flexed" = "extended";
  private reps = 0;
  private flexedAtMs = Number.NEGATIVE_INFINITY;
  private lastSampleAtMs = Number.NEGATIVE_INFINITY;

  constructor(config: Partial<RepCounterConfig> = {}) {
    this.config = { ...DEFAULT_REP_CONFIG, ...config };
  }

  get count(): number {
    return this.reps;
  }

  get currentPhase(): "extended" | "flexed" {
    return this.phase;
  }

  reset(): void {
    this.phase = "extended";
    this.reps = 0;
    this.flexedAtMs = Number.NEGATIVE_INFINITY;
    this.lastSampleAtMs = Number.NEGATIVE_INFINITY;
  }

  ingest(sample: RepSample): RepCounterResult {
    const base: RepCounterResult = {
      reps: this.reps,
      phase: this.phase,
      counted: false,
      uncertain: false,
      duplicate: false,
      rejectedFast: false,
    };

    if (sample.angle === null || !Number.isFinite(sample.angle)) {
      return { ...base, uncertain: true };
    }

    const atMs = Number(sample.atMs);
    if (!Number.isFinite(atMs) || atMs <= this.lastSampleAtMs) {
      return { ...base, duplicate: true };
    }
    this.lastSampleAtMs = atMs;

    const angle = sample.angle;

    if (this.phase === "extended" && angle <= this.config.flexedAngle) {
      this.phase = "flexed";
      this.flexedAtMs = atMs;
      return { ...base, phase: this.phase };
    }

    if (this.phase === "flexed" && angle >= this.config.extendedAngle) {
      // A full cycle that completes faster than a human could perform it is
      // treated as sensor noise and not counted.
      if (atMs - this.flexedAtMs < this.config.minRepMs) {
        return { ...base, rejectedFast: true };
      }
      this.reps += 1;
      this.phase = "extended";
      return { ...base, reps: this.reps, phase: this.phase, counted: true };
    }

    return base;
  }
}

/* ── Session validation ────────────────────────────────────────────────────── */

/** Sources a session can legitimately come from in v6.2.0. */
export const WORKOUT_SOURCES = ["manual", "phone_sensor", "gps"] as const;
export type WorkoutSource = (typeof WORKOUT_SOURCES)[number];

/** Declared but not yet supported: on-device pose recognition is deferred. */
export const DEFERRED_WORKOUT_SOURCES = ["camera"] as const;

export interface WorkoutSessionInput {
  activityId: string;
  category: string;
  source: string;
  startedAt: string;
  durationSeconds: number;
  repetitions?: number | null;
  sets?: number | null;
  distanceMeters?: number | null;
  weightKg?: number | null;
  /** Optional client-side estimate. The server recomputes the canonical value. */
  caloriesKcal?: number | null;
  notes?: string | null;
}

export interface ValidatedWorkoutSession {
  activityId: string;
  category: ExerciseCategory;
  source: WorkoutSource;
  startedAt: Date;
  durationSeconds: number;
  repetitions: number | null;
  sets: number | null;
  distanceMeters: number | null;
  weightKg: number | null;
  /** Canonical, server-computed estimate — never the client's number. */
  caloriesKcal: number;
  caloriesEstimated: boolean;
  weightAssumed: boolean;
  met: number;
  notes: string | null;
}

export type ValidationResult =
  | { ok: true; value: ValidatedWorkoutSession }
  | { ok: false; error: string; field?: string };

const MAX_DURATION_SECONDS = 24 * 60 * 60;
const MAX_REPS = 100_000;
const MAX_SETS = 1_000;
const MAX_DISTANCE_METERS = 1_000_000;
const MAX_NOTES = 2_000;

function isIsoDate(v: string): boolean {
  return typeof v === "string" && !Number.isNaN(new Date(v).getTime());
}

/**
 * Validates and normalizes an incoming workout session. Rejects unknown
 * activities, category mismatches, unsupported sources (including the deferred
 * camera source) and out-of-range or non-finite numbers, so invalid data cannot
 * corrupt history or summaries.
 */
export function validateWorkoutSession(input: unknown, now: Date = new Date()): ValidationResult {
  if (!input || typeof input !== "object") return { ok: false, error: "Session must be an object" };
  const s = input as Record<string, unknown>;

  const activityId = String(s.activityId ?? "");
  const activity = activityById(activityId);
  if (!activity) return { ok: false, error: `Unknown activity: ${activityId || "(missing)"}`, field: "activityId" };

  const category = String(s.category ?? "");
  if (!EXERCISE_CATEGORIES.some((c) => c.key === category)) {
    return { ok: false, error: `Unknown category: ${category || "(missing)"}`, field: "category" };
  }
  if (category !== activity.category) {
    return { ok: false, error: `Category ${category} does not match activity ${activityId} (${activity.category})`, field: "category" };
  }

  const source = String(s.source ?? "");
  if ((DEFERRED_WORKOUT_SOURCES as readonly string[]).includes(source)) {
    return { ok: false, error: "Camera-based recognition is not part of this release", field: "source" };
  }
  if (!(WORKOUT_SOURCES as readonly string[]).includes(source)) {
    return { ok: false, error: `Unknown source: ${source || "(missing)"}`, field: "source" };
  }

  const startedAtRaw = String(s.startedAt ?? "");
  if (!isIsoDate(startedAtRaw)) return { ok: false, error: "startedAt is not a valid date", field: "startedAt" };
  const startedAt = new Date(startedAtRaw);
  if (startedAt.getTime() > now.getTime() + 5 * 60 * 1000) {
    return { ok: false, error: "startedAt is in the future", field: "startedAt" };
  }

  const durationSeconds = Number(s.durationSeconds);
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
    return { ok: false, error: "durationSeconds must be a positive number", field: "durationSeconds" };
  }
  if (durationSeconds > MAX_DURATION_SECONDS) {
    return { ok: false, error: "durationSeconds exceeds 24 hours", field: "durationSeconds" };
  }

  let repetitions: number | null = null;
  if (s.repetitions !== undefined && s.repetitions !== null) {
    const r = Number(s.repetitions);
    if (!Number.isInteger(r) || r < 0 || r > MAX_REPS) {
      return { ok: false, error: `repetitions must be an integer in [0, ${MAX_REPS}]`, field: "repetitions" };
    }
    repetitions = r;
  }

  let sets: number | null = null;
  if (s.sets !== undefined && s.sets !== null) {
    const v = Number(s.sets);
    if (!Number.isInteger(v) || v < 1 || v > MAX_SETS) {
      return { ok: false, error: `sets must be an integer in [1, ${MAX_SETS}]`, field: "sets" };
    }
    sets = v;
  }

  let distanceMeters: number | null = null;
  if (s.distanceMeters !== undefined && s.distanceMeters !== null) {
    const v = Number(s.distanceMeters);
    if (!Number.isFinite(v) || v < 0 || v > MAX_DISTANCE_METERS) {
      return { ok: false, error: `distanceMeters must be in [0, ${MAX_DISTANCE_METERS}]`, field: "distanceMeters" };
    }
    distanceMeters = v;
  }

  let weightKg: number | null = null;
  if (s.weightKg !== undefined && s.weightKg !== null) {
    const v = Number(s.weightKg);
    if (!Number.isFinite(v) || v < MIN_WEIGHT_KG || v > MAX_WEIGHT_KG) {
      return { ok: false, error: `weightKg must be in [${MIN_WEIGHT_KG}, ${MAX_WEIGHT_KG}]`, field: "weightKg" };
    }
    weightKg = v;
  }

  const notes = s.notes === undefined || s.notes === null ? null : String(s.notes);
  if (notes !== null && notes.length > MAX_NOTES) {
    return { ok: false, error: `notes must be at most ${MAX_NOTES} characters`, field: "notes" };
  }

  const estimate = estimateCalories({ activityId, durationSeconds, weightKg });
  if (!estimate) return { ok: false, error: "Could not estimate energy for this session", field: "durationSeconds" };

  return {
    ok: true,
    value: {
      activityId,
      category: activity.category,
      source: source as WorkoutSource,
      startedAt,
      durationSeconds: Math.round(durationSeconds),
      repetitions,
      sets,
      distanceMeters,
      weightKg,
      caloriesKcal: estimate.kcal,
      caloriesEstimated: true,
      weightAssumed: estimate.weightAssumed,
      met: estimate.met,
      notes,
    },
  };
}

/* ── Deterministic aggregation for history/summary ─────────────────────────── */

export interface WorkoutSummaryInput {
  category: string;
  durationSeconds: number;
  repetitions?: number | null;
  distanceMeters?: number | null;
  caloriesKcal?: number | null;
}

export interface WorkoutSummary {
  sessions: number;
  totalDurationSeconds: number;
  /** null when no session carried a calorie estimate (missing ≠ zero). */
  totalCaloriesKcal: number | null;
  totalRepetitions: number;
  totalDistanceMeters: number;
  byCategory: Record<string, number>;
}

/** Aggregates sessions deterministically; absent metrics stay absent. */
export function summarizeWorkouts(sessions: WorkoutSummaryInput[]): WorkoutSummary {
  const byCategory: Record<string, number> = {};
  let totalDurationSeconds = 0;
  let totalCaloriesKcal = 0;
  let sawCalories = false;
  let totalRepetitions = 0;
  let totalDistanceMeters = 0;

  for (const s of sessions) {
    byCategory[s.category] = (byCategory[s.category] ?? 0) + 1;
    if (Number.isFinite(s.durationSeconds)) totalDurationSeconds += s.durationSeconds;
    if (typeof s.caloriesKcal === "number" && Number.isFinite(s.caloriesKcal)) {
      totalCaloriesKcal += s.caloriesKcal;
      sawCalories = true;
    }
    if (typeof s.repetitions === "number" && Number.isFinite(s.repetitions)) totalRepetitions += s.repetitions;
    if (typeof s.distanceMeters === "number" && Number.isFinite(s.distanceMeters)) totalDistanceMeters += s.distanceMeters;
  }

  return {
    sessions: sessions.length,
    totalDurationSeconds,
    totalCaloriesKcal: sawCalories ? totalCaloriesKcal : null,
    totalRepetitions,
    totalDistanceMeters,
    byCategory,
  };
}
