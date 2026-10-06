import { useLocation } from "wouter";
import { ArrowLeft, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useMoods } from "@/hooks/use-moods";
import { useTranslation } from "@/i18n/LanguageContext";

export default function SinceLastCheckin() {
  const [, setLocation] = useLocation();
  const { t } = useTranslation();
  const { data: moods = [] } = useMoods() as any;
  const last = [...moods].sort((a:any,b:any)=>b.date.localeCompare(a.date))[0];
  const insufficient = moods.length < 1;
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => setLocation("/dashboard")}><ArrowLeft className="h-4 w-4 mr-2"/>{t("back")}</Button>
        <div><h1 className="text-3xl font-bold">{t("sinceCheckinTitle")}</h1><p className="text-muted-foreground">Deterministic summary</p></div>
      </div>
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5"/>{t("navSinceLastCheckin")}</CardTitle></CardHeader>
        <CardContent>
          {insufficient && <p className="text-sm text-muted-foreground">{t("noCheckinsYet")}</p>}
          {!insufficient && <p className="text-sm">Last mood check-in: {last.mood} on {last.date}. No claims of trend or causation.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
