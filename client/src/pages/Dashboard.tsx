import { useUser } from "@/hooks/use-user";
import { useMoods } from "@/hooks/use-moods";
import { useHabits } from "@/hooks/use-habits";
import { useJournals } from "@/hooks/use-journals";
import { useEmotionalHistory } from "@/hooks/use-history";
import { format } from "date-fns";
import {
  Smile, MessageCircle, ArrowRight, Activity, Calendar, BookOpen,
  TrendingUp, Heart, HeartPulse, BookMarked, AlertCircle, Frown,
  Meh, Angry, Sun, Lightbulb
} from "lucide-react";
import { Link } from "wouter";
import { useMemo } from "react";
import { useTranslation } from "@/i18n/LanguageContext";

// Daily thoughts - curated wellbeing/psychology-informed messages
const DAILY_THOUGHTS = [
  "Small steps forward are still progress. Be patient with yourself.",
  "Your feelings are valid, but they don't define your whole story.",
  "Rest is not a reward for productivity—it's a basic human need.",
  "Progress isn't always linear. Some days are harder, and that's okay.",
  "Asking for help is a sign of strength, not weakness.",
  "You deserve the same kindness you give to others.",
  "It's okay to not be okay sometimes. What matters is what you do next.",
  "Your worth is not measured by your productivity.",
  "Taking care of yourself isn't selfish—it's necessary.",
  "Tomorrow is a new opportunity. Today doesn't have to be perfect.",
];

function getDailyThought(): string {
  const today = new Date();
  const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
  return DAILY_THOUGHTS[Math.floor(dayOfYear) % DAILY_THOUGHTS.length];
}

// Pattern Engine
function usePatternInsights(moods: any[], habits: any[], journals: any[]) {
  return useMemo(() => {
    const insights: { text: string; icon: typeof TrendingUp; color: string }[] = [];
    if (!moods?.length) return insights;

    const neg = ["stressed", "anxious", "sad", "angry", "lonely"];
    const negMoods = moods.filter(m => neg.includes(m.mood?.toLowerCase()));
    const posMoods = moods.filter(m => ["happy"].includes(m.mood?.toLowerCase()));

    // 1) Journals improve mood
    if (journals?.length >= 2 && posMoods.length > 0) {
      insights.push({
        text: "Writing journal entries appears to correlate with better mood days.",
        icon: BookOpen, color: "text-teal-600",
      });
    }

    // 2) Stressed recently
    const recentStress = moods.slice(0, 5).filter(m => m.mood === "stressed");
    if (recentStress.length >= 2) {
      insights.push({
        text: "You've been feeling stressed recently. Small breaks and deep breathing can help.",
        icon: AlertCircle, color: "text-orange-500",
      });
    }

    // 3) Habit completion on bad days
    const allHabits: any[] = habits || [];
    const negDates = new Set(negMoods.map(m => m.date));
    const negDayHabits = allHabits.filter(h => negDates.has(h.date));
    const incompleteOnBadDays = negDayHabits.filter(h => !h.completed);
    if (negDayHabits.length > 0 && incompleteOnBadDays.length / negDayHabits.length > 0.5) {
      insights.push({
        text: "You tend to skip habits on emotionally difficult days. Try one small habit to start.",
        icon: Activity, color: "text-blue-500",
      });
    }

    // 4) Positive streak
    const recent = moods.slice(0, 3);
    if (recent.length >= 3 && recent.every(m => ["happy", "neutral"].includes(m.mood?.toLowerCase()))) {
      insights.push({
        text: "You've had a positive emotional streak lately. Keep up the great work!",
        icon: Sun, color: "text-yellow-500",
      });
    }

    return insights.slice(0, 3);
  }, [moods, habits, journals]);
}

// Mood display helper
const MOOD_ICONS: Record<string, { icon: typeof Smile; color: string }> = {
  happy:    { icon: Smile,       color: "text-emerald-500" },
  sad:      { icon: Frown,       color: "text-blue-500" },
  stressed: { icon: AlertCircle, color: "text-orange-500" },
  anxious:  { icon: AlertCircle, color: "text-yellow-500" },
  angry:    { icon: Angry,       color: "text-red-500" },
  neutral:  { icon: Meh,         color: "text-slate-400" },
};

