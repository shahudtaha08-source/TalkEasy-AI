import { useState } from "react";
import { useMoods, useCreateMood } from "@/hooks/use-moods";
import { format } from "date-fns";
import {
  Smile, Frown, Meh, Angry, Loader2, Check, ArrowLeft, ArrowRight,
  Heart, Zap, Moon, Coffee, Users, Home, Star, BookOpen, Minus, Plus
} from "lucide-react";
import { useTranslation } from "@/i18n/LanguageContext";
import { useToast } from "@/hooks/use-toast";

// ─── Mood Options ─────────────────────────────────────────────────────────────

const MOODS = [
  { value: "Happy",       emoji: "😊", color: "bg-yellow-100 border-yellow-200 dark:bg-yellow-900/20", active: "ring-yellow-500",   label: "Happy" },
  { value: "Calm",        emoji: "😌", color: "bg-teal-100 border-teal-200 dark:bg-teal-900/20",       active: "ring-teal-500",     label: "Calm" },
  { value: "Excited",     emoji: "🤩", color: "bg-orange-100 border-orange-200 dark:bg-orange-900/20", active: "ring-orange-500",   label: "Excited" },
  { value: "Neutral",     emoji: "😐", color: "bg-slate-100 border-slate-200 dark:bg-slate-800",       active: "ring-slate-400",    label: "Neutral" },
  { value: "Sad",         emoji: "😢", color: "bg-blue-100 border-blue-200 dark:bg-blue-900/20",       active: "ring-blue-500",     label: "Sad" },
  { value: "Anxious",     emoji: "😰", color: "bg-amber-100 border-amber-200 dark:bg-amber-900/20",    active: "ring-amber-500",    label: "Anxious" },
  { value: "Angry",       emoji: "😠", color: "bg-red-100 border-red-200 dark:bg-red-900/20",          active: "ring-red-500",      label: "Angry" },
  { value: "Tired",       emoji: "😴", color: "bg-purple-100 border-purple-200 dark:bg-purple-900/20", active: "ring-purple-500",   label: "Tired" },
  { value: "Overwhelmed", emoji: "🤯", color: "bg-rose-100 border-rose-200 dark:bg-rose-900/20",       active: "ring-rose-500",     label: "Overwhelmed" },
  { value: "Other",       emoji: "🌀", color: "bg-gray-100 border-gray-200 dark:bg-gray-800",          active: "ring-gray-400",     label: "Other" },
];

// ─── Factors per Mood ─────────────────────────────────────────────────────────

const FACTORS: Record<string, { label: string; icon: typeof Heart }[]> = {
  Happy: [
    { label: "Good news",      icon: Star },
    { label: "Friends",        icon: Users },
    { label: "Family",         icon: Home },
    { label: "College / Work", icon: BookOpen },
    { label: "Achievement",    icon: Star },
    { label: "Relationship",   icon: Heart },
    { label: "Rest",           icon: Moon },
    { label: "Personal time",  icon: Coffee },
    { label: "Other",          icon: Zap },
  ],
  Calm: [
    { label: "Rest",           icon: Moon },
    { label: "Meditation",     icon: Zap },
    { label: "Nature",         icon: Star },
    { label: "Personal time",  icon: Coffee },
    { label: "Family",         icon: Home },
    { label: "Music",          icon: Heart },
    { label: "Other",          icon: Zap },
  ],
  Excited: [
    { label: "Achievement",    icon: Star },
    { label: "Friends",        icon: Users },
    { label: "Good news",      icon: Zap },
    { label: "New opportunity",icon: BookOpen },
    { label: "Relationship",   icon: Heart },
    { label: "Other",          icon: Zap },
  ],
  Sad: [
    { label: "College / Work", icon: BookOpen },
    { label: "Family",         icon: Home },
    { label: "Friends",        icon: Users },
    { label: "Relationship",   icon: Heart },
    { label: "Loneliness",     icon: Moon },
    { label: "Stress",         icon: Angry },
    { label: "Health",         icon: Zap },
    { label: "Other",          icon: Zap },
  ],
  Anxious: [
    { label: "Exams / Deadlines", icon: BookOpen },
    { label: "Health concerns",   icon: Zap },
    { label: "Uncertainty",       icon: Star },
    { label: "Relationships",     icon: Heart },
    { label: "Finances",          icon: Coffee },
    { label: "Family",            icon: Home },
    { label: "Other",             icon: Zap },
  ],
  Angry: [
    { label: "Conflict",       icon: Angry },
    { label: "College / Work", icon: BookOpen },
    { label: "Family",         icon: Home },
    { label: "Injustice",      icon: Star },
    { label: "Frustration",    icon: Zap },
    { label: "Other",          icon: Zap },
  ],
  Tired: [
    { label: "Poor sleep",     icon: Moon },
    { label: "Overwork",       icon: BookOpen },
    { label: "Stress",         icon: Zap },
    { label: "Illness",        icon: Heart },
    { label: "No breaks",      icon: Coffee },
    { label: "Other",          icon: Zap },
  ],
  Overwhelmed: [
    { label: "Too many tasks", icon: BookOpen },
    { label: "Deadlines",      icon: Star },
    { label: "Relationships",  icon: Heart },
    { label: "Family",         icon: Home },
    { label: "College / Work", icon: BookOpen },
    { label: "Other",          icon: Zap },
  ],
  Neutral: [
    { label: "Routine day",    icon: Coffee },
    { label: "Just okay",      icon: Meh },
    { label: "Other",          icon: Zap },
  ],
  Other: [
    { label: "Other",          icon: Zap },
  ],
};

