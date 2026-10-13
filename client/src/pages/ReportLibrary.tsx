import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Eye, Calendar, Plus, Loader2, Brain, HeartPulse, Lock } from "lucide-react";
import { useTranslation } from "@/i18n/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { localTzOffsetMinutes } from "@/hooks/use-insights";
import type { InsightBundle, InsightSource } from "@shared/insights";

type ReportType = "30day" | "90day";

interface Report {
  id: number;
  type: ReportType;
  source: InsightSource;
  title: string;
  periodStart: string;
  periodEnd: string;
  summaryJson: string;
  generatedAt: string;
}

interface StoredSummary {
  source: InsightSource;
  bundle: InsightBundle;
}

export default function ReportLibrary() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const response = await fetch("/api/reports", { credentials: "include" });
      const data = await response.json();
      setReports(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch reports:", err);
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async (source: InsightSource, type: ReportType) => {
    setGenerating(true);
    try {
      const tz = localTzOffsetMinutes();
      const res = await fetch(`/api/insights/${source}/${type}?tzOffsetMinutes=${tz}`, {
        credentials: "include",
      });

      if (res.status === 402) {
        toast({ title: t("premiumRequiredTitle"), description: t("premiumRequiredBody") });
        return;
      }
      if (!res.ok) {
        toast({ title: t("noDataYet"), description: t("insufficientDataBody") });
        return;
      }

      const bundle = (await res.json()) as InsightBundle;
      const sourceLabel = source === "wearable" ? t("reportSourceWearable") : t("reportSourceWellness");
      const title = `${sourceLabel} — ${type === "30day" ? t("trend30") : t("trend90")} (${bundle.range.start} → ${bundle.range.end})`;

      const response = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          type,
          source,
          title,
          periodStart: bundle.range.start,
          periodEnd: bundle.range.end,
          summaryJson: JSON.stringify({ source, bundle } satisfies StoredSummary),
        }),
      });

      if (response.ok) {
        await fetchReports();
        toast({ title: "Report generated", description: title });
      } else if (response.status === 402) {
        toast({ title: t("premiumRequiredTitle"), description: t("premiumRequiredBody") });
      }
    } catch (err) {
      console.error("Failed to generate report:", err);
    } finally {
      setGenerating(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const parseSummary = (report: Report): StoredSummary | null => {
    try {
      const parsed = JSON.parse(report.summaryJson);
      if (parsed && parsed.bundle) return parsed as StoredSummary;
    } catch {
      /* legacy format fallback below */
    }
    return null;
  };

  const downloadReport = (report: Report) => {
    let content = `${report.title}\n`;
    content += `Period: ${formatDate(report.periodStart)} – ${formatDate(report.periodEnd)}\n`;
    content += `Generated: ${formatDate(report.generatedAt)}\n`;
    content += `Data source: ${report.source === "wearable" ? "Device Health" : "Personal Wellness"}\n\n`;

    const stored = parseSummary(report);
    if (stored) {
      content += "=== Metrics ===\n";
      stored.bundle.metrics
        .filter((m) => m.hasData)
        .forEach((m) => {
          content += `${m.label}: ${m.value ?? "N/A"}${m.unit ? ` ${m.unit}` : ""} (${m.sampleCount} samples)\n`;
        });
      content += "\n=== Insights ===\n";
      stored.bundle.highlights.forEach((h) => {
        content += `\n[${h.priority.toUpperCase()}] ${h.title}\n${h.message}\n`;
      });
      content += "\n=== Data Disclaimer ===\n";
      content += stored.source === "wearable"
        ? "Device readings are provided for information only and are not medical advice.\n"
        : "This data is not medical advice and should not be used for medical diagnosis.\n";
    } else {
      content += "(This report was generated by an earlier version and uses the legacy format.)\n";
    }

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${report.title.replace(/[^\w-]+/g, "_")}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading reports...</p>
        </div>
      </div>
    );
  }

  const wellnessReports = reports.filter((r) => (r.source || "wellness") === "wellness");
  const wearableReports = reports.filter((r) => r.source === "wearable");

  const renderGroup = (title: string, icon: React.ReactNode, group: Report[], source: InsightSource) => (
    <section className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h2>
        <Badge variant="outline">{group.length}</Badge>
      </div>
      {group.length === 0 ? (
        <Card className="text-center py-8">
          <CardContent>
            <FileText className="h-10 w-10 mx-auto mb-3 text-gray-400" />
            <p className="text-gray-600 dark:text-gray-400 mb-4">No {title} reports yet.</p>
            <Button onClick={() => generateReport(source, "30day")} disabled={generating} variant="outline">
              <Plus className="h-4 w-4 mr-2" /> Generate 30-Day Report
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {group.map((report) => (
            <Card key={report.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-start justify-between gap-2">
                  <span className="text-base">{report.title}</span>
                  <span className="text-xs px-2 py-1 rounded-full whitespace-nowrap bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    {report.type === "30day" ? t("period30") : t("period90")}
                  </span>
                </CardTitle>
                <CardDescription className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {formatDate(report.periodStart)} – {formatDate(report.periodEnd)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => setSelectedReport(report)}>
                    <Eye className="h-4 w-4 mr-2" /> View
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => downloadReport(report)}>
                    <Download className="h-4 w-4 mr-2" /> Download
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Report Library</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Reports are generated separately for TalkEasy AI (personal wellness) and TalkEasy Wearable (device health).
          </p>
        </div>

        {/* Generation controls */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" /> Generate a report</CardTitle>
            <CardDescription>Choose a data source and period. 30- and 90-day reports require trial or Premium access.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button onClick={() => generateReport("wellness", "30day")} disabled={generating}>
              {generating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Brain className="h-4 w-4 mr-2" />}
              Wellness · 30-Day
            </Button>
            <Button onClick={() => generateReport("wearable", "30day")} disabled={generating} variant="outline">
              {generating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <HeartPulse className="h-4 w-4 mr-2" />}
              Wearable · 30-Day
            </Button>
            <Button onClick={() => generateReport("wellness", "90day")} disabled={generating} variant="secondary">
              {generating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Lock className="h-4 w-4 mr-2" />}
              Wellness · 90-Day
            </Button>
            <Button onClick={() => generateReport("wearable", "90day")} disabled={generating} variant="secondary">
              {generating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Lock className="h-4 w-4 mr-2" />}
              Wearable · 90-Day
            </Button>
          </CardContent>
        </Card>

        {/* Sources kept visually separate */}
        {renderGroup(t("reportSourceWellness"), <Brain className="h-6 w-6 text-teal-600" />, wellnessReports, "wellness")}
        {renderGroup(t("reportSourceWearable"), <HeartPulse className="h-6 w-6 text-rose-600" />, wearableReports, "wearable")}

        {/* Report View Modal */}
        {selectedReport && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{selectedReport.title}</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedReport(null)}>✕</Button>
                </div>
                <CardDescription>
                  {formatDate(selectedReport.periodStart)} – {formatDate(selectedReport.periodEnd)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ReportView report={selectedReport} />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

function ReportView({ report }: { report: Report }) {
  let summary: StoredSummary | null = null;
  try {
    summary = JSON.parse(report.summaryJson);
  } catch {
    summary = null;
  }

  if (!summary || !summary.bundle) {
    return (
      <p className="text-sm text-muted-foreground">
        This report was generated by an earlier version and uses a legacy format that is no longer rendered here.
      </p>
    );
  }

  const { bundle } = summary;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-3">Metrics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {bundle.metrics.filter((m) => m.hasData).map((m) => (
            <div key={m.key} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-xs text-gray-600 dark:text-gray-400">{m.label}</p>
              <p className="text-lg font-bold">{m.value ?? "N/A"}{m.unit ? ` ${m.unit}` : ""}</p>
              <p className="text-xs text-gray-500">{m.sampleCount} samples</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">Insights</h3>
        <div className="space-y-3">
          {bundle.highlights.map((h) => (
            <div key={h.id} className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
              <h4 className="font-semibold mb-1">{h.title}</h4>
              <p className="text-sm text-gray-700 dark:text-gray-300">{h.message}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
        <h3 className="text-lg font-semibold text-amber-800 dark:text-amber-400 mb-2">Data Disclaimer</h3>
        <p className="text-sm text-gray-700 dark:text-gray-300">
          {summary.source === "wearable"
            ? "Device readings are shown for information only and are not medical advice. TalkEasy does not invent device measurements."
            : "This data is not medical advice and should not be used for medical diagnosis. Consult a qualified healthcare professional for medical interpretation."}
        </p>
      </div>
    </div>
  );
}
