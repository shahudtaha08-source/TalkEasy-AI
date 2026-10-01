import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Calendar, TrendingUp, TrendingDown, Activity, Droplet, Moon, Footprints, Heart, Activity as HeartPulse } from "lucide-react";

interface HealthRecord {
  id: number;
  date: string;
  heartRate?: number;
  spo2?: number;
  systolicBp?: number;
  diastolicBp?: number;
  steps?: number;
  sleepHours?: number;
  waterMl?: number;
  stressLevel?: string;
  mood?: string;
  isDemo: boolean;
}

interface MoodEntry {
  id: number;
  date: string;
  mood: string;
  intensity: number;
}

interface StressEntry {
  id: number;
  date: string;
  level: string;
}

export default function Trends30Days() {
  const [healthRecords, setHealthRecords] = useState<HealthRecord[]>([]);
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([]);
  const [stressEntries, setStressEntries] = useState<StressEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/health-daily-records?limit=30").then(r => r.json()),
      fetch("/api/mood-entries?limit=30").then(r => r.json()),
      fetch("/api/stress-entries?limit=30").then(r => r.json()),
    ]).then(([health, mood, stress]) => {
      setHealthRecords(health || []);
      setMoodEntries(mood || []);
      setStressEntries(stress || []);
      setLoading(false);
    }).catch(err => {
      console.error("Failed to fetch trends data:", err);
      setLoading(false);
    });
  }, []);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  // Prepare heart rate data
  const heartRateRecords = healthRecords
    .filter((r): r is HealthRecord & { heartRate: number } => typeof r.heartRate === "number");
  const heartRateData = heartRateRecords
    .map(r => ({
      date: formatDate(r.date),
      heartRate: r.heartRate,
    }))
    .reverse();

  // Prepare SpO2 data
  const spo2Records = healthRecords
    .filter((r): r is HealthRecord & { spo2: number } => typeof r.spo2 === "number");
  const spo2Data = spo2Records
    .map(r => ({
      date: formatDate(r.date),
      spo2: r.spo2,
    }))
    .reverse();

  // Prepare blood pressure data
  const bpData = healthRecords
    .filter(r => r.systolicBp && r.diastolicBp)
    .map(r => ({
      date: formatDate(r.date),
      systolic: r.systolicBp,
      diastolic: r.diastolicBp,
    }))
    .reverse();

  // Prepare steps data
  const stepsRecords = healthRecords
    .filter((r): r is HealthRecord & { steps: number } => typeof r.steps === "number");
  const stepsData = stepsRecords
    .map(r => ({
      date: formatDate(r.date),
      steps: r.steps,
    }))
    .reverse();

  // Prepare sleep data
  const sleepRecords = healthRecords
    .filter((r): r is HealthRecord & { sleepHours: number } => typeof r.sleepHours === "number");
  const sleepData = sleepRecords
    .map(r => ({
      date: formatDate(r.date),
      sleep: r.sleepHours,
    }))
    .reverse();

  // Prepare water data
  const waterRecords = healthRecords
    .filter((r): r is HealthRecord & { waterMl: number } => typeof r.waterMl === "number");
  const waterData = waterRecords
    .map(r => ({
      date: formatDate(r.date),
      water: r.waterMl,
    }))
    .reverse();

  // Prepare mood distribution
  const moodDistribution = moodEntries.reduce((acc, entry) => {
    acc[entry.mood] = (acc[entry.mood] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const moodPieData = Object.entries(moodDistribution).map(([mood, count]) => ({
    name: mood,
    value: count,
  }));

  // Prepare stress distribution
  const stressDistribution = stressEntries.reduce((acc, entry) => {
    acc[entry.level] = (acc[entry.level] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const stressPieData = Object.entries(stressDistribution).map(([level, count]) => ({
    name: level,
    value: count,
  }));

  // Calculate averages
  const avgHeartRate = heartRateData.length > 0
    ? Math.round(heartRateData.reduce((sum, d) => sum + d.heartRate, 0) / heartRateData.length)
    : null;

  const avgSpO2 = spo2Data.length > 0
    ? Math.round(spo2Data.reduce((sum, d) => sum + d.spo2, 0) / spo2Data.length)
    : null;

  const avgSteps = stepsData.length > 0
    ? Math.round(stepsData.reduce((sum, d) => sum + d.steps, 0) / stepsData.length)
    : null;

  const avgSleep = sleepData.length > 0
    ? (sleepData.reduce((sum, d) => sum + d.sleep, 0) / sleepData.length).toFixed(1)
    : null;

  const avgWater = waterData.length > 0
    ? Math.round(waterData.reduce((sum, d) => sum + d.water, 0) / waterData.length)
    : null;

  const moderateHighStressCount = stressEntries.filter(e => e.level === "Moderate" || e.level === "High").length;
  const lowWaterDays = waterData.filter(d => d.water < 2000).length;

  const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#00c49f", "#ff00ff"];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Activity className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading 30-day trends...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">30-Day Wellness Trends</h1>
          <p className="text-gray-600 dark:text-gray-400">Your wellness patterns over the last 30 days</p>
        </div>

        {/* Key Insights */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Heart Rate</CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{avgHeartRate ? `${avgHeartRate} BPM` : "N/A"}</div>
              <p className="text-xs text-muted-foreground">Demo data</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg SpO2</CardTitle>
              <HeartPulse className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{avgSpO2 ? `${avgSpO2}%` : "N/A"}</div>
              <p className="text-xs text-muted-foreground">Demo data</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Steps</CardTitle>
              <Footprints className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{avgSteps ? avgSteps.toLocaleString() : "N/A"}</div>
              <p className="text-xs text-muted-foreground">Demo data</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Sleep</CardTitle>
              <Moon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{avgSleep ? `${avgSleep}h` : "N/A"}</div>
              <p className="text-xs text-muted-foreground">Daily average</p>
            </CardContent>
          </Card>
        </div>

        {/* Notable Patterns */}
        {(moderateHighStressCount > 0 || lowWaterDays > 0) && (
          <Card className="mb-8 border-amber-200 dark:border-amber-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-amber-600" />
                Notable Patterns
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {moderateHighStressCount > 0 && (
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-semibold">Stress:</span> Moderate or high stress was recorded on {moderateHighStressCount} of the last 30 tracked days. Consider stress management techniques like breathing exercises or short walks.
                </p>
              )}
              {lowWaterDays > 0 && (
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-semibold">Hydration:</span> Your recorded water intake was below your target on {lowWaterDays} tracked days. Try drinking water regularly throughout the day.
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Heart Rate Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Heart Rate Trend</CardTitle>
              <CardDescription>Demo data — wearable device not connected</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={heartRateData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="heartRate" stroke="#8884d8" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* SpO2 Chart */}
          <Card>
            <CardHeader>
              <CardTitle>SpO2 Trend</CardTitle>
              <CardDescription>Demo data — wearable device not connected</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={spo2Data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[90, 100]} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="spo2" stroke="#82ca9d" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Blood Pressure Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Blood Pressure Trend</CardTitle>
              <CardDescription>Demo data — Consult a healthcare professional for medical interpretation</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={bpData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="systolic" stroke="#ff7300" strokeWidth={2} name="Systolic" />
                  <Line type="monotone" dataKey="diastolic" stroke="#00c49f" strokeWidth={2} name="Diastolic" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Steps Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Daily Steps</CardTitle>
              <CardDescription>Demo data — wearable device not connected</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stepsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="steps" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Sleep Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Sleep Duration</CardTitle>
              <CardDescription>Daily sleep hours</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={sleepData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="sleep" stroke="#ffc658" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Water Intake Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Water Intake</CardTitle>
              <CardDescription>Daily water consumption (ml)</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={waterData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="water" fill="#00c49f" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Mood Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Mood Distribution</CardTitle>
              <CardDescription>Mood entries over 30 days</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={moodPieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {moodPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Stress Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Stress Level Distribution</CardTitle>
              <CardDescription>Stress entries over 30 days</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={stressPieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {stressPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Data Disclaimer */}
        <Card className="border-amber-200 dark:border-amber-800">
          <CardHeader>
            <CardTitle className="text-amber-700 dark:text-amber-400">Data Disclaimer</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Health metrics displayed as "Demo data" are simulated values for demonstration purposes. 
              Wearable device integration is planned for a future TalkEasy release. 
              This data is not medical advice and should not be used for medical diagnosis. 
              Consult a qualified healthcare professional for medical interpretation of health metrics.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
