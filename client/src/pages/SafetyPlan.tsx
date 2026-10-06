import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Shield, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useSafetyPlan, useSaveSafetyPlan } from "@/hooks/use-safety-plan";
import { useTranslation } from "@/i18n/LanguageContext";

const FIELD_ORDER = [
  "trustedContacts",
  "safePlaces",
  "copingStrategies",
  "groundingTechniques",
  "reasonsToKeepGoing",
  "professionalSupport",
  "emergencyResources",
  "notes",
] as const;

type FieldKey = (typeof FIELD_ORDER)[number];

export default function SafetyPlan() {
  const [, setLocation] = useLocation();
  const { t } = useTranslation();
  const { data: plan, isLoading } = useSafetyPlan() as any;
  const save = useSaveSafetyPlan();
  const [form, setForm] = useState<Record<FieldKey, string>>({
    trustedContacts: "",
    safePlaces: "",
    copingStrategies: "",
    groundingTechniques: "",
    reasonsToKeepGoing: "",
    professionalSupport: "",
    emergencyResources: "",
    notes: ""
  });

  useEffect(() => {
    if (plan) {
      setForm({
        trustedContacts: plan.trustedContacts || "",
        safePlaces: plan.safePlaces || "",
        copingStrategies: plan.copingStrategies || "",
        groundingTechniques: plan.groundingTechniques || "",
        reasonsToKeepGoing: plan.reasonsToKeepGoing || "",
        professionalSupport: plan.professionalSupport || "",
        emergencyResources: plan.emergencyResources || "",
        notes: plan.notes || ""
      });
    }
  }, [plan]);

  const handleSave = (e: any) => {
    e.preventDefault();
    save.mutate(form);
  };

  const fieldLabel = (key: FieldKey) =>
    key === "notes" ? t("safetyPlanNotes") : t(key);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => setLocation("/dashboard")}>
          <ArrowLeft className="h-4 w-4 mr-2" />{t("backToDashboard")}
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{t("safetyPlanTitle")}</h1>
          <p className="text-muted-foreground">{t("safetyPlanSubtitle")}</p>
        </div>
      </div>
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5" />{t("yourSafetyPlan")}</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">{t("safetyPlanIntro")}</p>
          <form onSubmit={handleSave} className="space-y-3">
            {FIELD_ORDER.map((k) => (
              <div key={k}>
                <label className="text-sm font-medium">{fieldLabel(k)}</label>
                <Textarea
                  value={form[k]}
                  placeholder={t("safetyPlanPlaceholder")}
                  onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))}
                />
              </div>
            ))}
            <Button type="submit" disabled={save.isPending}><Save className="h-4 w-4 mr-2" />{t("saveSafetyPlan")}</Button>
            {save.isSuccess && <span className="text-sm text-green-600 ml-2">{t("safetyPlanSaved")}</span>}
            {save.isError && <span className="text-sm text-destructive ml-2">{t("failedToSave")}</span>}
          </form>
          {isLoading && <span className="sr-only">{t("loading")}</span>}
        </CardContent>
      </Card>
    </div>
  );
}