const DEFAULT_FACTORS = [
  { label: "College / Work", icon: BookOpen },
  { label: "Family",         icon: Home },
  { label: "Friends",        icon: Users },
  { label: "Relationship",   icon: Heart },
  { label: "Health",         icon: Zap },
  { label: "Other",          icon: Zap },
];

// ─── Step Counter Indicator ───────────────────────────────────────────────────

function StepDot({ step, current }: { step: number; current: number }) {
  return (
    <div className={`w-2 h-2 rounded-full transition-all ${
      step === current ? "bg-teal-600 w-6" : step < current ? "bg-teal-300" : "bg-slate-200 dark:bg-slate-700"
    }`} />
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function MoodTrackerEnhanced() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { data: moods } = useMoods();
  const { mutate: logMood, isPending } = useCreateMood();

  const todayStr = format(new Date(), "yyyy-MM-dd");
  const todayMood = moods?.find((m: any) => m.date === todayStr);

  const [step, setStep] = useState(1); // 1: mood, 2: factors, 3: intensity+note
  const [selectedMood, setSelectedMood] = useState("");
  const [selectedFactors, setSelectedFactors] = useState<string[]>([]);
  const [intensity, setIntensity] = useState(5);
  const [contextNote, setContextNote] = useState("");

  const moodConfig = MOODS.find((m) => m.value === selectedMood);
  const factorOptions = selectedMood ? (FACTORS[selectedMood] || DEFAULT_FACTORS) : [];

  const toggleFactor = (f: string) => {
    setSelectedFactors((prev) =>
      prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]
    );
  };

  const handleSubmit = () => {
    if (!selectedMood) return;
    const notes = [
      selectedFactors.length ? `Factors: ${selectedFactors.join(", ")}` : "",
      `Intensity: ${intensity}/10`,
      contextNote ? `Note: ${contextNote}` : "",
    ]
      .filter(Boolean)
      .join(" | ");

    logMood({ mood: selectedMood, notes, date: todayStr }, {
      onSuccess: () => {
        toast({ title: "Mood logged!", description: `Feeling ${selectedMood} today.` });
        setStep(1);
        setSelectedMood("");
        setSelectedFactors([]);
        setIntensity(5);
        setContextNote("");
      },
      onError: () => toast({ title: "Failed to log mood", variant: "destructive" }),
    });
  };

  // ── Already logged today ──
  if (todayMood) {
    return (
      <div className="max-w-4xl mx-auto animate-in fade-in duration-500 space-y-8">
        <div>
          <h1 className="text-4xl font-display font-bold">{t("moodTrackerTitle")}</h1>
          <p className="text-muted-foreground mt-2 text-lg">{t("moodTrackerSubtitle")}</p>
        </div>
        <div className="glass-card rounded-3xl p-8 text-center bg-gradient-to-b from-teal-50 to-white dark:from-slate-900 dark:to-slate-800 border-teal-100">
          <div className="w-20 h-20 bg-teal-100 dark:bg-teal-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-10 h-10 text-teal-600 dark:text-teal-400" />
          </div>
          <h2 className="text-2xl font-bold mb-2">{t("loggedToday")}</h2>
          <p className="text-xl mb-4 font-display">
            {t("feelingText")} <strong className="capitalize text-teal-600">{todayMood.mood}</strong>
          </p>
          {todayMood.notes && (
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl inline-block max-w-lg shadow-sm border border-border">
              <p className="italic text-slate-600 dark:text-slate-300 text-sm">{todayMood.notes}</p>
            </div>
          )}
        </div>
        <MoodHistory moods={moods} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in duration-500 space-y-8">
      <div>
        <h1 className="text-4xl font-display font-bold">{t("moodTrackerTitle")}</h1>
        <p className="text-muted-foreground mt-2 text-lg">{t("moodTrackerSubtitle")}</p>
      </div>

      {/* Step indicators */}
      <div className="flex items-center gap-2 justify-center">
        {[1, 2, 3].map((s) => <StepDot key={s} step={s} current={step} />)}
      </div>

      <div className="glass-card rounded-3xl p-8 shadow-xl">
        {/* Step 1 — Select mood */}
        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">How are you feeling today?</h2>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {MOODS.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setSelectedMood(m.value)}
                  className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all duration-200 ${m.color} ${
                    selectedMood === m.value
                      ? `ring-4 ring-offset-2 ${m.active} scale-105 shadow-lg`
                      : "opacity-75 hover:opacity-100"
                  }`}
                >
                  <span className="text-3xl mb-2">{m.emoji}</span>
                  <span className="font-semibold text-xs text-slate-800 dark:text-slate-100">{m.label}</span>
                </button>
              ))}
            </div>
            <button
              onClick={() => setStep(2)}
              disabled={!selectedMood}
              className="w-full py-3.5 rounded-xl bg-teal-600 text-white font-bold hover:bg-teal-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              Next <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Step 2 — Factors */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <button onClick={() => setStep(1)} className="text-muted-foreground hover:text-foreground">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Why do you feel <span className="text-teal-600">{selectedMood}</span>?
                </h2>
                <p className="text-sm text-muted-foreground">Select all that apply (optional)</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {factorOptions.map(({ label, icon: Icon }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => toggleFactor(label)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full border-2 text-sm font-medium transition-all ${
                    selectedFactors.includes(label)
                      ? "bg-teal-600 text-white border-teal-600 shadow-sm"
                      : "border-slate-200 dark:border-slate-700 hover:border-teal-400 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </button>
              ))}
            </div>
            <button
              onClick={() => setStep(3)}
              className="w-full py-3.5 rounded-xl bg-teal-600 text-white font-bold hover:bg-teal-700 transition-all flex items-center justify-center gap-2"
            >
              Next <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Step 3 — Intensity + Note */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <button onClick={() => setStep(2)} className="text-muted-foreground hover:text-foreground">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                How intense is this feeling?
              </h2>
            </div>

            {/* Intensity slider */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Mild</span>
                <span className="text-2xl font-bold text-teal-600">{intensity}/10</span>
                <span className="text-sm text-muted-foreground">Intense</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIntensity((v) => Math.max(1, v - 1))}
                  className="w-9 h-9 rounded-full border-2 border-slate-200 dark:border-slate-700 flex items-center justify-center hover:border-teal-500 transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={intensity}
                  onChange={(e) => setIntensity(Number(e.target.value))}
                  className="flex-1 accent-teal-600 h-2 rounded-full"
                />
                <button
                  type="button"
                  onClick={() => setIntensity((v) => Math.min(10, v + 1))}
                  className="w-9 h-9 rounded-full border-2 border-slate-200 dark:border-slate-700 flex items-center justify-center hover:border-teal-500 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                  <span key={n} className={n === intensity ? "text-teal-600 font-bold" : ""}>{n}</span>
                ))}
              </div>
            </div>

            {/* Optional note */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                What happened today? <span className="font-normal text-muted-foreground">(optional)</span>
              </label>
              <textarea
                value={contextNote}
                onChange={(e) => setContextNote(e.target.value)}
                placeholder="A quick note about your day…"
                rows={3}
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-card focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 outline-none transition-all resize-none text-sm"
              />
            </div>

            {/* Summary */}
            <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 text-sm space-y-1.5">
              <p><strong>Mood:</strong> {selectedMood} {moodConfig?.emoji}</p>
              {selectedFactors.length > 0 && (
                <p><strong>Factors:</strong> {selectedFactors.join(", ")}</p>
              )}
              <p><strong>Intensity:</strong> {intensity}/10</p>
            </div>

            <button
              onClick={handleSubmit}
              disabled={isPending}
              className="w-full py-4 rounded-xl bg-teal-600 text-white font-bold text-lg hover:bg-teal-700 disabled:opacity-50 transition-all shadow-lg shadow-teal-600/30 flex justify-center items-center gap-2"
            >
              {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
              Save Mood
            </button>
          </div>
        )}
      </div>

      <MoodHistory moods={moods} />
    </div>
  );
}

// ─── Mood History Component ───────────────────────────────────────────────────

function MoodHistory({ moods }: { moods: any[] | undefined }) {
  if (!moods?.length) return null;
  return (
    <div className="mt-4">
      <h3 className="text-2xl font-display font-bold mb-6">Recent Moods</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {moods.slice(0, 6).map((m: any) => {
          const cfg = MOODS.find((x) => x.value === m.mood) || MOODS[0];
          return (
            <div key={m.id} className={`glass-card p-4 rounded-2xl flex items-start gap-4 border-2 ${cfg.color}`}>
              <span className="text-3xl">{cfg.emoji}</span>
              <div>
                <p className="font-bold">{m.mood}</p>
                <p className="text-xs text-muted-foreground mb-1">
                  {format(new Date(m.date), "MMM do, yyyy")}
                </p>
                {m.notes && (
                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">{m.notes}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
