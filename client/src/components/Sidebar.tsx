import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { 
  Home, 
  MessageCircle, 
  Smile, 
  CheckCircle, 
  PieChart, 
  History, 
  Settings, 
  LogOut,
  HeartPulse,
  BookOpen,
  Book,
  Globe,
  Moon,
  Droplet,
  TrendingUp,
  FileText,
  Search,
  X,
  Brain, Target, Compass, Sparkles, Shield, LineChart, Zap, FlaskConical, CalendarClock, BookOpenCheck, Clock
} from "lucide-react";
import { useUser } from "@/hooks/use-user";
import { isDemoMode, disableDemoMode } from "@/lib/demo-data";
import { queryClient } from "@/lib/queryClient";
import { TalkEasyLogo } from "./TalkEasyLogo";
import { GlobalSearch } from "./GlobalSearch";
import { useTranslation } from "@/i18n/LanguageContext";
import { LanguageCode } from "@/i18n/translations";
import {
  isSidebarDisclaimerDismissed,
  setSidebarDisclaimerDismissed,
  SIDEBAR_DISCLAIMER_RESET_EVENT,
} from "@/lib/sidebar-disclaimer";

const LANGUAGES: LanguageCode[] = [
  "English", "Hindi", "Urdu", "Marathi", "Tamil", 
  "Telugu", "Malayalam", "Kannada", "Bengali", "Gujarati"
];

