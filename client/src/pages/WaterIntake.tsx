import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Droplets, Plus, Target, Loader2, CheckCircle2, TrendingUp } from "lucide-react";
import { format, subDays } from "date-fns";
import { useToast } from "@/hooks/use-toast";

const DEFAULT_TARGET_ML = 2500;

// ─── API Hooks ────────────────────────────────────────────────────────────────

function useWaterEntries() {
  return useQuery({
    queryKey: ["/api/water-entries"],
    queryFn: async () => {
      const res = await fetch("/api/water-entries");
      if (!res.ok) throw new Error("Failed to load");
      return res.json();
    },
  });
}

function useAddWater() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: { amountMl: number; date: string }) => {
      const res = await fetch("/api/water-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed to log water");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/water-entries"] }),
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mlToL(ml: number) {
  return (ml / 1000).toFixed(1);
}

function getProgressColor(pct: number) {
  if (pct >= 100) return "bg-teal-500";
  if (pct >= 70)  return "bg-blue-400";
  if (pct >= 40)  return "bg-amber-400";
  return "bg-red-400";
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function WaterIntake() {
  const { toast } = useToast();
  const { data: entries = [], isLoading } = useWaterEntries();
  const { mutate: addWater, isPending } = useAddWater();

  const [customMl, setCustomMl] = useState("");
  const [showCustom, setShowCustom] = useState(false);
  const [targetMl] = useState(DEFAULT_TARGET_ML);

  const today = format(new Date(), "yyyy-MM-dd");

  // Total for today
  const todayTotal = useMemo(() => {
    return (entries as any[])
      .filter((e: any) => e.date === today)
      .reduce((sum: number, e: any) => sum + e.amountMl, 0);
  }, [entries, today]);

  const progress = Math.min(100, Math.round((todayTotal / targetMl) * 100));

  // Last 7 days
  const last7 = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
      const d = format(subDays(new Date(), 6 - i), "yyyy-MM-dd");
      const total = (entries as any[])
        .filter((e: any) => e.date === d)
        .reduce((sum: number, e: any) => sum + e.amountMl, 0);
      return { date: d, total };
    });
  }, [entries]);

  const handleAdd = (ml: number) => {
    if (!ml || ml <= 0) return;
    addWater({ amountMl: ml, date: today }, {
      onSuccess: () => toast({ title: `+${ml} ml added`, description: `Total today: ${mlToL(todayTotal + ml)} L` }),
      onError: () => toast({ title: "Failed to log water", variant: "destructive" }),
    });
  };

  const handleCustomAdd = () => {
    const val = parseInt(customMl, 10);
    if (!val || val <= 0 || val > 5000) {
      toast({ title: "Enter a valid amount (1–5000 ml)", variant: "destructive" });
      return;
    }
    handleAdd(val);
    setCustomMl("");
    setShowCustom(false);
  };

  return (
    <div className="max-w-3xl mx-auto animate-in fade-in duration-500 space-y-8">
      {/* Header */}
      <header>
        <h1 className="text-4xl font-display font-bold text-slate-900 dark:text-white flex items-center gap-3">
          <Droplets className="w-8 h-8 text-sky-500" /> Water Intake
        </h1>
        <p className="text-muted-foreground mt-2">Track your daily hydration. Staying hydrated supports your wellbeing.</p>
      </header>

      {/* Today's Progress Card */}
      <div className="glass-card rounded-3xl p-8 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-lg text-slate-900 dark:text-white">Today</h2>
          <span className="text-sm text-muted-foreground flex items-center gap-1.5">
            <Target className="w-4 h-4" /> Target: {mlToL(targetMl)} L
          </span>
        </div>

        {/* Big progress display */}
        <div className="text-center py-4">
          <div className="text-6xl font-display font-bold text-sky-600 dark:text-sky-400">
            {mlToL(todayTotal)} L
          </div>
          <p className="text-muted-foreground mt-1">
            of {mlToL(targetMl)} L target · {progress}% complete
          </p>
          {progress >= 100 && (
            <div className="inline-flex items-center gap-2 mt-2 text-teal-600 font-semibold text-sm">
              <CheckCircle2 className="w-5 h-5" /> Daily target reached!
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${getProgressColor(progress)}`}
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Quick add buttons */}
        <div>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Quick add</p>
          <div className="grid grid-cols-3 gap-3">
            {[150, 250, 350, 500, 750, 1000].map((ml) => (
              <button
                key={ml}
                onClick={() => handleAdd(ml)}
                disabled={isPending}
                className="flex flex-col items-center justify-center py-4 rounded-2xl border-2 border-sky-200 dark:border-sky-900/50 bg-sky-50 dark:bg-sky-950/20 hover:bg-sky-100 dark:hover:bg-sky-950/40 text-sky-700 dark:text-sky-300 font-bold transition-all hover:scale-105 disabled:opacity-50"
              >
                <Plus className="w-4 h-4 mb-1" />
                <span>{ml >= 1000 ? `${ml / 1000} L` : `${ml} ml`}</span>
              </button>
            ))}
          </div>

          {/* Custom amount */}
          {showCustom ? (
            <div className="mt-3 flex gap-2">
              <div className="relative flex-1">
                <input
                  type="number"
                  value={customMl}
                  onChange={(e) => setCustomMl(e.target.value)}
                  placeholder="Amount in ml"
                  min={1}
                  max={5000}
                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-card focus:border-sky-500 outline-none text-sm"
                  onKeyDown={(e) => e.key === "Enter" && handleCustomAdd()}
                  autoFocus
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">ml</span>
              </div>
              <button
                onClick={handleCustomAdd}
                disabled={isPending}
                className="px-5 py-3 rounded-xl bg-sky-600 text-white font-bold hover:bg-sky-700 disabled:opacity-50 transition-colors"
              >
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add"}
              </button>
              <button
                onClick={() => { setShowCustom(false); setCustomMl(""); }}
                className="px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowCustom(true)}
              className="mt-3 w-full py-3 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 text-muted-foreground hover:text-foreground hover:border-sky-400 transition-all text-sm font-medium"
            >
              + Custom amount
            </button>
          )}
        </div>
      </div>

      {/* 7-day History */}
      <div className="glass-card rounded-3xl p-6 space-y-4">
        <h2 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-sky-500" /> Last 7 Days
        </h2>
        <div className="space-y-2">
          {last7.map(({ date: d, total }) => {
            const pct = Math.min(100, Math.round((total / targetMl) * 100));
            const isToday = d === today;
            return (
              <div key={d} className="flex items-center gap-3">
                <span className={`text-xs w-20 flex-shrink-0 font-medium ${isToday ? "text-sky-600 font-bold" : "text-muted-foreground"}`}>
                  {isToday ? "Today" : format(new Date(d + "T00:00:00"), "EEE, MMM d")}
                </span>
                <div className="flex-1 h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${getProgressColor(pct)}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground w-12 text-right">{mlToL(total)} L</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Wellness note */}
      <div className="text-xs text-muted-foreground text-center pb-4 leading-relaxed">
        Water intake tracking is for personal wellness reference only. Individual hydration needs vary.
        Consult a healthcare professional for personalised guidance.
      </div>
    </div>
  );
}
