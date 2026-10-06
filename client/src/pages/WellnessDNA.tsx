import { useLocation } from "wouter";
import { ArrowLeft, Dna } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useMoods } from "@/hooks/use-moods";
import { useTranslation } from "@/i18n/LanguageContext";

export default function WellnessDNA() {
  const [, setLocation] = useLocation();
  const { t } = useTranslation();
  const { data: moods = [] } = useMoods() as any;
  const moodCount = moods.length;
  const traits = [];
  if (moodCount>=3) traits.push({k:t("traitEmotionalTracking"), v:t("stateConsistent")});
  if (moodCount>=1) traits.push({k:t("traitSelfAwareness"), v:t("statusActive")});
  const insufficient = moodCount < 2;
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => setLocation("/dashboard")}><ArrowLeft className="h-4 w-4 mr-2"/>{t("back")}</Button>
        <div>
          <h1 className="text-3xl font-bold">{t("wellnessDnaTitle")}</h1>
          <p className="text-muted-foreground">{t("wellnessDnaSubtitle")}</p>
        </div>
      </div>
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Dna className="h-5 w-5"/>{t("traitsLabel")}</CardTitle></CardHeader>
        <CardContent>
          {insufficient && <p className="text-sm text-muted-foreground">{t("dnaInsufficient")}</p>}
          {!insufficient && traits.length===0 && <p className="text-sm text-muted-foreground">{t("dnaNoTraits")}</p>}
          <div className="space-y-2">
            {traits.map((tr,i)=>(
              <div key={i} className="flex justify-between p-2 border rounded"><span className="text-sm">{tr.k}</span><span className="text-sm text-muted-foreground">{tr.v}</span></div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
