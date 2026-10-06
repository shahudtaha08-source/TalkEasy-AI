import { useLocation } from "wouter";
import { ArrowLeft, Compass, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useMoods } from "@/hooks/use-moods";
import { useJournals } from "@/hooks/use-journals";
import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from "@/i18n/LanguageContext";

export default function WellnessJourney() {
  const [, setLocation] = useLocation();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data: moods=[] } = useMoods() as any;
  const { data: journals=[] } = useJournals() as any;
  const milestones = [];
  if (moods.length>=5) milestones.push({label:t("milestoneMoodTracking"), desc:t("milestoneMoodTrackingDesc")});
  if (journals.length>=3) milestones.push({label:t("milestoneReflection"), desc:t("milestoneReflectionDesc")});
  const insufficient = milestones.length===0;
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => setLocation("/dashboard")}><ArrowLeft className="h-4 w-4 mr-2"/>{t("back")}</Button>
        <div><h1 className="text-3xl font-bold">{t("wellnessJourneyTitle")}</h1><p className="text-muted-foreground">{t("wellnessJourneySubtitle")}</p></div>
      </div>
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Compass className="h-5 w-5"/>{t("journeyMilestones")}</CardTitle></CardHeader>
        <CardContent>
          {insufficient && <p className="text-sm text-muted-foreground">{t("journeyEmpty")}</p>}
          <div className="space-y-2">
            {milestones.map((m,i)=>(
              <div key={i} className="p-2 border rounded"><div className="text-sm font-medium">{m.label}</div><div className="text-xs text-muted-foreground">{m.desc}</div></div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
