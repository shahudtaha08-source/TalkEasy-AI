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
  FlaskConical,
  Globe
} from "lucide-react";
import { useUser } from "@/hooks/use-user";
import { isDemoMode, disableDemoMode } from "@/lib/demo-data";
import { queryClient } from "@/lib/queryClient";
import { TalkEasyLogo } from "./TalkEasyLogo";
import { useTranslation } from "@/i18n/LanguageContext";
import { LanguageCode } from "@/i18n/translations";

const LANGUAGES: LanguageCode[] = [
  "English", "Hindi", "Urdu", "Marathi", "Tamil", 
  "Telugu", "Malayalam", "Kannada", "Bengali", "Gujarati"
];

export function Sidebar() {
  const [location] = useLocation();
  const { data: user } = useUser();
  const { t, language, setLanguage, isRTL } = useTranslation();
  const inDemo = isDemoMode();

  const isSenior = user?.ageGroup?.includes("Senior");

  const navItems = [
    { href: "/dashboard", label: t("dashboard"), icon: Home },
    { href: "/chat", label: t("supportChat"), icon: MessageCircle },
    { href: "/journal", label: t("journal"), icon: BookOpen },
    { href: "/mood", label: t("moodTracker"), icon: Smile },
    { href: "/habits", label: t("habits"), icon: CheckCircle },
    { href: "/statistics", label: t("statistics"), icon: PieChart },
    { href: "/history", label: t("emotionalHistory"), icon: History },
    { href: "/resources", label: t("resources"), icon: Book },
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
      {/* Brand Header */}
      <div className="p-6 flex items-center justify-between">
        <Link href="/dashboard" className="cursor-pointer">
          <TalkEasyLogo size={34} />
        </Link>
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
              flex items-center justify-between px-3.5 ${isSenior ? 'py-3.5 text-base' : 'py-2.5 text-sm'} rounded-xl transition-all duration-200
              ${isActive 
                ? 'bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400 font-semibold' 
                : 'text-muted-foreground hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-foreground'
              }
            `}>
              <div className="flex items-center gap-3">
                <item.icon className={`w-5 h-5 ${isActive ? 'text-teal-600 dark:text-teal-400' : ''}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Disclaimer */}
      <div className="px-4 py-2.5 text-[10px] text-muted-foreground leading-tight border-t border-border/50">
        {t("disclaimerText")}
      </div>

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
