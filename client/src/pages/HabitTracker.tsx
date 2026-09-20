import { useState } from "react";
import { useHabits, useCreateHabit, useUpdateHabit } from "@/hooks/use-habits";
import { format } from "date-fns";
import { Plus, Check, Loader2, Percent } from "lucide-react";
import { useTranslation } from "@/i18n/LanguageContext";

const COMMON_HABITS = ["Meditation", "Exercise", "Hydration", "Journaling", "Reading"];

export default function HabitTracker() {
  const { t } = useTranslation();
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const { data: habits, isLoading } = useHabits(todayStr);
  const { mutate: createHabit, isPending: isCreating } = useCreateHabit();
  const { mutate: updateHabit } = useUpdateHabit();

  const [newHabit, setNewHabit] = useState("");
  const [editingPercentage, setEditingPercentage] = useState<number | null>(null);

  const handleAddHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabit.trim()) return;
    createHabit({ type: newHabit.trim(), completed: false, completionPercentage: 0, date: todayStr });
    setNewHabit("");
  };

  const addCommonHabit = (type: string) => {
    createHabit({ type, completed: false, completionPercentage: 0, date: todayStr });
  };

  const toggleHabit = (id: number, currentStatus: boolean, currentPercentage: number) => {
    const newStatus = !currentStatus;
    const newPercentage = newStatus ? 100 : currentPercentage;
    updateHabit({ id, completed: newStatus, completionPercentage: newPercentage });
  };

  const updatePercentage = (id: number, percentage: number) => {
    const validPercentage = Math.max(0, Math.min(100, percentage));
    const completed = validPercentage === 100;
    updateHabit({ id, completed, completionPercentage: validPercentage });
    setEditingPercentage(null);
  };

  const existingHabitTypes = habits?.map((h: any) => h.type) || [];
  const suggestedHabits = COMMON_HABITS.filter(h => !existingHabitTypes.includes(h));

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in duration-500 space-y-8">
      <div>
        <h1 className="text-4xl font-display font-bold">{t("habitTrackerTitle")}</h1>
        <p className="text-muted-foreground mt-2 text-lg">{t("habitTrackerSubtitle")}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <div className="glass-card rounded-3xl p-6">
            <h2 className="text-2xl font-bold mb-6 flex items-center justify-between">
              {t("todaysGoals")}
              <span className="text-sm font-medium bg-teal-100 text-teal-800 px-3 py-1 rounded-full">
                {format(new Date(), 'MMM do')}
              </span>
            </h2>

            {isLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="w-8 h-8 animate-spin text-teal-600" /></div>
            ) : habits?.length === 0 ? (
              <div className="text-center py-10 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
                <p className="text-muted-foreground mb-4">{t("noHabitsToday")}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {habits?.map((habit: any) => (
                  <div 
                    key={habit.id}
                    className={`flex items-center justify-between p-4 rounded-2xl transition-all duration-200 border-2 ${
                      habit.completed 
                      ? 'bg-teal-50 border-teal-200 dark:bg-teal-900/20 dark:border-teal-800' 
                      : 'bg-white border-slate-100 dark:bg-slate-900 dark:border-slate-800 hover:border-teal-300'
                    }`}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <button
                        onClick={() => toggleHabit(habit.id, habit.completed, habit.completionPercentage || 0)}
                        className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors ${
                          habit.completed ? 'bg-teal-500 border-teal-500 text-white' : 'border-slate-300 dark:border-slate-600'
                        }`}
                      >
                        {habit.completed && <Check className="w-5 h-5" />}
                      </button>
                      <span className={`text-lg font-medium ${habit.completed ? 'text-slate-500 line-through' : 'text-foreground'}`}>
                        {habit.type}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Percent className="w-4 h-4 text-slate-400" />
                      {editingPercentage === habit.id ? (
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={habit.completionPercentage || 0}
                          onChange={(e) => updatePercentage(habit.id, parseInt(e.target.value) || 0)}
                          onBlur={() => setEditingPercentage(null)}
                          onKeyDown={(e) => e.key === 'Enter' && setEditingPercentage(null)}
                          className="w-16 px-2 py-1 text-sm border rounded"
                          autoFocus
                        />
                      ) : (
                        <button
                          onClick={() => setEditingPercentage(habit.id)}
                          className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-teal-600"
                        >
                          {habit.completionPercentage || 0}%
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <form onSubmit={handleAddHabit} className="flex gap-2">
            <input
              type="text"
              value={newHabit}
              onChange={e => setNewHabit(e.target.value)}
              placeholder={t("customHabitPlaceholder")}
              className="flex-1 px-6 py-4 rounded-2xl border-2 border-border bg-card focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 outline-none text-lg"
            />
            <button 
              type="submit"
              disabled={!newHabit.trim() || isCreating}
              className="px-6 rounded-2xl bg-teal-600 text-white hover:bg-teal-700 transition-colors disabled:opacity-50 font-bold flex items-center gap-2"
            >
              <Plus className="w-5 h-5" /> {t("addHabit")}
            </button>
          </form>
        </div>

        <div className="space-y-6">
          <div className="glass-card rounded-3xl p-6 bg-blue-50 dark:bg-slate-800/80 border-blue-100 dark:border-slate-700">
            <h3 className="font-bold text-lg mb-4 text-slate-800 dark:text-white">{t("suggestions")}</h3>
            <div className="flex flex-wrap gap-2">
              {suggestedHabits.map(h => (
                <button
                  key={h}
                  onClick={() => addCommonHabit(h)}
                  className="px-4 py-2 rounded-xl bg-white dark:bg-slate-900 text-sm font-medium text-blue-700 dark:text-blue-400 hover:bg-blue-100 border border-blue-200 dark:border-blue-900 transition-colors flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> {h}
                </button>
              ))}
              {suggestedHabits.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">{t("trackingAllHabits")}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
