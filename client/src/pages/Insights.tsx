import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Brain,
  HeartPulse,
  Activity,
  AlertTriangle,
  Lock,
  Sparkles,
  Database,
  Info,
} from "lucide-react";
import { useTranslation } from "@/i18n/LanguageContext";
import { useInsights } from "@/hooks/use-insights";
import { useEntitlement } from "@/hooks/use-entitlement";
import type { InsightPeriod, InsightSource } from "@shared/insights";
import { PERIOD_MIN_DAYS } from "@shared/insights";

const PERIODS: InsightPeriod[] = ["daily", "weekly", "30day", "90day"];

const PRIORITY_STYLES: Record<string, string> = {
  high: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  medium: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  low: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300",
  info: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
};

export default function Insights({ source }: { source: InsightSource }) {
  const { t } = useTranslation();
  const [period, setPeriod] = useState<InsightPeriod>("daily");
  const { data, isLoading } = useInsights(source, period);
  const { data: entitlement } = useEntitlement();

  const isWearable = source === "wearable";
  const title = isWearable ? t("wearableSourceTitle") : t("wellnessSourceTitle");
  const subtitle = isWearable ? t("wearableSourceSubtitle") : t("wellnessSourceSubtitle");

  const periodLabel = (p: InsightPeriod): string =>
    p === "daily" ? t("periodDaily") : p === "weekly" ? t("periodWeekly") : p === "30day" ? t("period30") : t("period90");

  const bundle = data?.kind === "ok" ? data.bundle : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-slate-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            {isWearable ? (
              <HeartPulse className="h-8 w-8 text-rose-600 dark:text-rose-400" />
            ) : (
              <Brain className="h-8 w-8 text-teal-600 dark:text-teal-400" />
            )}
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{title}</h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">{subtitle}</p>
          <div className="mt-2">
            <Badge
              variant="outline"
              className={isWearable ? "text-rose-700 dark:text-rose-300 border-rose-300" : "text-teal-700 dark:text-teal-300 border-teal-300"}
            >
              {isWearable ? t("sourceLabelWearable") : t("navWellnessInsights")}
            </Badge>
          </div>
        </div>

        {/* Period selector */}
        <div className="flex flex-wrap gap-2 mb-6">
          {PERIODS.map((p) => {
            const locked = p === "90day" && entitlement ? !entitlement.canAccess90Day : false;
            return (
              <Button
                key={p}
                variant={period === p ? "default" : "outline"}
                size="sm"
                onClick={() => setPeriod(p)}
                className="gap-2"
              >
                {locked && <Lock className="h-3.5 w-3.5" />}
                {periodLabel(p)}
              </Button>
            );
          })}
        </div>

        {isLoading && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <Activity className="h-8 w-8 animate-spin mx-auto mb-3 text-primary" />
              Loading insights…
            </CardContent>
          </Card>
        )}

        {!isLoading && data?.kind === "unauthorized" && (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">{t("insufficientDataBody")}</CardContent>
          </Card>
        )}

        {!isLoading && data?.kind === "premium_required" && (
          <Card className="border-teal-300 dark:border-teal-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-teal-700 dark:text-teal-300">
                <Lock className="h-5 w-5" /> {t("premiumRequiredTitle")}
              </CardTitle>
              <CardDescription>{t("premiumRequiredBody")}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">{t("premiumPriceLabel")}</p>
              <Button disabled title={t("premiumRequiredBody")}>
                <Sparkles className="h-4 w-4 mr-2" />
                {t("premiumRequiredTitle")}
              </Button>
              <p className="text-xs text-muted-foreground mt-3">{t("freeTrialNotice")}</p>
            </CardContent>
          </Card>
        )}

        {!isLoading && data?.kind === "error" && (
          <Card className="border-red-200 dark:border-red-800">
            <CardContent className="py-10 flex items-center justify-center gap-2 text-red-600 dark:text-red-400">
              <AlertTriangle className="h-5 w-5" /> {data.message}
            </CardContent>
          </Card>
        )}

        {!isLoading && bundle && (
          <div className="space-y-6">
            {/* Demo / source notice */}
            {bundle.isDemoData && (
              <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10">
                <CardContent className="py-4 flex items-center gap-3 text-amber-700 dark:text-amber-300">
                  <Info className="h-5 w-5 flex-shrink-0" />
                  <span className="text-sm font-medium">{t("wearableDemoLabel")}</span>
                </CardContent>
              </Card>
            )}

            {/* Wearable empty state */}
            {isWearable && bundle.sampleCount === 0 && (
              <Card className="border-dashed">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <HeartPulse className="h-5 w-5 text-rose-600" /> {t("deviceNotConnectedTitle")}
                  </CardTitle>
                  <CardDescription>{t("deviceNotConnectedBody")}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{t("wearableEmptyHint")}</p>
                </CardContent>
              </Card>
            )}

            {/* Insufficient wellness data */}
            {!isWearable && bundle.insufficientData && (
              <Card className="border-amber-200 dark:border-amber-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-600" /> {t("insufficientDataTitle")}
                  </CardTitle>
                  <CardDescription>
                    {bundle.insufficientReason || t("insufficientDataBody")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    {t("dataCoverage")}: {bundle.coverage.daysWithData}/{bundle.coverage.totalDays} · {PERIOD_MIN_DAYS[bundle.period]}{" "}
                    minimum
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Metric grid */}
            {bundle.metrics.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {bundle.metrics
                  .filter((m) => m.hasData)
                  .map((m) => (
                    <Card key={m.key}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">{m.label}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          {m.value === null ? t("noDataYet") : `${m.value}${m.unit ? ` ${m.unit}` : ""}`}
                          {m.secondaryValue != null && (
                            <span className="text-base text-muted-foreground"> / {m.secondaryValue}</span>
                          )}
                        </div>
                        {m.detail && <p className="text-xs text-muted-foreground mt-1">{m.detail}</p>}
                        <p className="text-[11px] text-muted-foreground mt-2">
                          {t("sampleCount", { n: m.sampleCount })}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            )}

            {/* Highlights */}
            {bundle.highlights.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>{isWearable ? t("wearableInsightsTitle") : t("wellnessInsightsTitle")}</CardTitle>
                  <CardDescription>
                    {t("generatedReportRange", { start: bundle.range.start, end: bundle.range.end })}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {bundle.highlights.map((h) => (
                    <div key={h.id} className="flex items-start gap-3">
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${PRIORITY_STYLES[h.priority]}`}>
                        {h.priority}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{h.title}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{h.message}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Coverage footer */}
            <Card className="bg-slate-50/50 dark:bg-slate-900/20">
              <CardContent className="py-4 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Database className="h-3.5 w-3.5" />
                  {t("dataCoverage")}: {bundle.coverage.daysWithData}/{bundle.coverage.totalDays} ({bundle.coverage.coveragePct}%)
                </span>
                <span>{t("sampleCount", { n: bundle.sampleCount })}</span>
                {bundle.missingData.length > 0 && (
                  <span>
                    {t("missingDataLabel")}: {bundle.missingData.slice(0, 5).join(", ")}
                  </span>
                )}
              </CardContent>
            </Card>

            {isWearable && (
              <p className="text-xs text-muted-foreground text-center">
                Device readings are shown for information only and are not medical advice.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
