import { useMoods, useMoodEntries } from "@/hooks/use-moods";
import { useHabits } from "@/hooks/use-habits";
import { useTranslation } from "@/i18n/LanguageContext";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, Cell, AreaChart, Area } from 'recharts';
import { format, subDays, parseISO } from "date-fns";
import { useState, useEffect } from "react";
import { Brain } from "lucide-react";

// Categorical fallback score (1–4) used only when no numeric intensity was logged.
const MOOD_SCORE: Record<string, number> = {
  "Happy": 4, "Excited": 4, "Calm": 3.5, "Neutral": 3, "Other": 2.5,
  "Stressed": 2, "Anxious": 1.5, "Tired": 1.5, "Overwhelmed": 1.5,
  "Sad": 1, "Angry": 1,
};

function parseLegacyNotes(notes?: string | null) {
  if (!notes) return { intensity: null as number | null, factors: [] as string[], note: "" };
  const intensityMatch = notes.match(/Intensity:\s*(\d+(?:\.\d+)?)\s*\/\s*10/i);
  const factorsMatch = notes.match(/Factors:\s*([^|]+)/i);
  const noteMatch = notes.match(/Note:\s*([\s\S]+)$/i);
  return {
    intensity: intensityMatch ? Number(intensityMatch[1]) : null,
    factors: factorsMatch
      ? factorsMatch[1].split(",").map(s => s.trim()).filter(Boolean)
      : [],
    note: noteMatch ? noteMatch[1].trim() : "",
  };
}

function parseFactors(raw: unknown): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw as string[];
  try {
    const parsed = JSON.parse(String(raw));
    if (Array.isArray(parsed)) return parsed.map(String);
  } catch { /* fall through to comma split */ }
  return String(raw).split(",").map(s => s.trim()).filter(Boolean);
}

