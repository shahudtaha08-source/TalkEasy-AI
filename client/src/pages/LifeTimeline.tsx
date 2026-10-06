import { useLocation } from "wouter";
import { ArrowLeft, History } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useJournals } from "@/hooks/use-journals";
import { useTranslation } from "@/i18n/LanguageContext";

export default function LifeTimeline() {
  const [, setLocation] = useLocation();
  const { t } = useTranslation();
  const { data: journals = [] } = useJournals() as any;
  const items = [...journals].sort((a:any,b:any)=>b.date.localeCompare(a.date)).slice(0,20);
  const insufficient = journals.length < 2;
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => setLocation("/dashboard")}><ArrowLeft className="h-4 w-4 mr-2"/>{t("back")}</Button>
        <div><h1 className="text-3xl font-bold">{t("lifeTimelineTitle")}</h1><p className="text-muted-foreground">{t("lifeTimelineSubtitle")}</p></div>
      </div>
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><History className="h-5 w-5"/>{t("timelineLabel")}</CardTitle></CardHeader>
        <CardContent>
          {insufficient && <p className="text-sm text-muted-foreground">{t("notEnoughEntries")}</p>}
          <div className="space-y-2">
            {items.map((j:any)=>(
              <div key={j.id} className="p-2 border rounded"><div className="text-xs text-muted-foreground">{j.date}</div><div className="text-sm font-medium">{j.title||t("journalTitle")}</div><div className="text-xs line-clamp-2 text-muted-foreground">{j.content}</div></div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
