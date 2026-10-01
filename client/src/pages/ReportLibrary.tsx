import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, Eye, Calendar, Plus, Loader2 } from "lucide-react";
import { generateWellnessInsights, getThought } from "@shared/wellness-insights";

interface Report {
  id: number;
  type: "30day" | "90day";
  title: string;
  periodStart: string;
  periodEnd: string;
  summaryJson: string;
  generatedAt: string;
}

interface HealthRecord {
  heartRate?: number;
  spo2?: number;
  systolicBp?: number;
  diastolicBp?: number;
  steps?: number;
  sleepHours?: number;
  waterMl?: number;
  stressLevel?: string;
  mood?: string;
  moodIntensity?: number;
}

export default function ReportLibrary() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const response = await fetch("/api/reports");
      const data = await response.json();
      setReports(data || []);
    } catch (err) {
      console.error("Failed to fetch reports:", err);
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async (type: "30day" | "90day") => {
    setGenerating(true);
    try {
      // Fetch data for the report
      const [healthRecords, moodEntries, stressEntries] = await Promise.all([
        fetch("/api/health-daily-records?limit=" + (type === "30day" ? 30 : 90)).then(r => r.json()),
        fetch("/api/mood-entries?limit=" + (type === "30day" ? 30 : 90)).then(r => r.json()),
        fetch("/api/stress-entries?limit=" + (type === "30day" ? 30 : 90)).then(r => r.json()),
      ]);

      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - (type === "30day" ? 30 : 90));

      // Generate insights
      const insights = generateWellnessInsights({
        healthRecords: healthRecords || [],
        moodEntries: moodEntries || [],
        stressEntries: stressEntries || [],
      });

      // Calculate averages
      const avgHeartRate = healthRecords.filter((r: HealthRecord) => r.heartRate).length > 0
        ? Math.round(healthRecords.filter((r: HealthRecord) => r.heartRate).reduce((sum: number, r: HealthRecord) => sum + (r.heartRate || 0), 0) / healthRecords.filter((r: HealthRecord) => r.heartRate).length)
        : null;

      const avgSpO2 = healthRecords.filter((r: HealthRecord) => r.spo2).length > 0
        ? Math.round(healthRecords.filter((r: HealthRecord) => r.spo2).reduce((sum: number, r: HealthRecord) => sum + (r.spo2 || 0), 0) / healthRecords.filter((r: HealthRecord) => r.spo2).length)
        : null;

      const avgSteps = healthRecords.filter((r: HealthRecord) => r.steps).length > 0
        ? Math.round(healthRecords.filter((r: HealthRecord) => r.steps).reduce((sum: number, r: HealthRecord) => sum + (r.steps || 0), 0) / healthRecords.filter((r: HealthRecord) => r.steps).length)
        : null;

      const avgSleep = healthRecords.filter((r: HealthRecord) => r.sleepHours).length > 0
        ? (healthRecords.filter((r: HealthRecord) => r.sleepHours).reduce((sum: number, r: HealthRecord) => sum + (r.sleepHours || 0), 0) / healthRecords.filter((r: HealthRecord) => r.sleepHours).length).toFixed(1)
        : null;

      const avgWater = healthRecords.filter((r: HealthRecord) => r.waterMl).length > 0
        ? Math.round(healthRecords.filter((r: HealthRecord) => r.waterMl).reduce((sum: number, r: HealthRecord) => sum + (r.waterMl || 0), 0) / healthRecords.filter((r: HealthRecord) => r.waterMl).length)
        : null;

      // Mood distribution
      const moodDistribution = (moodEntries || []).reduce((acc: any, entry: any) => {
        acc[entry.mood] = (acc[entry.mood] || 0) + 1;
        return acc;
      }, {});

      // Stress distribution
      const stressDistribution = (stressEntries || []).reduce((acc: any, entry: any) => {
        acc[entry.level] = (acc[entry.level] || 0) + 1;
        return acc;
      }, {});

      const summaryJson = JSON.stringify({
        insights,
        averages: {
          heartRate: avgHeartRate,
          spo2: avgSpO2,
          steps: avgSteps,
          sleep: avgSleep,
          water: avgWater,
        },
        moodDistribution,
        stressDistribution,
        healthRecords: healthRecords || [],
        moodEntries: moodEntries || [],
        stressEntries: stressEntries || [],
      });

      const title = type === "30day" 
        ? `${startDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })} 30-Day Wellness Report`
        : `${startDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })} – ${endDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })} 90-Day Wellness Report`;

      const response = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          title,
          periodStart: startDate.toISOString().split("T")[0],
          periodEnd: endDate.toISOString().split("T")[0],
          summaryJson,
        }),
      });

      if (response.ok) {
        await fetchReports();
      }
    } catch (err) {
      console.error("Failed to generate report:", err);
    } finally {
      setGenerating(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const downloadPDF = (report: Report) => {
    // For now, this will generate a simple text-based report
    // In a full implementation, this would use a PDF library like jsPDF
    const summary = JSON.parse(report.summaryJson);
    let content = `${report.title}\n`;
    content += `Period: ${formatDate(report.periodStart)} – ${formatDate(report.periodEnd)}\n`;
    content += `Generated: ${formatDate(report.generatedAt)}\n\n`;
    
    content += "=== Executive Summary ===\n";
    summary.insights.forEach((insight: any) => {
      content += `\n[${insight.priority.toUpperCase()}] ${insight.title}\n`;
      content += `${insight.message}\n`;
      if (insight.suggestion) {
        content += `Suggestion: ${insight.suggestion}\n`;
      }
    });

    content += "\n=== Averages ===\n";
    if (summary.averages.heartRate) content += `Heart Rate: ${summary.averages.heartRate} BPM (Demo data)\n`;
    if (summary.averages.spo2) content += `SpO2: ${summary.averages.spo2}% (Demo data)\n`;
    if (summary.averages.steps) content += `Steps: ${summary.averages.steps.toLocaleString()} (Demo data)\n`;
    if (summary.averages.sleep) content += `Sleep: ${summary.averages.sleep} hours\n`;
    if (summary.averages.water) content += `Water: ${summary.averages.water} ml\n`;

    content += "\n=== Mood Distribution ===\n";
    Object.entries(summary.moodDistribution).forEach(([mood, count]) => {
      content += `${mood}: ${count}\n`;
    });

    content += "\n=== Stress Distribution ===\n";
    Object.entries(summary.stressDistribution).forEach(([level, count]) => {
      content += `${level}: ${count}\n`;
    });

    content += "\n=== Data Disclaimer ===\n";
    content += "Health metrics marked as 'Demo data' are simulated values for demonstration purposes.\n";
    content += "Wearable device integration is planned for a future TalkEasy release.\n";
    content += "This data is not medical advice and should not be used for medical diagnosis.\n";
    content += "Consult a qualified healthcare professional for medical interpretation.\n";

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${report.title.replace(/\s+/g, "_")}.txt`;
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Report Library</h1>
            <p className="text-gray-600 dark:text-gray-400">View and download your wellness reports</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => generateReport("30day")}
              disabled={generating}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {generating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
              30-Day Report
            </Button>
            <Button
              onClick={() => generateReport("90day")}
              disabled={generating}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {generating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
              90-Day Report
            </Button>
          </div>
        </div>

        {reports.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <FileText className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-semibold mb-2">No Reports Yet</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Generate your first wellness report to see your trends and insights.
              </p>
              <Button onClick={() => generateReport("30day")} disabled={generating}>
                {generating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                Generate 30-Day Report
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reports.map((report) => (
              <Card key={report.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-start justify-between">
                    <span className="text-lg">{report.title}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      report.type === "30day" ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" : "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                    }`}>
                      {report.type === "30day" ? "30-Day" : "90-Day"}
                    </span>
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {formatDate(report.periodStart)} – {formatDate(report.periodEnd)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => setSelectedReport(report)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => downloadPDF(report)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Report View Modal */}
        {selectedReport && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{selectedReport.title}</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedReport(null)}>
                    ✕
                  </Button>
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
  const summary = JSON.parse(report.summaryJson);

  return (
    <div className="space-y-6">
      {/* Executive Summary */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Executive Summary</h3>
        <div className="space-y-3">
          {summary.insights.map((insight: any, index: number) => (
            <div
              key={index}
              className={`p-4 rounded-lg border ${
                insight.priority === "high"
                  ? "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20"
                  : insight.priority === "medium"
                  ? "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20"
                  : "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20"
              }`}
            >
              <h4 className="font-semibold mb-1">{insight.title}</h4>
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">{insight.message}</p>
              {insight.suggestion && (
                <p className="text-sm text-gray-600 dark:text-gray-400 italic">{insight.suggestion}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Averages */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Average Metrics</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-xs text-gray-600 dark:text-gray-400">Heart Rate</p>
            <p className="text-lg font-bold">{summary.averages.heartRate ? `${summary.averages.heartRate} BPM` : "N/A"}</p>
            <p className="text-xs text-gray-500">Demo data</p>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-xs text-gray-600 dark:text-gray-400">SpO2</p>
            <p className="text-lg font-bold">{summary.averages.spo2 ? `${summary.averages.spo2}%` : "N/A"}</p>
            <p className="text-xs text-gray-500">Demo data</p>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-xs text-gray-600 dark:text-gray-400">Steps</p>
            <p className="text-lg font-bold">{summary.averages.steps ? summary.averages.steps.toLocaleString() : "N/A"}</p>
            <p className="text-xs text-gray-500">Demo data</p>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-xs text-gray-600 dark:text-gray-400">Sleep</p>
            <p className="text-lg font-bold">{summary.averages.sleep ? `${summary.averages.sleep}h` : "N/A"}</p>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-xs text-gray-600 dark:text-gray-400">Water</p>
            <p className="text-lg font-bold">{summary.averages.water ? `${summary.averages.water}ml` : "N/A"}</p>
          </div>
        </div>
      </div>

      {/* Mood Distribution */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Mood Distribution</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries(summary.moodDistribution).map(([mood, count]) => (
            <div key={mood} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
              <p className="font-semibold">{mood}</p>
              <p className="text-2xl font-bold">{count as number}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Stress Distribution */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Stress Distribution</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries(summary.stressDistribution).map(([level, count]) => (
            <div key={level} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
              <p className="font-semibold">{level}</p>
              <p className="text-2xl font-bold">{count as number}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Data Disclaimer */}
      <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
        <h3 className="text-lg font-semibold text-amber-800 dark:text-amber-400 mb-2">Data Disclaimer</h3>
        <p className="text-sm text-gray-700 dark:text-gray-300">
          Health metrics marked as "Demo data" are simulated values for demonstration purposes. 
          Wearable device integration is planned for a future TalkEasy release. 
          This data is not medical advice and should not be used for medical diagnosis. 
          Consult a qualified healthcare professional for medical interpretation of health metrics.
        </p>
      </div>
    </div>
  );
}
