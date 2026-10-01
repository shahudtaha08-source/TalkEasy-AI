import { useMemo } from "react";
import { Link } from "wouter";
import {
  Heart, Activity, Droplets, Wind, Footprints, Moon, Smile,
  Zap, AlertTriangle, ArrowRight, FlaskConical, Info,
  Bluetooth, BluetoothOff
} from "lucide-react";
import { format } from "date-fns";

// ─── Demo Data Generator ──────────────────────────────────────────────────────
// All metrics are clearly demo/simulated. No real wearable is connected in v6.0.

function getDemoMetrics() {
  const seed = new Date().getDate() + new Date().getMonth();
  const rand = (base: number, range: number) => base + ((seed * 7) % range) - Math.floor(range / 2);
  return {
    heartRate:   rand(76, 12),   // bpm
    spo2:        rand(98, 2),    // %
    systolicBp:  rand(118, 10),  // mmHg
    diastolicBp: rand(76, 8),    // mmHg
    steps:       rand(6800, 2000),
    ecgStatus:   "Demo Record",
  };
}

// ─── Metric Card ─────────────────────────────────────────────────────────────

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  unit?: string;
  isDemo?: boolean;
  color?: string;
  link?: string;
}

function MetricCard({ icon, label, value, unit, isDemo = false, color = "text-teal-600", link }: MetricCardProps) {
  const content = (
    <div className={`glass-card p-5 rounded-2xl hover:shadow-md transition-all ${link ? "cursor-pointer hover:-translate-y-0.5" : ""}`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center ${color}`}>
          {icon}
        </div>
        {isDemo && (
          <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 px-2 py-0.5 rounded-full">
            <FlaskConical className="w-2.5 h-2.5" /> DEMO
          </span>
        )}
      </div>
      <p className="text-sm text-muted-foreground font-medium mb-1">{label}</p>
      <p className="text-2xl font-display font-bold text-slate-900 dark:text-white">
        {value}
        {unit && <span className="text-base font-normal text-muted-foreground ml-1">{unit}</span>}
      </p>
      {isDemo && (
        <p className="text-[10px] text-amber-600 dark:text-amber-500 mt-1.5">
          Simulated — wearable not connected
        </p>
      )}
    </div>
  );

  if (link) {
    return <Link href={link}>{content}</Link>;
  }
  return content;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function HealthDashboard() {
  const demo = useMemo(() => getDemoMetrics(), []);
  const today = format(new Date(), "EEEE, MMMM d");

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-4xl font-display font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <Activity className="w-8 h-8 text-teal-600" /> Health Overview
          </h1>
          <p className="text-muted-foreground mt-1">{today}</p>
        </div>
        <Link
          href="/trends-30"
          className="flex items-center gap-2 text-sm font-semibold text-teal-600 hover:text-teal-700 bg-teal-50 dark:bg-teal-900/20 px-4 py-2 rounded-xl transition-colors"
        >
          View 30-Day Trends <ArrowRight className="w-4 h-4" />
        </Link>
      </header>

      {/* Wearable Disclaimer Banner */}
      <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-2xl p-4 flex items-start gap-3">
        <div className="flex items-center gap-2 flex-shrink-0 mt-0.5">
          <BluetoothOff className="w-5 h-5 text-amber-600" />
        </div>
        <div>
          <p className="text-sm font-bold text-amber-700 dark:text-amber-400">Wearable device not connected</p>
          <p className="text-xs text-amber-600 dark:text-amber-500 mt-0.5 leading-relaxed">
            Heart rate, SpO₂, blood pressure, ECG and step data are demo/simulated values for display purposes.
            They do not represent real medical measurements. Wearable integration is planned for a future TalkEasy release.
          </p>
        </div>
      </div>

      {/* Demo Wearable Metrics */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <h2 className="font-bold text-lg text-slate-900 dark:text-white">Wearable Metrics</h2>
          <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
            <FlaskConical className="w-3 h-3" /> Demo Data
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <MetricCard
            icon={<Heart className="w-5 h-5" />}
            label="Heart Rate"
            value={demo.heartRate}
            unit="BPM"
            isDemo
            color="text-rose-500"
          />
          <MetricCard
            icon={<Wind className="w-5 h-5" />}
            label="SpO₂"
            value={`${demo.spo2}%`}
            isDemo
            color="text-blue-500"
          />
          <MetricCard
            icon={<Activity className="w-5 h-5" />}
            label="Blood Pressure"
            value={`${demo.systolicBp}/${demo.diastolicBp}`}
            unit="mmHg"
            isDemo
            color="text-purple-500"
          />
          <MetricCard
            icon={<Zap className="w-5 h-5" />}
            label="ECG"
            value="Demo Record"
            isDemo
            color="text-green-500"
          />
          <MetricCard
            icon={<Footprints className="w-5 h-5" />}
            label="Steps Today"
            value={demo.steps.toLocaleString()}
            isDemo
            color="text-orange-500"
          />
        </div>
        <p className="text-xs text-muted-foreground mt-3 flex items-start gap-1.5">
          <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          Demo values are not real medical measurements. Always consult a qualified healthcare professional for medical interpretation.
        </p>
      </section>

      {/* User-Logged Metrics */}
      <section>
        <h2 className="font-bold text-lg text-slate-900 dark:text-white mb-4">Your Wellness Today</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <MetricCard
            icon={<Moon className="w-5 h-5" />}
            label="Sleep"
            value="Log sleep"
            color="text-indigo-500"
            link="/sleep"
          />
          <MetricCard
            icon={<Droplets className="w-5 h-5" />}
            label="Water Intake"
            value="Log water"
            color="text-sky-500"
            link="/water"
          />
          <MetricCard
            icon={<Smile className="w-5 h-5" />}
            label="Mood"
            value="Log mood"
            color="text-emerald-500"
            link="/mood"
          />
          <MetricCard
            icon={<AlertTriangle className="w-5 h-5" />}
            label="Stress"
            value="Log stress"
            color="text-yellow-500"
            link="/stress"
          />
        </div>
      </section>

      {/* Quick Access */}
      <section>
        <h2 className="font-bold text-lg text-slate-900 dark:text-white mb-4">Insights & Reports</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            href="/trends-30"
            className="glass-card p-5 rounded-2xl hover:shadow-md transition-all hover:-translate-y-0.5 group"
          >
            <div className="w-10 h-10 bg-teal-50 dark:bg-teal-900/20 rounded-xl flex items-center justify-center mb-3 group-hover:bg-teal-100 transition">
              <Activity className="w-5 h-5 text-teal-600" />
            </div>
            <p className="font-bold text-slate-900 dark:text-white">30-Day Trends</p>
            <p className="text-xs text-muted-foreground mt-1">View your wellness patterns over 30 days</p>
            <p className="text-xs text-teal-600 font-medium mt-3 flex items-center gap-1">View trends <ArrowRight className="w-3 h-3" /></p>
          </Link>
          <Link
            href="/trends-90"
            className="glass-card p-5 rounded-2xl hover:shadow-md transition-all hover:-translate-y-0.5 group"
          >
            <div className="w-10 h-10 bg-purple-50 dark:bg-purple-900/20 rounded-xl flex items-center justify-center mb-3 group-hover:bg-purple-100 transition">
              <Activity className="w-5 h-5 text-purple-600" />
            </div>
            <p className="font-bold text-slate-900 dark:text-white">90-Day Trends</p>
            <p className="text-xs text-muted-foreground mt-1">3-month wellness overview and patterns</p>
            <p className="text-xs text-purple-600 font-medium mt-3 flex items-center gap-1">View trends <ArrowRight className="w-3 h-3" /></p>
          </Link>
          <Link
            href="/reports"
            className="glass-card p-5 rounded-2xl hover:shadow-md transition-all hover:-translate-y-0.5 group"
          >
            <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center mb-3 group-hover:bg-blue-100 transition">
              <Activity className="w-5 h-5 text-blue-600" />
            </div>
            <p className="font-bold text-slate-900 dark:text-white">Wellness Reports</p>
            <p className="text-xs text-muted-foreground mt-1">Generate and download PDF reports</p>
            <p className="text-xs text-blue-600 font-medium mt-3 flex items-center gap-1">View reports <ArrowRight className="w-3 h-3" /></p>
          </Link>
        </div>
      </section>

      {/* Medical Disclaimer */}
      <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
        <strong className="text-slate-700 dark:text-slate-300">Health Data Disclaimer:</strong>{" "}
        All wearable metric values shown on this page are demo/simulated data for demonstration purposes only.
        They do not represent real sensor readings and must not be interpreted as medical measurements or used for
        medical decisions. TalkEasy is a wellness tracking platform, not a medical device or diagnostic tool.
        Always consult a qualified healthcare professional for any health concerns.
      </div>
    </div>
  );
}
