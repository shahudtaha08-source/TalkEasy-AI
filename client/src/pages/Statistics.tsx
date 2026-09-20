import { useMoods } from "@/hooks/use-moods";
import { useHabits } from "@/hooks/use-habits";
import { useTranslation } from "@/i18n/LanguageContext";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, Cell, AreaChart, Area } from 'recharts';
import { format, subDays, parseISO } from "date-fns";
import { useState, useEffect } from "react";

export default function Statistics() {
  const { t } = useTranslation();
  const { data: moods } = useMoods();
  const { data: habits } = useHabits();
  const [sleepData, setSleepData] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/sleep-entries', { credentials: 'include' })
      .then(res => res.json())
      .then(data => setSleepData(data || []))
      .catch(console.error);
  }, []);

  // Process Mood Data for the last 7 days
  const last7Days = Array.from({ length: 7 }).map((_, i) => format(subDays(new Date(), 6 - i), 'yyyy-MM-dd'));
  
  const moodScoreMap: Record<string, number> = { "Happy": 4, "Neutral": 3, "Stressed": 2, "Sad": 1, "Anxious": 1.5, "Angry": 1 };
  
  const moodData = last7Days.map(date => {
    const dayMood = moods?.find((m: any) => m.date === date);
    return {
      date: format(parseISO(date), 'MMM dd'),
      score: dayMood ? moodScoreMap[dayMood.mood] : null,
      moodName: dayMood?.mood || 'None'
    };
  });

  // Process Habit Data with actual completion percentages
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
    rate: Math.round(stats.totalPercentage / stats.total), // Average completion percentage
  }));

  // Process Sleep Data
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

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-4xl font-display font-bold">{t("statisticsTitle")}</h1>
        <p className="text-muted-foreground mt-2 text-lg">{t("statisticsSubtitle")}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Mood Trend Chart */}
        <div className="glass-card p-6 rounded-3xl">
          <h2 className="text-2xl font-bold mb-6">{t("moodTrendChart")}</h2>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={moodData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="date" stroke="#64748b" tick={{fontSize: 12}} />
                <YAxis domain={[1, 4]} ticks={[1, 2, 3, 4]} stroke="#64748b" tickFormatter={(val) => {
                  if(val===4) return t('happy');
                  if(val===3) return t('neutral');
                  if(val===2) return t('stressed');
                  if(val===1) return t('sad');
                  return '';
                }} tick={{fontSize: 12}} width={70} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: any, name: any, props: any) => [props.payload.moodName, t("moodLabel")]}
                />
                <Line 
                  type="monotone" 
                  dataKey="score" 
                  stroke="#0d9488" 
                  strokeWidth={4} 
                  dot={{ r: 6, fill: '#0d9488', strokeWidth: 2, stroke: '#fff' }} 
                  activeDot={{ r: 8 }} 
                  connectNulls 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sleep Trend Chart */}
        <div className="glass-card p-6 rounded-3xl">
          <h2 className="text-2xl font-bold mb-6">7-Day Sleep Trend</h2>
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
        </div>
      </div>
    </div>
  );
}
