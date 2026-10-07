import { Brain, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "@/i18n/LanguageContext";
import { useMlPatterns, useMlAnomalies, useMlClusters, useMlForecasts, useMlConfidence } from "@/hooks/use-ml";
import { METRIC_KEYS } from "@shared/ml-types";
import type { MlEnvelope } from "@shared/ml-types";

export type MlSection = "patterns" | "anomalies" | "clusters" | "forecasts";

function Pulse({ className = "" }: { className?: string }) {
  return <div className={`h-6 w-2/3 animate-pulse rounded bg-muted ${className}`} />;
}

function Muted({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-muted-foreground">{children}</p>;
}

export function MlConfidenceChip() {
  const { t } = useTranslation();
  const { data } = useMlConfidence();
  const confidence = data?.confidence ?? data?.data;
  const tier = confidence?.tier;
  const label =
    data && data.status === "insufficient"
      ? t("confidenceInsufficient")
      : tier === "high"
        ? t("confidenceHigh")
        : tier === "moderate"
          ? t("confidenceModerate")
          : tier === "low"
            ? t("confidenceLow")
            : null;
  if (!label) return null;
  return (
    <span className="whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs text-muted-foreground">
      {label}
      {confidence ? ` · ${confidence.score}%` : ""}
    </span>
  );
}

function useSectionState<T>(query: { data: MlEnvelope<T> | null | undefined; isLoading: boolean }): "loading" | "unavailable" | "insufficient" | "ready" {
  if (query.isLoading) return "loading";
  const envelope = query.data;
  if (!envelope || envelope.status === "error") return "unavailable";
  if (envelope.status !== "ok" || !envelope.data) return "insufficient";
  return "ready";
}

function PatternsSection() {
  const { t } = useTranslation();
  const query = useMlPatterns();
  const state = useSectionState(query);
  if (state === "loading") return <Pulse />;
  if (state === "unavailable") return <Muted>{t("mlUnavailable")}</Muted>;
  if (state === "insufficient") return <Muted>{t("mlNotEnoughData")}</Muted>;
  const patterns = query.data!.data!.patterns;
  if (patterns.length === 0) return <Muted>{t("mlNotEnoughData")}</Muted>;
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold">{t("mlPatternsTitle")}</h3>
      {patterns.map((p) => (
        <div key={p.pairKey} className="rounded border p-2 text-sm">
          {t(p.direction === "together" ? "mlPatternTogether" : "mlPatternOpposite", {
            pair: t(p.pairKey),
            n: p.n,
          })}
        </div>
      ))}
      <p className="text-xs text-muted-foreground">{t("mlObservationNote")}</p>
    </div>
  );
}

function AnomaliesSection() {
  const { t } = useTranslation();
  const query = useMlAnomalies();
  const state = useSectionState(query);
  if (state === "loading") return <Pulse />;
  if (state === "unavailable") return <Muted>{t("mlUnavailable")}</Muted>;
  if (state === "insufficient") return <Muted>{t("mlNotEnoughData")}</Muted>;
  const anomalies = query.data!.data!.anomalies;
  if (anomalies.length === 0) return null;
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold">{t("mlAnomaliesTitle")}</h3>
      {anomalies.map((a) => (
        <div key={`${a.feature}-${a.date}`} className="flex items-start justify-between gap-3 rounded border p-2">
          <span className="text-sm">
            {t(a.direction === "high" ? "mlAnomalyHigh" : "mlAnomalyLow", { metric: t(METRIC_KEYS[a.feature]) })}
          </span>
          <span className="whitespace-nowrap text-xs text-muted-foreground">{a.date}</span>
        </div>
      ))}
    </div>
  );
}

function ClustersSection() {
  const { t } = useTranslation();
  const query = useMlClusters();
  const state = useSectionState(query);
  if (state === "loading") return <Pulse />;
  if (state === "unavailable") return <Muted>{t("mlUnavailable")}</Muted>;
  if (state === "insufficient") return <Muted>{t("mlNotEnoughData")}</Muted>;
  const clusters = query.data!.data!.clusters;
  if (clusters.length === 0) return null;
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold">{t("mlClustersTitle")}</h3>
      {clusters.map((c) => (
        <div key={c.labelKey} className="flex items-center justify-between rounded border p-2">
          <span className="text-sm">{t(c.labelKey)}</span>
          <span className="text-xs text-muted-foreground">{t("mlSamplesLabel", { n: c.size })}</span>
        </div>
      ))}
    </div>
  );
}

function ForecastsSection() {
  const { t } = useTranslation();
  const query = useMlForecasts();
  const state = useSectionState(query);
  if (state === "loading") return <Pulse />;
  if (state === "unavailable") return <Muted>{t("mlUnavailable")}</Muted>;
  if (state === "insufficient") return <Muted>{t("mlNotEnoughData")}</Muted>;
  const { series, days } = query.data!.data!;
  if (series.length === 0) return null;
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold">{t("mlForecastsTitle")}</h3>
      <p className="text-xs text-muted-foreground">{t("mlForecastNote", { days })}</p>
      {series.map((s) => (
        <div key={s.feature} className="flex items-center justify-between gap-3 rounded border p-2">
          <span className="flex items-center gap-2 text-sm">
            {s.trend === "rising" ? (
              <TrendingUp className="h-4 w-4 text-emerald-600" />
            ) : s.trend === "falling" ? (
              <TrendingDown className="h-4 w-4 text-amber-600" />
            ) : (
              <Minus className="h-4 w-4 text-muted-foreground" />
            )}
            {t(METRIC_KEYS[s.feature])}
          </span>
          <span className="text-xs text-muted-foreground">
            {t("mlForecastRange", { low: s.low, high: s.high })}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function MlInsightsCard({ sections }: { sections: MlSection[] }) {
  const { t } = useTranslation();
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              {t("mlInsightsTitle")}
            </CardTitle>
            <CardDescription>{t("mlInsightsSubtitle")}</CardDescription>
          </div>
          <MlConfidenceChip />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {sections.includes("patterns") && <PatternsSection />}
        {sections.includes("anomalies") && <AnomaliesSection />}
        {sections.includes("clusters") && <ClustersSection />}
        {sections.includes("forecasts") && <ForecastsSection />}
        <p className="text-xs text-muted-foreground">{t("mlSafetyNote")}</p>
      </CardContent>
    </Card>
  );
}
