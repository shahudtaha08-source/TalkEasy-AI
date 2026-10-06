import { useLocation } from "wouter";
import { ArrowLeft, CalendarClock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/i18n/LanguageContext";

export default function WhyToday() {
  const [, setLocation] = useLocation();
  const { t } = useTranslation();
  const suggestions = [
    t("whyToday1"),
    t("whyToday2"),
    t("whyToday3"),
    t("whyToday4")
  ];
  const s = suggestions[new Date().getDay() % suggestions.length];
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => setLocation("/dashboard")}><ArrowLeft className="h-4 w-4 mr-2"/>{t("back")}</Button>
        <div><h1 className="text-3xl font-bold">{t("whyTodayTitle")}</h1><p className="text-muted-foreground">{t("whyTodaySubtitle")}</p></div>
      </div>
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><CalendarClock className="h-5 w-5"/>{t("todaysPrompt")}</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm">{s}</p>
          <p className="text-xs text-muted-foreground mt-2">{t("whyTodayNote")}</p>
        </CardContent>
      </Card>
    </div>
  );
}
