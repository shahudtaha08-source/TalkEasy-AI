import { useState, useMemo } from "react";
import {
  Activity,
  Clock,
  Dumbbell,
  Flame,
  RefreshCw,
  Loader2,
  TrendingUp,
  Trash2,
} from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/i18n/LanguageContext";
import { useWorkouts, useExerciseCatalog, useLogWorkout, useDeleteWorkout } from "@/hooks/use-workouts";
import {
  EXERCISE_ACTIVITIES,
  estimateCalories,
  DEFAULT_WEIGHT_KG,
} from "@shared/exercise";

// ─── Category labels ──────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  strength: { label: "Strength", color: "text-indigo-600 dark:text-indigo-400" },
  cardio: { label: "Cardio", color: "text-red-600 dark:text-red-400" },
  mobility: { label: "Mobility", color: "text-amber-600 dark:text-amber-400" },
  sport: { label: "Sport", color: "text-purple-600 dark:text-purple-400" },
  mind_body: { label: "Mind & Body", color: "text-teal-600 dark:text-teal-400" },
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ExerciseTracker() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { data: workouts = [] } = useWorkouts();
  const { data: catalog } = useExerciseCatalog();
  const { mutate: logWorkout, isPending: logging } = useLogWorkout();
  const { mutate: deleteWorkout } = useDeleteWorkout();

  const activities = catalog?.activities ?? EXERCISE_ACTIVITIES;
  const categories = catalog?.categories ?? [];

  const [activityId, setActivityId] = useState("");
  const [durationSeconds, setDurationSeconds] = useState("");
  const [repetitions, setRepetitions] = useState("");
  const [sets, setSets] = useState("");
  const [distanceMeters, setDistanceMeters] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [source, setSource] = useState("manual");
  const [notes, setNotes] = useState("");

  const today = format(new Date(), "yyyy-MM-dd");

  const activity = useMemo(
    () => activities.find((a: any) => a.id === activityId),
    [activities, activityId],
  );

  const trackingModes = activity?.tracking ?? [];
  const supportsGps = activity?.supportsGps ?? false;
  const supportsSteps = activity?.supportsSteps ?? false;

  // Estimated calories (MET-based). Clearly labelled as an estimate — never a measurement.
  const estimate = useMemo(() => {
    if (!activityId || !durationSeconds) return null;
    const secs = Number(durationSeconds);
    const weight = weightKg ? Number(weightKg) : undefined;
    return estimateCalories({ activityId, durationSeconds: secs, weightKg: weight });
  }, [activityId, durationSeconds, weightKg]);

  const todayWorkouts = useMemo(
    () => (workouts as any[]).filter((w) => w.date === today),
    [workouts, today],
  );

  const totalDuration = useMemo(
    () =>
      todayWorkouts.reduce((sum, w) => sum + Number(w.durationSeconds || 0), 0),
    [todayWorkouts],
  );

  const handleLog = () => {
    if (!activityId || !durationSeconds) return;
    const secs = Number(durationSeconds);
    if (!Number.isFinite(secs) || secs <= 0) {
      toast({ title: "Enter a valid duration", variant: "destructive" });
      return;
    }

    logWorkout({
      activityId,
      category: activity?.category ?? "",
      source,
      startedAt: new Date().toISOString(),
      durationSeconds: secs,
      repetitions: repetitions ? Number(repetitions) : null,
      sets: sets ? Number(sets) : null,
      distanceMeters: distanceMeters ? Number(distanceMeters) : null,
      weightKg: weightKg ? Number(weightKg) : null,
      notes: notes.trim() || undefined,
    });
  };

  const handleDelete = (id: number) => {
    if (!window.confirm("Delete this workout session?")) return;
    deleteWorkout(id, {
      onError: () => toast({ title: "Failed to delete workout", variant: "destructive" }),
    });
  };

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in duration-500 space-y-8">
      {/* Header */}
      <header>
        <div className="flex items-center gap-3">
          <Dumbbell className="w-8 h-8 text-teal-600" />
          <h1 className="text-4xl font-display font-bold text-slate-900 dark:text-white">
            Exercise Tracker
          </h1>
        </div>
        <p className="text-muted-foreground mt-2">
          Log your activity sessions. Calorie figures are estimates based on
          duration and body weight — not measured values.
        </p>
      </header>

      {/* Log a workout */}
      <section className="glass-card rounded-3xl p-6 sm:p-8 space-y-6">
        <h2 className="font-bold text-base text-slate-900 dark:text-white">
          Log a session
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Activity
            </label>
            <select
              value={activityId}
              onChange={(e) => setActivityId(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-background bg-card focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 outline-none text-slate-900 dark:text-slate-100"
            >
              <option value="">Select an activity</option>
              {activities.map((a: any) => (
                <option key={a.id} value={a.id}>
                  {a.nameKey
                    .replace("exercise", "")
                    .replace(/_/g, " ")
                    .replace(/\b\w/g, (c: string) => c.toUpperCase())}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Duration (minutes)
            </label>
            <input
              type="number"
              value={durationSeconds ? String(Math.round(Number(durationSeconds) / 60)) : ""}
              onChange={(e) => setDurationSeconds(String(Number(e.target.value || 0) * 60))}
              min="1"
              className="w-full px-4 py-3 rounded-xl border border-background bg-card focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 outline-none text-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="space-y-2 lg:col-span-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Source
            </label>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-background bg-card focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 outline-none text-slate-900 dark:text-slate-100"
            >
              <option value="manual">Manual entry</option>
              {supportsGps && <option value="gps">Phone GPS</option>}
              {supportsSteps && <option value="phone_sensor">Phone step counter</option>}
            </select>
            <p className="text-xs text-muted-foreground mt-1">
              How this session was recorded.
            </p>
          </div>

          {trackingModes.includes("reps") && (
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Repetitions
              </label>
              <input
                type="number"
                value={repetitions}
                onChange={(e) => setRepetitions(e.target.value)}
                min="0"
                className="w-full px-4 py-3 rounded-xl border border-background bg-card focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 outline-none text-slate-900 dark:text-slate-100"
              />
            </div>
          )}

          {trackingModes.includes("sets") && (
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Sets
              </label>
              <input
                type="number"
                value={sets}
                onChange={(e) => setSets(e.target.value)}
                min="1"
                className="w-full px-4 py-3 rounded-xl border border-background bg-card focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 outline-none text-slate-900 dark:text-slate-100"
              />
            </div>
          )}

          {trackingModes.includes("distance") && (
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Distance (meters)
              </label>
              <input
                type="number"
                value={distanceMeters}
                onChange={(e) => setDistanceMeters(e.target.value)}
                min="0"
                className="w-full px-4 py-3 rounded-xl border border-background bg-card focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 outline-none text-slate-900 dark:text-slate-100"
              />
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Body weight (kg, optional)
            </label>
            <input
              type="number"
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
              min="20"
              max="400"
              className="w-full px-4 py-3 rounded-xl border border-background bg-card focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 outline-none text-slate-900 dark:text-slate-100"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Leaving blank uses {DEFAULT_WEIGHT_KG} kg assumption.
            </p>
          </div>

          <div className="space-y-2 lg:col-span-3">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full px-4 py-3 rounded-xl border border-background bg-card focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 outline-none text-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="lg:col-span-3 flex items-end">
            <button
              type="button"
              disabled={logging || !activityId || !durationSeconds}
              onClick={handleLog}
              className="px-6 py-3 rounded-xl bg-teal-600 text-white font-bold hover:bg-teal-700 transition-colors disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-teal-600/20"
            >
              {logging ? <Loader2 className="w-5 h-5 animate-spin" /> : <Activity className="w-5 h-5" />}
              Log Session
            </button>
          </div>
        </div>

        {/* Estimated calories (shown before logging, clearly labelled as estimate) */}
        {estimate && (
          <div className="bg-accent/50 border border-accent/30 rounded-2xl p-4 flex items-center gap-3">
            <Flame className="w-5 h-5 text-accent-foreground" />
            <div>
              <p className="text-xs text-accent-foreground/70 uppercase tracking-wider font-semibold">
                Estimated energy
              </p>
              <p className="text-base font-bold text-accent-foreground">
                {estimate.kcal} kcal
              </p>
              <p className="text-xs text-accent-foreground/70 mt-0.5">
                MET {estimate.met} · {estimate.weightAssumed ? `Weight assumed ({DEFAULT_WEIGHT_KG} kg)` : `Weight ${estimate.weightKg} kg`}
              </p>
            </div>
          </div>
        )}
      </section>

      {/* Today's sessions */}
      <section className="glass-card rounded-3xl p-6 sm:p-8 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-teal-600" /> Today&apos;s Sessions
          </h2>
          <span className="text-xs font-semibold text-muted-foreground">
            {totalDuration} min logged today
          </span>
        </div>

        {todayWorkouts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <RefreshCw className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p>No sessions logged yet today.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {todayWorkouts.map((w) => {
              const act = activities.find((a: any) => a.id === w.activityId);
              const cat = CATEGORY_LABELS[w.category ?? ""];
              return (
                <div key={w.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border border-border/50">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg flex items-center justify-center bg-teal-100 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400">
                      {act?.nameKey?.charAt(0)?.toUpperCase() ?? "?"}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        {act?.nameKey
                          ?.replace("exercise", "")
                          .replace(/_/g, " ")
                          .replace(/\b\w/g, (c: string) => c.toUpperCase()) ?? w.activityId}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {cat?.label} · {w.source}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {Math.round(Number(w.durationSeconds || 0) / 60)} min
                    </p>
                    {w.caloriesKcal != null && (
                      <p className="text-xs text-muted-foreground">
                        ~{w.caloriesKcal} kcal (est.)
                      </p>
                    )}
                    <div className="flex items-center gap-1 mt-1">
                      <button
                        onClick={() => handleDelete(w.id)}
                        className="text-xs text-destructive hover:underline"
                      >
                        <Trash2 className="w-3 h-3 mr-1" /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Recent history */}
      <section className="glass-card rounded-3xl p-6 sm:p-8 space-y-4">
        <h2 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-teal-600" /> Recent History
        </h2>
        {workouts.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            No history yet. Log your first session above.
          </p>
        ) : (
          <div className="space-y-2">
            {(workouts as any[])
              .slice(0, 10)
              .map((w) => {
                const date = format(new Date(w.startedAt || w.date), "MMM d");
                return (
                  <div key={w.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border border-border/50">
                    <div className="flex items-center gap-3">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{date}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        {w.category}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {Math.round(Number(w.durationSeconds || 0) / 60)} min
                      </p>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </section>
    </div>
  );
}
