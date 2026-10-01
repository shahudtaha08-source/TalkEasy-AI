import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Wind, AlertTriangle, CheckCircle, Loader2, RefreshCw, Info } from "lucide-react";
import { format, subDays } from "date-fns";
import { useToast } from "@/hooks/use-toast";

// ─── Stress Levels ────────────────────────────────────────────────────────────

const LEVELS = [
  {
    value: "Relaxed",
    emoji: "😌",
    color: "bg-teal-100 border-teal-300 dark:bg-teal-900/20 dark:border-teal-700",
    labelColor: "text-teal-700 dark:text-teal-400",
    activeRing: "ring-teal-500",
    desc: "You feel calm and at ease.",
  },
  {
    value: "Low",
    emoji: "🙂",
    color: "bg-green-100 border-green-300 dark:bg-green-900/20 dark:border-green-700",
    labelColor: "text-green-700 dark:text-green-400",
    activeRing: "ring-green-500",
    desc: "A little tension, but manageable.",
  },
  {
    value: "Moderate",
    emoji: "😐",
    color: "bg-amber-100 border-amber-300 dark:bg-amber-900/20 dark:border-amber-700",
    labelColor: "text-amber-700 dark:text-amber-400",
    activeRing: "ring-amber-500",
    desc: "Noticeable stress — a wellness pause can help.",
  },
  {
    value: "High",
    emoji: "😰",
    color: "bg-rose-100 border-rose-300 dark:bg-rose-900/20 dark:border-rose-700",
    labelColor: "text-rose-700 dark:text-rose-400",
    activeRing: "ring-rose-500",
    desc: "High stress — try an intervention now.",
  },
];

// ─── Interventions ────────────────────────────────────────────────────────────

const MODERATE_INTERVENTIONS = [
  {
    title: "2-Minute Box Breathing",
    desc: "Inhale 4 counts → Hold 4 → Exhale 4 → Hold 4. Repeat for 2 minutes.",
    icon: Wind,
  },
  {
    title: "5-4-3-2-1 Grounding",
    desc: "Notice 5 things you see, 4 you can touch, 3 you hear, 2 you smell, 1 you taste.",
    icon: CheckCircle,
  },
  {
    title: "Quick Stretch Break",
    desc: "Stand up. Roll your shoulders, stretch your neck gently, shake out your hands. 2 minutes.",
    icon: RefreshCw,
  },
  {
    title: "Short Walk",
    desc: "A 5–10 minute walk outside or around the room can help clear your mind.",
    icon: CheckCircle,
  },
  {
    title: "Screen Break",
    desc: "Look away from screens. Focus on something distant. Rest your eyes for 2 minutes.",
    icon: Wind,
  },
];

const HIGH_INTERVENTIONS = [
  {
    title: "Slow Diaphragmatic Breathing",
    desc: "Place a hand on your belly. Breathe in slowly (5–6 counts) so your belly rises. Exhale slowly. Repeat 10 times.",
    icon: Wind,
  },
  {
    title: "Cold Water Reset",
    desc: "Splash cold water on your face and wrists. Drink a glass of water slowly.",
    icon: RefreshCw,
  },
  {
    title: "Reach Out",
    desc: "Text or call someone you trust. You don't have to be alone with high stress.",
    icon: CheckCircle,
  },
  {
    title: "Write It Out",
    desc: "Open your journal and write freely for 5 minutes. Don't worry about structure — just write.",
    icon: CheckCircle,
  },
];

// ─── API Hooks ────────────────────────────────────────────────────────────────

function useStressEntries() {
  return useQuery({
    queryKey: ["/api/stress-entries"],
    queryFn: async () => {
      const res = await fetch("/api/stress-entries");
      if (!res.ok) return [];
      return res.json();
    },
  });
}

