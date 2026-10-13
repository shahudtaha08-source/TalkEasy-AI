import { Link } from "wouter";
import {
  Activity, Droplets, Smile, Moon,
  AlertTriangle, ArrowRight, BluetoothOff, HeartPulse, Info,
} from "lucide-react";
import { format } from "date-fns";
import { useTranslation } from "@/i18n/LanguageContext";

// ─── Metric Card ─────────────────────────────────────────────────────────────

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  unit?: string;
  color?: string;
  link?: string;
}

function MetricCard({ icon, label, value, unit, color = "text-teal-600", link }: MetricCardProps) {
  const content = (
    <div className={`glass-card p-5 rounded-2xl hover:shadow-md transition-all ${link ? "cursor-pointer hover:-translate-y-0.5" : ""}`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center ${color}`}>
          {icon}
        </div>
      </div>
      <p className="text-sm text-muted-foreground font-medium mb-1">{label}</p>
      <p className="text-2xl font-display font-bold text-slate-900 dark:text-white">
        {value}
        {unit && <span className="text-base font-normal text-muted-foreground ml-1">{unit}</span>}
      </p>
    </div>
  );

  if (link) {
    return <Link href={link}>{content}</Link>;
  }
  return content;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function HealthDashboard() {
  const { t } = useTranslation();
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
          href="/insights/wearable"
          className="flex items-center gap-2 text-sm font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 dark:bg-rose-900/20 px-4 py-2 rounded-xl transition-colors"
        >
          {t("navWearableInsights")} <ArrowRight className="w-4 h-4" />
        </Link>
      </header>

      {/* Wearable: no device connected (honest empty state — no invented readings) */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <h2 className="font-bold text-lg text-slate-900 dark:text-white">Wearable Metrics</h2>
          <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
            <HeartPulse className="w-3 h-3" /> Not connected
          </span>
        </div>
        <div className="border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-8 text-center">
          <BluetoothOff className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <p className="font-bold text-slate-900 dark:text-white">{t("deviceNotConnectedTitle")}</p>
          <p className="text-sm text-muted-foreground mt-1 max-w-lg mx-auto">{t("deviceNotConnectedBody")}</p>
          <Link
            href="/insights/wearable"
            className="inline-flex items-center gap-2 mt-4 text-sm font-semibold text-teal-600 hover:text-teal-700"
          >
            {t("wearableEmptyHint")} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <p className="text-xs text-muted-foreground mt-3 flex items-start gap-1.5">
          <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          TalkEasy only shows device readings that were actually received or imported. Nothing here is invented.
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/insights/wellness"
            className="glass-card p-5 rounded-2xl hover:shadow-md transition-all hover:-translate-y-0.5 group"
          >
            <div className="w-10 h-10 bg-teal-50 dark:bg-teal-900/20 rounded-xl flex items-center justify-center mb-3 group-hover:bg-teal-100 transition">
              <Activity className="w-5 h-5 text-teal-600" />
            </div>
            <p className="font-bold text-slate-900 dark:text-white">{t("navWellnessInsights")}</p>
            <p className="text-xs text-muted-foreground mt-1">Daily, weekly, 30- and 90-day wellness insights</p>
            <p className="text-xs text-teal-600 font-medium mt-3 flex items-center gap-1">View <ArrowRight className="w-3 h-3" /></p>
          </Link>
          <Link
            href="/insights/wearable"
            className="glass-card p-5 rounded-2xl hover:shadow-md transition-all hover:-translate-y-0.5 group"
          >
            <div className="w-10 h-10 bg-rose-50 dark:bg-rose-900/20 rounded-xl flex items-center justify-center mb-3 group-hover:bg-rose-100 transition">
              <HeartPulse className="w-5 h-5 text-rose-600" />
            </div>
            <p className="font-bold text-slate-900 dark:text-white">{t("navWearableInsights")}</p>
            <p className="text-xs text-muted-foreground mt-1">Insights from your connected device data</p>
            <p className="text-xs text-rose-600 font-medium mt-3 flex items-center gap-1">View <ArrowRight className="w-3 h-3" /></p>
          </Link>
          <Link
            href="/trends-30"
            className="glass-card p-5 rounded-2xl hover:shadow-md transition-all hover:-translate-y-0.5 group"
          >
            <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center mb-3 group-hover:bg-blue-100 transition">
              <Activity className="w-5 h-5 text-blue-600" />
            </div>
            <p className="font-bold text-slate-900 dark:text-white">30-Day Trends</p>
            <p className="text-xs text-muted-foreground mt-1">View your wellness patterns over 30 days</p>
            <p className="text-xs text-blue-600 font-medium mt-3 flex items-center gap-1">View trends <ArrowRight className="w-3 h-3" /></p>
          </Link>
          <Link
            href="/reports"
            className="glass-card p-5 rounded-2xl hover:shadow-md transition-all hover:-translate-y-0.5 group"
          >
            <div className="w-10 h-10 bg-purple-50 dark:bg-purple-900/20 rounded-xl flex items-center justify-center mb-3 group-hover:bg-purple-100 transition">
              <Activity className="w-5 h-5 text-purple-600" />
            </div>
            <p className="font-bold text-slate-900 dark:text-white">Wellness Reports</p>
            <p className="text-xs text-muted-foreground mt-1">Generate and download reports</p>
            <p className="text-xs text-purple-600 font-medium mt-3 flex items-center gap-1">View reports <ArrowRight className="w-3 h-3" /></p>
          </Link>
        </div>
      </section>

      {/* Medical Disclaimer */}
      <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
        <strong className="text-slate-700 dark:text-slate-300">Health Data Disclaimer:</strong>{" "}
        TalkEasy displays only data you log or that is actually received from a connected/imported device. It does not
        invent measurements. TalkEasy is a wellness tracking platform, not a medical device or diagnostic tool. Always
        consult a qualified healthcare professional for any health concerns.
      </div>
    </div>
  );
}
