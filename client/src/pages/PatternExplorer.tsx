import { useMemo } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useMoods } from "@/hooks/use-moods";
import { useHabits } from "@/hooks/use-habits";
import { useJournals } from "@/hooks/use-journals";
import { useTranslation } from "@/i18n/LanguageContext";
import MlInsightsCard from "@/components/MlInsightsCard";

export default function PatternExplorer() {
  const [, setLocation] = useLocation();
  const { t } = useTranslation();
  const { data: moods = [] } = useMoods() as any;
  const { data: habits = [] } = useHabits() as any;
  const { data: journals = [] } = useJournals() as any;

  const patterns = useMemo(() => {
    const pts: any[] = [];
    if (moods.length < 3 && habits.length < 3 && journals.length < 3) return pts;
    const moodCounts: any = {};
    moods.forEach((m:any) => { moodCounts[m.mood] = (moodCounts[m.mood]||0)+1; });
    const top = Object.entries(moodCounts).sort((a:any,b:any)=>b[1]-a[1])[0];
    if (top) pts.push({ labelKey: "patternMostFrequentMood", value: top[0] + " (" + top[1] + " times)", type: "observation" });
    if (habits.length > 0) pts.push({ labelKey: "patternHabitEntries", value: habits.length, type: "count" });
    if (journals.length > 0) pts.push({ labelKey: "patternJournalEntries", value: journals.length, type: "count" });
    return pts;
  }, [moods, habits, journals]);

  const insufficient = moods.length < 3 && habits.length < 3 && journals.length < 3;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => setLocation("/dashboard")}>
          <ArrowLeft className="h-4 w-4 mr-2" />{t("backToDashboard")}
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{t("patternExplorerTitle")}</h1>
          <p className="text-muted-foreground">{t("patternExplorerSubtitle")}</p>
        </div>
      </div>
      <MlInsightsCard sections={["patterns", "anomalies", "clusters"]} />
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5" />{t("observedPatterns")}</CardTitle></CardHeader>
        <CardContent>
          {insufficient && <p className="text-sm text-muted-foreground">{t("patternInsufficient")}</p>}
          {!insufficient && patterns.length === 0 && <p className="text-sm text-muted-foreground">{t("patternNone")}</p>}
          <div className="space-y-2">
            {patterns.map((p:any,i:number) => (
              <div key={i} className="flex justify-between p-2 border rounded">
                <span className="text-sm">{t(p.labelKey)}</span>
                <span className="text-sm text-muted-foreground">{p.value}</span>
              </div>
            ))}
          </div>
          {!insufficient && <p className="text-xs text-muted-foreground mt-3">{t("patternNote")}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
