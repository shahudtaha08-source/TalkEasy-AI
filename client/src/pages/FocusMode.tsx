import { useLocation } from "wouter";
import { ArrowLeft, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/i18n/LanguageContext";

export default function FocusMode() {
  const [, setLocation] = useLocation();
  const { t } = useTranslation();
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => setLocation("/dashboard")}><ArrowLeft className="h-4 w-4 mr-2"/>{t("back")}</Button>
        <div><h1 className="text-3xl font-bold">{t("focusModeTitle")}</h1><p className="text-muted-foreground">{t("focusModeSubtitle")}</p></div>
      </div>
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Zap className="h-5 w-5"/>{t("focusModeTitle")}</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{t("focusModeBody")}</p>
        </CardContent>
      </Card>
    </div>
  );
}
