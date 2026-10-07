import { Dna } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "@/i18n/LanguageContext";
import { useMlWellnessDna } from "@/hooks/use-ml";
import { MlConfidenceChip } from "./MlInsightsCard";

export default function MlWellnessDnaCard() {
  const { t } = useTranslation();
  const { data, isLoading } = useMlWellnessDna();

  const state = isLoading
    ? "loading"
    : !data || data.status === "error"
      ? "unavailable"
      : data.status !== "ok" || !data.data
        ? "insufficient"
        : "ready";

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Dna className="h-5 w-5" />
              {t("mlDnaTitle")}
            </CardTitle>
            <CardDescription>{t("mlDnaSubtitle")}</CardDescription>
          </div>
          <MlConfidenceChip />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {state === "loading" && <div className="h-6 w-2/3 animate-pulse rounded bg-muted" />}
        {state === "unavailable" && <p className="text-sm text-muted-foreground">{t("mlUnavailable")}</p>}
        {state === "insufficient" && <p className="text-sm text-muted-foreground">{t("mlNotEnoughData")}</p>}
        {state === "ready" && (
          <>
            <div className="space-y-3">
              {data!.data!.traits.map((trait) => (
                <div key={trait.traitKey} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span>{t(trait.traitKey)}</span>
                    <span className="text-muted-foreground">{trait.score}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${trait.score}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">{t("mlSamplesLabel", { n: data!.data!.sampleDays })}</p>
          </>
        )}
        <p className="text-xs text-muted-foreground">{t("mlSafetyNote")}</p>
      </CardContent>
    </Card>
  );
}
