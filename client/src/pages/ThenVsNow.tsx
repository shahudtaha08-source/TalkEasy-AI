import { useLocation } from "wouter";
import { ArrowLeft, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useMoods } from "@/hooks/use-moods";
import { useTranslation } from "@/i18n/LanguageContext";

export default function ThenVsNow() {
  const [, setLocation] = useLocation();
  const { t } = useTranslation();
  const { data: moods = [] } = useMoods() as any;
  const sorted = [...moods].sort((a:any,b:any)=>a.date.localeCompare(b.date));
  const first = sorted[0], last = sorted[sorted.length-1];
  const insufficient = sorted.length < 2;
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => setLocation("/dashboard")}><ArrowLeft className="h-4 w-4 mr-2"/>{t("back")}</Button>
        <div><h1 className="text-3xl font-bold">{t("thenVsNowTitle")}</h1><p className="text-muted-foreground">{t("thenVsNowSubtitle")}</p></div>
      </div>
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5"/>Comparison</CardTitle></CardHeader>
        <CardContent>
          {insufficient && <p className="text-sm text-muted-foreground">{t("needTwoMoods")}</p>}
          {!insufficient && (
            <div className="grid md:grid-cols-2 gap-3">
              <div className="p-2 border rounded"><div className="text-xs text-muted-foreground">{t("thenLabel")} ({first.date})</div><div className="text-sm">{t("mood")}: {first.mood}</div></div>
              <div className="p-2 border rounded"><div className="text-xs text-muted-foreground">{t("nowLabel")} ({last.date})</div><div className="text-sm">{t("mood")}: {last.mood}</div></div>
            </div>
          )}
          <p className="text-xs text-muted-foreground mt-2">{t("observationOnly")}</p>
        </CardContent>
      </Card>
    </div>
  );
}