export default function Dashboard() {
  const { t } = useTranslation();
  const { data: user } = useUser();
  const { data: moods = [] } = useMoods();
  const { data: journals = [] } = useJournals();
  const { data: history = [] } = useEmotionalHistory();
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const { data: habits = [] } = useHabits(todayStr);

  const todayMood = moods?.find((m: any) => m.date === todayStr);
  const completedHabits = habits?.filter((h: any) => h.completed).length ?? 0;
  const totalHabits = habits?.length ?? 0;
  const recentJournal = journals?.[0];
  const insights = usePatternInsights(moods, habits, journals);
  const recentHistory = history?.slice(0, 3) ?? [];

  const greetingKey = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "goodMorning";
    if (hour < 18) return "goodAfternoon";
    return "goodEvening";
  };

  const MoodIcon = todayMood ? (MOOD_ICONS[todayMood.mood?.toLowerCase()]?.icon ?? Smile) : Smile;
  const moodColor = todayMood ? (MOOD_ICONS[todayMood.mood?.toLowerCase()]?.color ?? "text-teal-500") : "text-slate-300";

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-6xl mx-auto">
      {/* Header */}
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-display text-slate-900 dark:text-white">
            {t(greetingKey())}, <span className="text-teal-600">{user?.firstName || user?.username || "Friend"}</span>
          </h1>
          <p className="text-muted-foreground mt-1 text-base">{t("wellnessOverview")}</p>
        </div>
        <div className="hidden md:flex items-center gap-2 bg-white dark:bg-slate-800 px-4 py-2 rounded-full shadow-sm border border-border text-sm font-medium">
          <Calendar className="w-4 h-4 text-teal-600" />
          {format(new Date(), "EEEE, MMMM do")}
        </div>
      </header>

      {/* Row 1: Chat CTA + Today's Mood */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Support Chat CTA */}
        <div className="glass-card rounded-3xl p-6 bg-gradient-to-br from-teal-500 to-teal-700 text-white col-span-1 md:col-span-2 relative overflow-hidden group">
          <div className="relative z-10">
            <h2 className="text-2xl font-bold mb-1">{t("needSomeoneToTalk")}</h2>
            <p className="text-teal-100 mb-5 max-w-md text-sm leading-relaxed">
              Start a supportive conversation to reflect, organize your thoughts and receive practical wellness guidance.
            </p>
            <Link href="/chat" className="inline-flex items-center gap-2 bg-white text-teal-700 px-5 py-2.5 rounded-full font-bold hover:shadow-lg transition-all hover:gap-3 text-sm">
              {t("startConversation")} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <MessageCircle className="absolute right-[-20px] bottom-[-20px] w-40 h-40 text-teal-400/20 group-hover:scale-110 transition-transform duration-700" />
        </div>

        {/* Today's Mood */}
        <div className="glass-card rounded-3xl p-6 flex flex-col justify-between hover-lift">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-base">{t("todaysMood")}</h3>
            <div className="w-9 h-9 rounded-full bg-rose-100 dark:bg-rose-900/20 flex items-center justify-center">
              <Heart className="w-4 h-4 text-rose-500" />
            </div>
          </div>
          {todayMood ? (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <MoodIcon className={`w-6 h-6 ${moodColor}`} />
                <p className="text-2xl font-display font-bold capitalize text-slate-800 dark:text-white">{todayMood.mood}</p>
              </div>
              {todayMood.notes && <p className="text-sm text-muted-foreground italic line-clamp-2">"{todayMood.notes}"</p>}
            </div>
          ) : (
            <div>
              <p className="text-muted-foreground text-sm mb-3">No mood logged yet today.</p>
              <Link href="/mood" className="text-teal-600 font-semibold hover:underline flex items-center gap-1 text-sm">
                {t("logNow")} <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Row 2: Habits + Recent Journal + Daily Thought */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Habit Progress */}
        <div className="glass-card rounded-3xl p-6 hover-lift">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-base flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-500" /> {t("dailyHabits")}
            </h3>
            <Link href="/habits" className="text-xs text-teal-600 font-medium hover:underline">{t("viewAll")}</Link>
          </div>
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-1.5">
              <span className="text-slate-500 text-xs">{t("progress")}</span>
              <span className="font-bold text-teal-600 text-xs">{completedHabits} / {totalHabits} done</span>
            </div>
            <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-teal-400 to-teal-600 transition-all duration-1000 ease-out rounded-full"
                style={{ width: `${totalHabits > 0 ? (completedHabits / totalHabits) * 100 : 0}%` }}
              />
            </div>
          </div>
          <div className="space-y-2">
            {habits?.slice(0, 4).map((habit: any) => (
              <div key={habit.id} className="flex items-center gap-3 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${habit.completed ? "bg-teal-500 border-teal-500" : "border-slate-300"}`}>
                  {habit.completed && <svg viewBox="0 0 14 14" fill="none" className="w-2.5 h-2.5"><path d="M3 7.5L5.5 10L11 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                </div>
                <span className={`text-sm font-medium ${habit.completed ? "line-through text-slate-400" : "text-slate-700 dark:text-slate-200"}`}>{habit.type}</span>
              </div>
            ))}
            {totalHabits === 0 && (
              <div className="text-center py-4">
                <p className="text-muted-foreground text-sm">No habits tracked today.</p>
                <Link href="/habits" className="text-teal-600 text-sm font-medium hover:underline">{t("addHabit")} →</Link>
              </div>
            )}
          </div>
        </div>

        {/* Recent Journal */}
        <div className="glass-card rounded-3xl p-6 hover-lift flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-base flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-purple-500" /> {t("recentJournal")}
            </h3>
            <Link href="/journal" className="text-xs text-teal-600 font-medium hover:underline">{t("viewAll")}</Link>
          </div>
          {recentJournal ? (
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-md capitalize">{recentJournal.type}</span>
                <span className="text-xs text-muted-foreground">{format(new Date(recentJournal.createdAt), "MMM d")}</span>
              </div>
              <h4 className="font-bold text-slate-900 dark:text-white mb-2">{recentJournal.title || "Journal Entry"}</h4>
              <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-4">{recentJournal.content}</p>
              {recentJournal.tags && (
                <div className="flex gap-1.5 mt-3 flex-wrap">
                  {recentJournal.tags.split(",").filter(Boolean).map((tag: string, i: number) => (
                    <span key={i} className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-md">#{tag.trim()}</span>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-6">
              <BookMarked className="w-10 h-10 text-slate-300 mb-3" />
              <p className="text-muted-foreground text-sm mb-3">No journal entries yet.</p>
              <Link href="/journal" className="text-teal-600 font-semibold text-sm hover:underline flex items-center gap-1">
                {t("writeFirstEntry")} <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          )}
        </div>

        {/* Today's Thought */}
        <div className="glass-card rounded-3xl p-6 hover-lift bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200 dark:border-amber-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-base flex items-center gap-2 text-amber-800 dark:text-amber-200">
              <Lightbulb className="w-4 h-4 text-amber-600" /> Today's Thought
            </h3>
            <Sun className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex-1 flex items-center justify-center text-center py-4">
            <p className="text-sm text-amber-900 dark:text-amber-100 leading-relaxed italic">
              "{getDailyThought()}"
            </p>
          </div>
          <p className="text-xs text-amber-700 dark:text-amber-300 text-center mt-2">
            Daily wellbeing reflection
          </p>
        </div>
      </div>

      {/* Row 3: Pattern Insights + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Pattern Insights */}
        <div className="glass-card rounded-3xl p-6 hover-lift">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-500" /> {t("patternInsights")}
            </h3>
            <Link href="/history" className="text-xs text-teal-600 font-medium hover:underline">Full timeline</Link>
          </div>
          {insights.length > 0 ? (
            <div className="space-y-3">
              {insights.map((ins, i) => {
                const Icon = ins.icon;
                return (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                    <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${ins.color}`} />
                    <p className="text-sm text-slate-700 dark:text-slate-200">{ins.text}</p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-6">
              <TrendingUp className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Log moods and journals to see insights.</p>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="glass-card rounded-3xl p-6 hover-lift">
          <h3 className="font-bold text-base mb-4 flex items-center gap-2">
            <Sun className="w-4 h-4 text-amber-500" /> {t("quickActions")}
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { href: "/mood",    icon: Smile,         label: t("moodTracker"), bg: "bg-emerald-50 dark:bg-emerald-900/20", col: "text-emerald-600" },
              { href: "/journal", icon: BookOpen,      label: t("journal"),     bg: "bg-purple-50 dark:bg-purple-900/20",   col: "text-purple-600" },
              { href: "/help",    icon: HeartPulse,    label: t("findHelp"),    bg: "bg-rose-50 dark:bg-rose-900/20",       col: "text-rose-600" },
              { href: "/chat",    icon: MessageCircle, label: t("supportChat"), bg: "bg-teal-50 dark:bg-teal-900/20",     col: "text-teal-600" },
            ].map(a => {
              const Icon = a.icon;
              return (
                <Link key={a.href} href={a.href} className={`${a.bg} rounded-2xl p-4 flex flex-col items-center gap-2 hover:shadow-md transition-all hover:-translate-y-0.5 text-center`}>
                  <Icon className={`w-6 h-6 ${a.col}`} />
                  <span className={`text-sm font-semibold ${a.col}`}>{a.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Row 4: Recent Timeline Preview */}
      {recentHistory.length > 0 && (
        <div className="glass-card rounded-3xl p-6 hover-lift">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-base flex items-center gap-2">
              <Calendar className="w-4 h-4 text-teal-500" /> {t("recentActivity")}
            </h3>
            <Link href="/history" className="text-xs text-teal-600 font-medium hover:underline">{t("viewAll")}</Link>
          </div>
          <div className="space-y-3">
            {recentHistory.map((item: any) => {
              const typeLabel = item.type === "mood" ? t("moodTracker") : item.type === "journal" ? t("journal") : t("supportChat");
              const dotColor = item.type === "mood" ? "bg-emerald-500" : item.type === "journal" ? "bg-teal-500" : "bg-blue-500";
              return (
                <div key={`${item.type}-${item.id}`} className="flex items-start gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${dotColor}`} />
                  <div>
                    <span className="text-xs text-muted-foreground">{typeLabel} · {format(new Date(item.date), "MMM d, h:mm a")}</span>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200 capitalize">{item.value}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <p className="text-xs text-center text-muted-foreground pb-4">
        {t("disclaimerText")}
      </p>
    </div>
  );
}