export function Sidebar() {
  const [location] = useLocation();
  const { data: user } = useUser();
  const { t, language, setLanguage, isRTL } = useTranslation();
  const inDemo = isDemoMode();
  const [disclaimerDismissed, setDisclaimerDismissed] = useState(() => isSidebarDisclaimerDismissed());

  // Keep the sidebar in sync when Settings restores the disclaimer.
  useEffect(() => {
    const sync = () => setDisclaimerDismissed(isSidebarDisclaimerDismissed());
    window.addEventListener(SIDEBAR_DISCLAIMER_RESET_EVENT, sync);
    return () => window.removeEventListener(SIDEBAR_DISCLAIMER_RESET_EVENT, sync);
  }, []);

  const dismissDisclaimer = () => {
    setDisclaimerDismissed(true);
    setSidebarDisclaimerDismissed(true);
  };

  const navItems = [
    { href: "/dashboard", label: t("dashboard"), icon: Home },
    { href: "/chat", label: t("supportChat"), icon: MessageCircle },
    { href: "/mood-enhanced", label: t("moodTracker"), icon: Smile },
    { href: "/habits", label: t("habits"), icon: CheckCircle },
    { href: "/sleep", label: t("navSleepTracker"), icon: Moon },
    { href: "/water", label: t("navWaterIntake"), icon: Droplet },
    { href: "/stress", label: t("navStressTracker"), icon: Brain },
    { href: "/trends-30", label: t("navTrends30"), icon: TrendingUp },
    { href: "/trends-90", label: t("navTrends90"), icon: TrendingUp },
    { href: "/reports", label: t("navReports"), icon: FileText },
    { href: "/journal", label: t("journal"), icon: BookOpen },
    { href: "/statistics", label: t("statistics"), icon: PieChart },
    { href: "/history", label: t("emotionalHistory"), icon: History },
    { href: "/resources", label: t("resources"), icon: Book },
    { href: "/goals", label: t("navPersonalGoals"), icon: Target },
    { href: "/wellness-journey", label: t("navWellnessJourney"), icon: Compass },
    { href: "/reflections", label: t("navReflections"), icon: BookOpenCheck },
    { href: "/pattern-explorer", label: t("navPatternExplorer"), icon: Sparkles },
    { href: "/wellness-plan", label: t("navWellnessPlan"), icon: FileText },
    { href: "/safety-plan", label: t("navSafetyPlan"), icon: Shield },
    { href: "/wellness-dna", label: t("navWellnessDna"), icon: LineChart },
    { href: "/then-vs-now", label: t("navThenVsNow"), icon: Clock },
    { href: "/focus-mode", label: t("navFocusMode"), icon: Zap },
    { href: "/why-today", label: t("navWhyToday"), icon: CalendarClock },
    { href: "/life-timeline", label: t("navLifeTimeline"), icon: History },
    { href: "/since-last-checkin", label: t("navSinceLastCheckin"), icon: Clock },
    { href: "/lab", label: t("navLab"), icon: FlaskConical },
    { href: "/help", label: t("findHelp"), icon: HeartPulse },
    { href: "/settings", label: t("settings"), icon: Settings },
  ];

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (e) {
      // fallback
    }
    queryClient.clear();
    window.location.href = "/";
  };

  return (
    <div className={`w-64 h-screen bg-card border-r border-border/50 flex flex-col fixed left-0 top-0 shadow-lg shadow-teal-900/5 z-50 ${isRTL ? 'right-0 left-auto border-r-0 border-l' : ''}`}>
      <GlobalSearch />

      {/* Brand Header */}
      <div className="p-6 flex items-center justify-between">
        <Link href="/dashboard" className="cursor-pointer">
          <TalkEasyLogo size={34} />
        </Link>
      </div>

      {/* Global Search trigger */}
      <div className="px-4 pb-2">
        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent("talkeasy:global-search-toggle"))}
          aria-label={t("searchPlaceholder")}
          title={`${t("search")} (Ctrl + K)`}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm transition-all duration-200 border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
        >
          <Search className="w-5 h-5 text-teal-600 dark:text-teal-400 flex-shrink-0" />
          <span className="flex-1 text-left font-semibold">{t("search")}</span>
          <kbd className="text-[10px] font-semibold px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400">
            Ctrl K
          </kbd>
        </button>
      </div>

      {/* Language Selector Dropdown */}
      <div className="px-4 pb-2">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700">
          <Globe className="w-4 h-4 text-teal-600 flex-shrink-0" />
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as LanguageCode)}
            className="bg-transparent w-full outline-none cursor-pointer font-semibold"
          >
            {LANGUAGES.map((l) => (
              <option key={l} value={l} className="bg-card text-foreground">
                {l}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Navigation Items */}
      <div className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location === item.href || (location.startsWith(item.href) && item.href !== '/dashboard');
          return (
            <Link key={item.href} href={item.href} className={`
              flex items-center justify-between px-3.5 py-2.5 text-sm rounded-xl transition-all duration-200
              ${isActive 
                ? 'bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400 font-semibold' 
                : 'text-muted-foreground hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-foreground'
              }
            `}>
              <div className="flex items-center gap-3">
                <item.icon className={`w-5 h-5 ${isActive ? 'text-teal-600 dark:text-teal-400' : ''}`} />
                <span>{item.label}</span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Disclaimer (informational only — dismissible, never a safety alert) */}
      {!disclaimerDismissed && (
        <div className="px-4 py-2.5 text-[10px] text-muted-foreground leading-tight border-t border-border/50 flex items-start gap-2">
          <span className="flex-1">{t("disclaimerText")}</span>
          <button
            type="button"
            onClick={dismissDisclaimer}
            aria-label={t("dismissDisclaimer")}
            title={t("dismissDisclaimer")}
            className="flex-shrink-0 mt-0.5 p-0.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
          >
            <X className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>
      )}

      {inDemo && (
        <div className="mx-4 mb-2 bg-amber-100 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/50 rounded-xl px-3 py-2 flex items-center gap-2">
          <FlaskConical className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <div className="flex-1 overflow-hidden">
            <p className="text-xs font-bold text-amber-700 dark:text-amber-400">{t("demoMode")}</p>
          </div>
        </div>
      )}

      {/* User Footer & Logout */}
      <div className="p-4 border-t border-border/50">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          {user?.profileImageUrl ? (
            <img src={user.profileImageUrl} alt="Profile" className="w-8 h-8 rounded-full" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-teal-100 dark:bg-teal-900 flex items-center justify-center text-teal-700 dark:text-teal-300 font-bold text-sm">
              {user?.firstName?.[0] || user?.username?.[0] || user?.email?.[0] || (inDemo ? "D" : "U")}
            </div>
          )}
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-medium text-foreground truncate">{user?.firstName || user?.username || (inDemo ? "Demo User" : "User")}</p>
          </div>
        </div>
        {inDemo ? (
          <button
            onClick={() => { disableDemoMode(); queryClient.clear(); window.location.href = "/"; }}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-900/20 transition-colors"
          >
            <FlaskConical className="w-4 h-4" />
            {t("exitDemo")}
          </button>
        ) : (
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            {t("logout")}
          </button>
        )}
      </div>
    </div>
  );
}