function useLogStress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: { level: string; note?: string; date: string }) => {
      const res = await fetch("/api/stress-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/stress-entries"] }),
  });
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function StressTracker() {
  const { toast } = useToast();
  const { data: entries = [] } = useStressEntries();
  const { mutate: logStress, isPending } = useLogStress();

  const [selected, setSelected] = useState("");
  const [note, setNote] = useState("");
  const [logged, setLogged] = useState(false);
  const [loggedLevel, setLoggedLevel] = useState("");

  const today = format(new Date(), "yyyy-MM-dd");

  const last7 = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
      const d = format(subDays(new Date(), 6 - i), "yyyy-MM-dd");
      const entry = (entries as any[]).find((e: any) => e.date === d);
      return { date: d, level: entry?.level || null };
    });
  }, [entries]);

  const todayEntry = useMemo(
    () => (entries as any[]).find((e: any) => e.date === today),
    [entries, today]
  );

  const interventions =
    selected === "High"
      ? HIGH_INTERVENTIONS
      : selected === "Moderate"
      ? MODERATE_INTERVENTIONS
      : [];

  const handleLog = () => {
    if (!selected) return;
    logStress({ level: selected, note: note.trim() || undefined, date: today }, {
      onSuccess: () => {
        toast({ title: "Stress level logged." });
        setLoggedLevel(selected);
        setLogged(true);
      },
      onError: () => toast({ title: "Failed to log stress", variant: "destructive" }),
    });
  };

  const levelConfig = (level: string) => LEVELS.find((l) => l.value === level);

  return (
    <div className="max-w-3xl mx-auto animate-in fade-in duration-500 space-y-8">
      {/* Header */}
      <header>
        <h1 className="text-4xl font-display font-bold text-slate-900 dark:text-white flex items-center gap-3">
          <AlertTriangle className="w-8 h-8 text-amber-500" /> Stress Tracker
        </h1>
        <p className="text-muted-foreground mt-2">
          Log your stress level and get wellness suggestions. Not a diagnostic tool.
        </p>
      </header>

      {/* Already logged or just logged */}
      {(logged || todayEntry) ? (
        <div className="glass-card rounded-3xl p-8 text-center space-y-4">
          <div className="text-5xl">
            {levelConfig(loggedLevel || todayEntry?.level)?.emoji || "😐"}
          </div>
          <h2 className="text-2xl font-bold">
            Today: <span className={levelConfig(loggedLevel || todayEntry?.level)?.labelColor}>
              {loggedLevel || todayEntry?.level}
            </span>
          </h2>
          {(loggedLevel === "Moderate" || todayEntry?.level === "Moderate") && (
            <InterventionCards interventions={MODERATE_INTERVENTIONS} level="Moderate" />
          )}
          {(loggedLevel === "High" || todayEntry?.level === "High") && (
            <InterventionCards interventions={HIGH_INTERVENTIONS} level="High" />
          )}
        </div>
      ) : (
        /* Logging form */
        <div className="glass-card rounded-3xl p-8 space-y-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            How stressed are you feeling right now?
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {LEVELS.map((l) => (
              <button
                key={l.value}
                type="button"
                onClick={() => setSelected(l.value)}
                className={`flex flex-col items-center justify-center p-5 rounded-2xl border-2 transition-all duration-200 ${l.color} ${
                  selected === l.value
                    ? `ring-4 ring-offset-2 ${l.activeRing} scale-105 shadow-lg`
                    : "opacity-75 hover:opacity-100"
                }`}
              >
                <span className="text-3xl mb-2">{l.emoji}</span>
                <span className={`font-bold text-sm ${l.labelColor}`}>{l.value}</span>
              </button>
            ))}
          </div>

          {selected && (
            <p className="text-sm text-center text-muted-foreground">
              {levelConfig(selected)?.desc}
            </p>
          )}

          {/* Optional note */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Note <span className="font-normal text-muted-foreground">(optional)</span>
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="What's contributing to your stress level?"
              className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-card focus:border-amber-500 outline-none text-sm"
            />
          </div>

          {/* Preview interventions before logging */}
          {(selected === "Moderate" || selected === "High") && (
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-xl p-4">
              <p className="text-sm font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-2 mb-1">
                <Info className="w-4 h-4" /> Wellness suggestions will appear after logging.
              </p>
              <p className="text-xs text-amber-600 dark:text-amber-500">
                These are general wellness activities — not medical advice.
              </p>
            </div>
          )}

          <button
            onClick={handleLog}
            disabled={isPending || !selected}
            className="w-full py-4 rounded-xl bg-amber-500 text-white font-bold text-lg hover:bg-amber-600 disabled:opacity-50 transition-all shadow-lg shadow-amber-500/20 flex justify-center items-center gap-2"
          >
            {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
            Log Stress Level
          </button>
        </div>
      )}

      {/* 7-day History */}
      {last7.some((d) => d.level) && (
        <div className="glass-card rounded-3xl p-6 space-y-4">
          <h2 className="font-bold text-base text-slate-900 dark:text-white">Last 7 Days</h2>
          <div className="flex items-end gap-2">
            {last7.map(({ date: d, level }) => {
              const cfg = levelConfig(level || "");
              const isToday = d === today;
              const barH = level === "High" ? "h-16" : level === "Moderate" ? "h-12" : level === "Low" ? "h-8" : level === "Relaxed" ? "h-6" : "h-2";
              return (
                <div key={d} className="flex-1 flex flex-col items-center gap-1">
                  <div className={`w-full rounded-t-lg transition-all ${barH} ${
                    level === "High"     ? "bg-rose-400" :
                    level === "Moderate" ? "bg-amber-400" :
                    level === "Low"      ? "bg-green-400" :
                    level === "Relaxed"  ? "bg-teal-400" :
                    "bg-slate-200 dark:bg-slate-700"
                  }`} title={level || "No data"} />
                  <span className={`text-[9px] font-medium ${isToday ? "text-teal-600" : "text-muted-foreground"}`}>
                    {format(new Date(d + "T00:00:00"), "EEE")}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <p className="text-xs text-center text-muted-foreground pb-4">
        Stress tracking is for personal wellness awareness only. This tool does not diagnose, measure, or
        replace professional mental health support. If you are in crisis, please contact a professional or call 14416.
      </p>
    </div>
  );
}

// ─── Intervention Cards ───────────────────────────────────────────────────────

function InterventionCards({
  interventions,
  level,
}: {
  interventions: { title: string; desc: string; icon: any }[];
  level: string;
}) {
  return (
    <div className="text-left mt-4 space-y-3">
      <p className={`text-sm font-bold text-center ${level === "High" ? "text-rose-600" : "text-amber-700 dark:text-amber-400"}`}>
        {level === "High"
          ? "High stress detected — try one of these wellness activities:"
          : "Wellness suggestions for moderate stress:"}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {interventions.map((iv) => (
          <div
            key={iv.title}
            className={`p-4 rounded-2xl border ${
              level === "High"
                ? "border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/20"
                : "border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/20"
            }`}
          >
            <p className={`font-bold text-sm mb-1 ${level === "High" ? "text-rose-700 dark:text-rose-400" : "text-amber-700 dark:text-amber-400"}`}>
              {iv.title}
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{iv.desc}</p>
          </div>
        ))}
      </div>
      <p className="text-[10px] text-center text-muted-foreground mt-2">
        These are general wellness suggestions, not medical advice. If stress is persistent or severe, please consult a professional.
      </p>
    </div>
  );
}
