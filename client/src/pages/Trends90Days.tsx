import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from "recharts";
import { Calendar, TrendingUp, TrendingDown, Activity, Droplet, Moon, Footprints, Heart, Activity as HeartPulse, AlertCircle } from "lucide-react";

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

export default function Trends90Days() {
  const [healthRecords, setHealthRecords] = useState<HealthRecord[]>([]);
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([]);
  const [stressEntries, setStressEntries] = useState<StressEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/health-daily-records?limit=90").then(r => r.json()),
      fetch("/api/mood-entries?limit=90").then(r => r.json()),
      fetch("/api/stress-entries?limit=90").then(r => r.json()),
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

  const getMonth = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short" });
  };

  // Group data by month for monthly comparisons
  const groupByMonth = <T extends { date: string }>(data: T[], valueFn: (item: T) => number) => {
    const grouped: Record<string, { sum: number; count: number }> = {};
    data.forEach(item => {
      const month = getMonth(item.date);
      if (!grouped[month]) {
        grouped[month] = { sum: 0, count: 0 };
      }
      grouped[month].sum += valueFn(item);
      grouped[month].count += 1;
    });
    return Object.entries(grouped).map(([month, { sum, count }]) => ({
      month,
      value: Math.round(sum / count),
    }));
  };

  // Prepare heart rate data (daily)
  const heartRateRecords = healthRecords
    .filter((r): r is HealthRecord & { heartRate: number } => typeof r.heartRate === "number");
  const heartRateData = heartRateRecords
    .map(r => ({
      date: formatDate(r.date),
      heartRate: r.heartRate,
    }))
    .reverse();

  // Heart rate by month
  const heartRateByMonth = groupByMonth(heartRateRecords, r => r.heartRate);

  // Prepare SpO2 data
  const spo2Records = healthRecords
    .filter((r): r is HealthRecord & { spo2: number } => typeof r.spo2 === "number");
  const spo2Data = spo2Records
    .map(r => ({
      date: formatDate(r.date),
      spo2: r.spo2,
    }))
    .reverse();

  // SpO2 by month
  const spo2ByMonth = groupByMonth(spo2Records, r => r.spo2);

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

  // Steps by month
  const stepsByMonth = groupByMonth(stepsRecords, r => r.steps);

  // Prepare sleep data
  const sleepRecords = healthRecords
    .filter((r): r is HealthRecord & { sleepHours: number } => typeof r.sleepHours === "number");
  const sleepData = sleepRecords
    .map(r => ({
      date: formatDate(r.date),
      sleep: r.sleepHours,
    }))
    .reverse();

  // Sleep by month
  const sleepByMonth = groupByMonth(sleepRecords, r => r.sleepHours);

  // Prepare water data
  const waterRecords = healthRecords
    .filter((r): r is HealthRecord & { waterMl: number } => typeof r.waterMl === "number");
  const waterData = waterRecords
    .map(r => ({
      date: formatDate(r.date),
      water: r.waterMl,
    }))
    .reverse();

  // Water by month
  const waterByMonth = groupByMonth(waterRecords, r => r.waterMl);

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

  // Calculate overall averages
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
  const negativeMoods = moodEntries.filter(e => ["Sad", "Anxious", "Angry", "Overwhelmed", "Tired"].includes(e.mood)).length;
  const positiveMoods = moodEntries.filter(e => ["Happy", "Calm", "Excited"].includes(e.mood)).length;

  const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#00c49f", "#ff00ff"];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Activity className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading 90-day trends...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">90-Day Wellness Trends</h1>
          <p className="text-gray-600 dark:text-gray-400">Your wellness patterns over the last 3 months</p>
        </div>

        {/* Key Insights */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
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

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Water</CardTitle>
              <Droplet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{avgWater ? `${avgWater}ml` : "N/A"}</div>
              <p className="text-xs text-muted-foreground">Daily average</p>
            </CardContent>
          </Card>
        </div>

        {/* 90-Day Wellness Summary */}
        <Card className="mb-8 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              90-Day Wellness Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Stress Patterns</h4>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Moderate or high stress was recorded on <span className="font-bold">{moderateHighStressCount}</span> of the last 90 tracked days.
                  {moderateHighStressCount > 30 && " This indicates frequent stress. Consider incorporating regular stress management techniques."}
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Hydration Patterns</h4>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Your recorded water intake was below target on <span className="font-bold">{lowWaterDays}</span> tracked days.
                  {lowWaterDays > 30 && " Consistent hydration is important for overall wellness."}
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Mood Distribution</h4>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Positive moods: <span className="font-bold">{positiveMoods}</span> entries. 
                  Challenging moods: <span className="font-bold">{negativeMoods}</span> entries.
                  {positiveMoods > negativeMoods && " Overall positive mood trend detected."}
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Activity Trend</h4>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Average daily steps: <span className="font-bold">{avgSteps ? avgSteps.toLocaleString() : "N/A"}</span>.
                  {avgSteps && avgSteps < 5000 && " Consider increasing daily activity for better wellness."}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Comparisons */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Monthly Comparisons</CardTitle>
            <CardDescription>Average values by month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <h4 className="text-sm font-semibold mb-3">Heart Rate (BPM)</h4>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={heartRateByMonth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div>
                <h4 className="text-sm font-semibold mb-3">SpO2 (%)</h4>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={spo2ByMonth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis domain={[90, 100]} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div>
                <h4 className="text-sm font-semibold mb-3">Steps</h4>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={stepsByMonth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#ffc658" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div>
                <h4 className="text-sm font-semibold mb-3">Sleep (hours)</h4>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={sleepByMonth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#ff7300" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Detailed Trends */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Heart Rate Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Heart Rate Trend (90 Days)</CardTitle>
              <CardDescription>Demo data — wearable device not connected</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={heartRateData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="heartRate" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* SpO2 Trend */}
          <Card>
            <CardHeader>
              <CardTitle>SpO2 Trend (90 Days)</CardTitle>
              <CardDescription>Demo data — wearable device not connected</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={spo2Data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[90, 100]} />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="spo2" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Blood Pressure Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Blood Pressure Trend (90 Days)</CardTitle>
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

          {/* Steps Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Daily Steps (90 Days)</CardTitle>
              <CardDescription>Demo data — wearable device not connected</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={stepsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="steps" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Sleep Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Sleep Duration (90 Days)</CardTitle>
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

          {/* Water Intake Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Water Intake (90 Days)</CardTitle>
              <CardDescription>Daily water consumption (ml)</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={waterData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="water" stroke="#00c49f" fill="#00c49f" fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Mood Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Mood Distribution (90 Days)</CardTitle>
              <CardDescription>Mood entries distribution</CardDescription>
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
              <CardTitle>Stress Level Distribution (90 Days)</CardTitle>
              <CardDescription>Stress entries distribution</CardDescription>
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

        {/* Recurring Patterns Alert */}
        {moderateHighStressCount > 45 && (
          <Card className="mb-8 border-red-200 dark:border-red-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
                <AlertCircle className="h-5 w-5" />
                Recurring Pattern Detected
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                You have recorded moderate or high stress on more than half of the tracked days in the last 90 days. 
                This may indicate a recurring stress pattern. Consider:
              </p>
              <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-300 mt-2 space-y-1">
                <li>Regular mindfulness or meditation practice</li>
                <li>Establishing a consistent sleep schedule</li>
                <li>Regular physical activity</li>
                <li>Speaking with a mental health professional</li>
              </ul>
            </CardContent>
          </Card>
        )}

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
