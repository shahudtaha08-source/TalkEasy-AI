import { useLocation } from "wouter";
import { ArrowLeft, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useMoods } from "@/hooks/use-moods";
import { useSleep } from "@/hooks/use-sleep";
import { useHabits } from "@/hooks/use-habits";
import { useWater } from "@/hooks/use-water";
import { useTranslation } from "@/i18n/LanguageContext";

export default function PersonalWellnessPlan() {
  const [, setLocation] = useLocation();
  const { t } = useTranslation();
  const { data: moods=[] } = useMoods() as any;
  const { data: sleep=[] } = useSleep() as any;
  const { data: habits=[] } = useHabits() as any;
  const { data: water=[] } = useWater() as any;
  const insufficient = moods.length<2 && sleep.length<2 && habits.length<2 && water.length<2;
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => setLocation("/dashboard")}><ArrowLeft className="h-4 w-4 mr-2"/>{t("back")}</Button>
        <div><h1 className="text-3xl font-bold">{t("wellnessPlanTitle")}</h1><p className="text-muted-foreground">{t("wellnessPlanSubtitle")}</p></div>
      </div>
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5"/>{t("planLabel")}</CardTitle></CardHeader>
        <CardContent>
          {insufficient && <p className="text-sm text-muted-foreground">{t("planEmpty")}</p>}
          {!insufficient && (
            <ul className="text-sm space-y-2">
              <li>{t("planBullet1")}</li>
              <li>{t("planBullet2")}</li>
              <li>{t("planBullet3")}</li>
            </ul>
          )}
          <p className="text-xs text-muted-foreground mt-2">{t("planDisclaimer")}</p>
        </CardContent>
      </Card>
    </div>
  );
}