export default function Statistics() {
  const { t } = useTranslation();
  const { data: moods } = useMoods();
  const { data: moodEntries } = useMoodEntries(60);
  const { data: habits } = useHabits();
  const [sleepData, setSleepData] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/sleep-entries', { credentials: 'include' })
      .then(res => res.json())
      .then(data => setSleepData(data || []))
      .catch(console.error);
  }, []);

  const last7Days = Array.from({ length: 7 }).map((_, i) => format(subDays(new Date(), 6 - i), 'yyyy-MM-dd'));

  const entriesByDate = new Map<string, any>(
    (moodEntries || []).map((e: any) => [String(e.date).slice(0, 10), e])
  );

  const moodData = last7Days.map(date => {
    const entry = entriesByDate.get(date);
    if (entry) {
      return {
        date: format(parseISO(date), 'MMM dd'),
        intensity: typeof entry.intensity === "number" ? entry.intensity : null,
        score: MOOD_SCORE[entry.mood] ?? null,
        moodName: entry.mood,
        factors: parseFactors(entry.factors),
        note: entry.contextNote || "",
      };
    }
    const legacy = moods?.find((m: any) => m.date === date);
    if (legacy) {
      const parsed = parseLegacyNotes(legacy.notes);
      return {
        date: format(parseISO(date), 'MMM dd'),
        intensity: parsed.intensity,
        score: MOOD_SCORE[legacy.mood] ?? parsed.intensity,
        moodName: legacy.mood,
        factors: parsed.factors,
        note: parsed.note,
      };
    }
    return { date: format(parseISO(date), 'MMM dd'), intensity: null, score: null, moodName: "", factors: [], note: "" };
  });

  const loggedDays = moodData.filter(d => d.moodName);
  const intensityDays = moodData.filter(d => d.intensity != null);
  const showIntensity = intensityDays.length > 0;
  const hasAnyMood = loggedDays.length > 0;

  const habitCompletionCounts: Record<string, { total: number; completed: number; totalPercentage: number }> = {};
  habits?.forEach((h: any) => {
    if (!habitCompletionCounts[h.type]) {
      habitCompletionCounts[h.type] = { total: 0, completed: 0, totalPercentage: 0 };
    }
    habitCompletionCounts[h.type].total++;
    if (h.completed) habitCompletionCounts[h.type].completed++;
    habitCompletionCounts[h.type].totalPercentage += (h.completionPercentage || 0);
  });

  const habitData = Object.entries(habitCompletionCounts).map(([name, stats]) => ({
    name,
    rate: Math.round(stats.totalPercentage / stats.total),
  }));

  const sleepTrendData = last7Days.map(date => {
    const entry = sleepData.find((s: any) => s.date === date);
    return {
      date: format(parseISO(date), 'MMM dd'),
      nightSleep: entry?.nightSleep || 0,
      nap: entry?.nap || 0,
      total: entry?.totalSleep || 0,
    };
  });

  const COLORS = ['#0d9488', '#3b82f6', '#8b5cf6', '#f43f5e', '#f59e0b'];

  const moodTooltip = (props: any) => {
    const { active, payload } = props;
    if (!active || !payload?.length) return null;
    const p = payload[0].payload;
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-3 text-sm shadow-lg dark:border-slate-700 dark:bg-slate-900">
        <p className="font-semibold">{p.date}</p>
        {p.moodName && <p className="text-slate-600 dark:text-slate-300">{p.moodName}</p>}
        <p className="text-slate-600 dark:text-slate-300">
          {t("intensity")}: {p.intensity != null ? `${p.intensity}/10` : "—"}
        </p>
        <p className="text-xs text-slate-500">
          {t("factors")}: {p.factors.length ? p.factors.join(", ") : t("noFactorsRecorded")}
        </p>
        {p.note && <p className="mt-1 text-xs italic text-slate-500">{p.note}</p>}
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-4xl font-display font-bold">{t("statisticsTitle")}</h1>
        <p className="text-muted-foreground mt-2 text-lg">{t("statisticsSubtitle")}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Mood Trend Chart */}
        <div className="glass-card p-6 rounded-3xl">
          <h2 className="text-2xl font-bold mb-2">{t("moodTrendChart")}</h2>
          <p className="text-xs text-muted-foreground mb-6">{t("moodTrendHint")}</p>
          {!hasAnyMood ? (
            <div className="h-[300px] w-full flex flex-col items-center justify-center text-center gap-3 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
              <Brain className="h-10 w-10 text-teal-500" />
              <p className="font-semibold">{t("moodTrendEmpty")}</p>
              <p className="text-sm text-muted-foreground max-w-xs">{t("moodTrendEmptyHint")}</p>
            </div>
          ) : (
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={moodData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="date" stroke="#64748b" tick={{fontSize: 12}} />
                  {showIntensity ? (
                    <YAxis domain={[0, 10]} stroke="#64748b" tick={{fontSize: 12}} width={70}
                      label={{ value: t("intensityScale"), angle: -90, position: "insideLeft", fontSize: 11, fill: "#64748b" }} />
                  ) : (
                    <YAxis domain={[1, 4]} ticks={[1, 2, 3, 4]} stroke="#64748b" tickFormatter={(val) => {
                      if(val===4) return t('happy');
                      if(val===3) return t('neutral');
                      if(val===2) return t('stressed');
                      if(val===1) return t('sad');
                      return '';
                    }} tick={{fontSize: 12}} width={70} />
                  )}
                  <Tooltip content={moodTooltip as any} />
                  <Line
                    type="monotone"
                    dataKey={showIntensity ? "intensity" : "score"}
                    stroke="#0d9488"
                    strokeWidth={4}
                    dot={{ r: 6, fill: '#0d9488', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 8 }}
                    connectNulls
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Sleep Trend Chart */}
        <div className="glass-card p-6 rounded-3xl">
          <h2 className="text-2xl font-bold mb-6">{t("sleepTrendChart")}</h2>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sleepTrendData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="date" stroke="#64748b" tick={{fontSize: 12}} />
                <YAxis domain={[0, 12]} stroke="#64748b" tick={{fontSize: 12}} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="total" stroke="#6366f1" fill="#6366f1" fillOpacity={0.3} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Habit Completion Chart */}
        <div className="glass-card p-6 rounded-3xl lg:col-span-2">
          <h2 className="text-2xl font-bold mb-6">{t("habitCompletionChart")}</h2>
          {habitData.length === 0 ? (
            <div className="h-[300px] w-full flex flex-col items-center justify-center text-center gap-3 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
              <p className="font-semibold">{t("notEnoughData")}</p>
              <p className="text-sm text-muted-foreground max-w-xs">{t("notEnoughDataHint")}</p>
            </div>
          ) : (
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={habitData} layout="vertical" margin={{ top: 5, right: 30, bottom: 5, left: 50 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                  <XAxis type="number" domain={[0, 100]} unit="%" stroke="#64748b" />
                  <YAxis dataKey="name" type="category" stroke="#64748b" tick={{fontSize: 12}} width={100} />
                  <Tooltip
                    cursor={{fill: 'transparent'}}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: any) => [`${value}%`, t("completionRate")]}
                  />
                  <Bar dataKey="rate" radius={[0, 8, 8, 0]} barSize={24}>
                    {habitData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
