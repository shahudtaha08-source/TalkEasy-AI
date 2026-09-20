import { useState } from "react";
import { Moon, Clock, Plus, Loader2, TrendingUp, AlertCircle } from "lucide-react";
import { format, subDays } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/i18n/LanguageContext";

interface SleepEntry {
  id?: number;
  nightSleep: number;
  nap: number;
  totalSleep: number;
  date: string;
}

export default function SleepTracker() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  
  const [entries, setEntries] = useState<SleepEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [nightSleep, setNightSleep] = useState("");
  const [nap, setNap] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const todayEntry = entries.find((e) => e.date === todayStr);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const night = parseFloat(nightSleep) || 0;
    const napHours = parseFloat(nap) || 0;
    const total = night + napHours;

    if (night < 0 || night > 24 || napHours < 0 || napHours > 24 || total > 24) {
      toast({ title: "Please enter valid sleep hours (0-24)", variant: "destructive" });
      return;
    }

    if (isNaN(night) || isNaN(napHours)) {
      toast({ title: "Please enter valid numbers", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/sleep-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          nightSleep: night,
          nap: napHours,
          totalSleep: total,
          date: todayStr,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to save sleep entry');
      }

      toast({ title: "Sleep entry saved successfully" });
      setNightSleep("");
      setNap("");
      // Refresh entries
      fetchEntries();
    } catch (error) {
      console.error('Sleep entry error:', error);
      toast({ 
        title: "Failed to save sleep entry", 
        description: error instanceof Error ? error.message : "Please try again later",
        variant: "destructive" 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const fetchEntries = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/sleep-entries', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setEntries(data || []);
      } else if (response.status === 401) {
        setEntries([]);
      } else {
        console.error('Failed to fetch sleep entries:', response.status);
        setEntries([]);
      }
    } catch (error) {
      console.error('Failed to fetch sleep entries:', error);
      setEntries([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate 7-day trend
  const last7Days = Array.from({ length: 7 }).map((_, i) => format(subDays(new Date(), 6 - i), 'yyyy-MM-dd'));
  const trendData = last7Days.map(date => {
    const entry = entries.find((e) => e.date === date);
    return {
      date: format(new Date(date), 'EEE'),
      nightSleep: entry?.nightSleep || 0,
      nap: entry?.nap || 0,
      total: entry?.totalSleep || 0,
    };
  });

  const averageSleep = trendData.reduce((sum, day) => sum + day.total, 0) / trendData.filter(d => d.total > 0).length || 0;
  const hasData = trendData.some(d => d.total > 0);

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-4xl font-display font-bold flex items-center gap-3">
          <Moon className="w-8 h-8 text-indigo-500" /> Sleep Tracker
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">Track your sleep patterns for better wellbeing</p>
      </div>

      {/* Today's Sleep Entry */}
      <div className="glass-card rounded-3xl p-6">
        <h2 className="text-2xl font-bold mb-6 flex items-center justify-between">
          Today's Sleep
          <span className="text-sm font-medium bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full">
            {format(new Date(), 'MMM do')}
          </span>
        </h2>

        {todayEntry ? (
          <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl p-6 border border-indigo-200 dark:border-indigo-800">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Night Sleep</p>
                <p className="text-2xl font-bold text-indigo-600">{todayEntry.nightSleep}h</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Nap</p>
                <p className="text-2xl font-bold text-indigo-600">{todayEntry.nap}h</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total</p>
                <p className="text-2xl font-bold text-indigo-600">{todayEntry.totalSleep}h</p>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Night Sleep (hours)</label>
                <input
                  type="number"
                  min="0"
                  max="24"
                  step="0.5"
                  value={nightSleep}
                  onChange={(e) => setNightSleep(e.target.value)}
                  placeholder="e.g. 7.5"
                  className="w-full px-4 py-3 rounded-xl border-2 border-border bg-card focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Nap (hours)</label>
                <input
                  type="number"
                  min="0"
                  max="24"
                  step="0.5"
                  value={nap}
                  onChange={(e) => setNap(e.target.value)}
                  placeholder="e.g. 0.5"
                  className="w-full px-4 py-3 rounded-xl border-2 border-border bg-card focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
              Log Sleep
            </button>
          </form>
        )}
      </div>

      {/* 7-Day Trend */}
      <div className="glass-card rounded-3xl p-6">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-indigo-500" /> 7-Day Sleep Trend
        </h2>

        {!hasData ? (
          <div className="text-center py-10 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
            <Moon className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-muted-foreground mb-2">No sleep data recorded yet</p>
            <p className="text-sm text-muted-foreground">Log your sleep to see trends and insights</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-4 border border-indigo-200 dark:border-indigo-800">
              <p className="text-sm text-muted-foreground mb-1">Average Sleep (Last 7 Days)</p>
              <p className="text-3xl font-bold text-indigo-600">{averageSleep.toFixed(1)} hours</p>
            </div>

            <div className="space-y-2">
              {trendData.map((day, index) => (
                <div key={index} className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                  <div className="w-16 text-sm font-medium text-slate-600 dark:text-slate-300">{day.date}</div>
                  <div className="flex-1 flex items-center gap-2">
                    <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-indigo-500 h-full transition-all"
                        style={{ width: `${Math.min((day.total / 12) * 100, 100)}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200 w-16 text-right">
                      {day.total > 0 ? `${day.total}h` : '-'}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {day.nightSleep > 0 && `${day.nightSleep}h night`}
                    {day.nap > 0 && ` + ${day.nap}h nap`}
                  </div>
                </div>
              ))}
            </div>

            {/* Simple Recommendations */}
            {averageSleep < 6 && averageSleep > 0 && (
              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 border border-amber-200 dark:border-amber-800 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-800 dark:text-amber-300">Low Sleep Average</p>
                  <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                    Your average sleep is below recommended levels. Consider establishing a consistent sleep schedule and reducing screen time before bed.
                  </p>
                </div>
              </div>
            )}

            {averageSleep >= 7 && averageSleep <= 9 && (
              <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 border border-emerald-200 dark:border-emerald-800 flex items-start gap-3">
                <Clock className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-emerald-800 dark:text-emerald-300">Good Sleep Pattern</p>
                  <p className="text-sm text-emerald-700 dark:text-emerald-400 mt-1">
                    Your sleep average is within the recommended range. Keep maintaining your consistent sleep schedule.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="text-xs text-center text-muted-foreground pb-4">
        Sleep tracking is for wellness monitoring only and does not diagnose sleep disorders.
        Consult a healthcare professional for sleep concerns.
      </div>
    </div>
  );
}
