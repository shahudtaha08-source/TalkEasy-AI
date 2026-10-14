import { useCallback, useEffect, useRef, useState } from "react";
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
  Brain,
  Target,
  Compass,
  Sparkles,
  Shield,
  LineChart,
  Zap,
  FlaskConical,
  CalendarClock,
  BookOpenCheck,
  Clock,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { useUser } from "@/hooks/use-user";
import { isDemoMode, disableDemoMode } from "@/lib/demo-data";
import { queryClient } from "@/lib/queryClient";
import { TalkEasyLogo } from "./TalkEasyLogo";
import { GlobalSearch } from "./GlobalSearch";
import { useTranslation } from "@/i18n/LanguageContext";
import { LanguageCode } from "@/i18n/translations";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  isSidebarDisclaimerDismissed,
  setSidebarDisclaimerDismissed,
  SIDEBAR_DISCLAIMER_RESET_EVENT,
} from "@/lib/sidebar-disclaimer";

const LANGUAGES: LanguageCode[] = [
  "English", "Hindi", "Urdu", "Marathi", "Tamil", 
  "Telugu", "Malayalam", "Kannada", "Bengali", "Gujarati"
];

interface SidebarProps {
  /** Mobile only: whether the slide-in drawer is open. */
  mobileOpen?: boolean;
  /** Mobile only: close the drawer (backdrop, close button, Escape, navigation). */
  onCloseMobile?: () => void;
  /** Desktop only: whether the rail is collapsed to icon-only width. */
  collapsed?: boolean;
  /** Desktop only: toggle the collapsed rail. */
  onToggleCollapse?: () => void;
}

export function Sidebar({
  mobileOpen = false,
  onCloseMobile,
  collapsed = false,
  onToggleCollapse,
}: SidebarProps) {
  const [location] = useLocation();
  const { data: user } = useUser();
  const { t, language, setLanguage, isRTL } = useTranslation();
  const isMobile = useIsMobile();
  const inDemo = isDemoMode();
  const [disclaimerDismissed, setDisclaimerDismissed] = useState(() => isSidebarDisclaimerDismissed());
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Keep the sidebar in sync when Settings restores the disclaimer.
  useEffect(() => {
    const sync = () => setDisclaimerDismissed(isSidebarDisclaimerDismissed());
    window.addEventListener(SIDEBAR_DISCLAIMER_RESET_EVENT, sync);
    return () => window.removeEventListener(SIDEBAR_DISCLAIMER_RESET_EVENT, sync);
  }, []);

  // Close the mobile drawer on Escape and move focus into it when it opens.
  useEffect(() => {
    if (!mobileOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCloseMobile?.();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    const focusTimer = window.setTimeout(() => closeButtonRef.current?.focus(), 60);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.clearTimeout(focusTimer);
    };
  }, [mobileOpen, onCloseMobile]);

  const dismissDisclaimer = () => {
    setDisclaimerDismissed(true);
    setSidebarDisclaimerDismissed(true);
  };

  // Any navigation closes the mobile drawer.
  const handleNavigate = useCallback(() => {
    if (mobileOpen) onCloseMobile?.();
  }, [mobileOpen, onCloseMobile]);

  const navItems = [
    { href: "/dashboard", label: t("dashboard"), icon: Home },
    { href: "/chat", label: t("supportChat"), icon: MessageCircle },
    { href: "/mood-enhanced", label: t("moodTracker"), icon: Smile },
    { href: "/habits", label: t("habits"), icon: CheckCircle },
    { href: "/sleep", label: t("navSleepTracker"), icon: Moon },
    { href: "/water", label: t("navWaterIntake"), icon: Droplet },
    { href: "/stress", label: t("navStressTracker"), icon: Brain },
    { href: "/insights/wellness", label: t("navWellnessInsights"), icon: Brain },
    { href: "/insights/wearable", label: t("navWearableInsights"), icon: HeartPulse },
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

  // A closed mobile drawer must not be reachable by keyboard/screen readers.
  const hiddenOnMobile = isMobile && !mobileOpen;
  const inertProps: any = hiddenOnMobile ? { inert: "" } : {};
  const CollapseIcon = collapsed
    ? (isRTL ? ChevronsLeft : ChevronsRight)
    : (isRTL ? ChevronsRight : ChevronsLeft);
  const tooltipSide = isRTL ? "left" : "right";

  return (
    <>
      {/* Backdrop (mobile only) */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside
        id="app-sidebar"
        aria-label={t("primaryNavigation")}
        role={isMobile && mobileOpen ? "dialog" : undefined}
        aria-modal={isMobile && mobileOpen ? true : undefined}
        aria-hidden={hiddenOnMobile || undefined}
        {...inertProps}
        className={cn(
          "fixed top-0 z-50 h-screen w-64 bg-card border-border flex flex-col shadow-lg shadow-teal-900/5",
          "transition-[transform,width,visibility] duration-300 ease-out",
          isRTL ? "right-0 border-l" : "left-0 border-r",
          collapsed ? "lg:w-20" : "lg:w-64",
          mobileOpen
            ? "visible translate-x-0"
            : cn("invisible pointer-events-none", isRTL ? "translate-x-full" : "-translate-x-full"),
          "lg:visible lg:pointer-events-auto lg:translate-x-0",
        )}
      >
        <GlobalSearch />

        {/* Brand Header */}
        <div
          className={cn(
            "p-4 lg:p-6 flex items-center justify-between gap-2",
            collapsed && "lg:justify-center lg:px-3",
          )}
        >
          <Link href="/dashboard" onClick={handleNavigate} className="cursor-pointer flex items-center min-w-0">
            {/* Full lockup — always on mobile, hidden on a collapsed desktop rail */}
            <TalkEasyLogo size={34} className={cn(collapsed && "lg:hidden")} />
            {/* Icon-only mark — only on a collapsed desktop rail */}
            <TalkEasyLogo size={34} showText={false} className={cn("hidden", collapsed && "lg:inline-flex")} />
          </Link>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onCloseMobile}
            aria-label={t("closeMenu")}
            className="lg:hidden inline-flex items-center justify-center h-9 w-9 -mr-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Global Search trigger */}
        <div className="px-4 pb-2">
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent("talkeasy:global-search-toggle"))}
            aria-label={t("searchPlaceholder")}
            title={`${t("search")} (Ctrl + K)`}
            className={cn(
              "w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm transition-all duration-200 border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500",
              collapsed && "lg:justify-center lg:px-2",
            )}
          >
            <Search className="w-5 h-5 text-teal-600 dark:text-teal-400 flex-shrink-0" />
            <span className={cn("flex-1 text-left font-semibold", collapsed && "lg:hidden")}>{t("search")}</span>
            <kbd className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400", collapsed && "lg:hidden")}>
              Ctrl K
            </kbd>
          </button>
        </div>

        {/* Language Selector Dropdown */}
        <div className={cn("px-4 pb-2", collapsed && "lg:hidden")}>
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

        {/* Desktop collapse control */}
        <div className="px-4 pb-2 hidden lg:block">
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={collapsed ? t("expandSidebar") : t("collapseSidebar")}
            aria-expanded={!collapsed}
            aria-controls="app-sidebar"
            className={cn(
              "w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500",
              collapsed && "justify-center px-2",
            )}
          >
            <CollapseIcon className="w-5 h-5 flex-shrink-0 text-teal-600 dark:text-teal-400" aria-hidden="true" />
            <span className={cn(collapsed && "hidden")}>{t("collapseSidebar")}</span>
          </button>
        </div>

        {/* Navigation Items */}
        <nav aria-label={t("primaryNavigation")} className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location === item.href || (location.startsWith(item.href) && item.href !== '/dashboard');
            const link = (
              <Link
                href={item.href}
                onClick={handleNavigate}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 px-3.5 py-2.5 text-sm rounded-xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500",
                  collapsed && "lg:justify-center lg:px-2",
                  isActive
                    ? 'bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400 font-semibold'
                    : 'text-muted-foreground hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-foreground'
                )}
              >
                <item.icon className={cn("w-5 h-5 flex-shrink-0", isActive && 'text-teal-600 dark:text-teal-400')} aria-hidden="true" />
                <span className={cn("truncate", collapsed && "lg:hidden")}>{item.label}</span>
              </Link>
            );

            if (collapsed && !isMobile) {
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>{link}</TooltipTrigger>
                  <TooltipContent side={tooltipSide}>{item.label}</TooltipContent>
                </Tooltip>
              );
            }
            return <div key={item.href}>{link}</div>;
          })}
        </nav>

        {/* Disclaimer (informational only — dismissible, never a safety alert) */}
        {!disclaimerDismissed && (
          <div className={cn("px-4 py-2.5 text-[10px] text-muted-foreground leading-tight border-t border-border/50 flex items-start gap-2", collapsed && "lg:hidden")}>
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
          <div className={cn("mx-4 mb-2 bg-amber-100 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/50 rounded-xl px-3 py-2 flex items-center gap-2", collapsed && "lg:justify-center lg:px-2")}>
            <FlaskConical className="w-4 h-4 text-amber-600 flex-shrink-0" aria-hidden="true" />
            <div className={cn("flex-1 overflow-hidden", collapsed && "lg:hidden")}>
              <p className="text-xs font-bold text-amber-700 dark:text-amber-400">{t("demoMode")}</p>
            </div>
          </div>
        )}

        {/* User Footer & Logout */}
        <div className="p-4 border-t border-border/50">
          <div className={cn("flex items-center gap-3 px-3 py-2 mb-2", collapsed && "lg:justify-center lg:px-0")}>
            {user?.profileImageUrl ? (
              <img src={user.profileImageUrl} alt="Profile" className="w-8 h-8 rounded-full flex-shrink-0" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-teal-100 dark:bg-teal-900 flex items-center justify-center text-teal-700 dark:text-teal-300 font-bold text-sm flex-shrink-0">
                {user?.firstName?.[0] || user?.username?.[0] || user?.email?.[0] || (inDemo ? "D" : "U")}
              </div>
            )}
            <div className={cn("flex-1 overflow-hidden", collapsed && "lg:hidden")}>
              <p className="text-sm font-medium text-foreground truncate">{user?.firstName || user?.username || (inDemo ? "Demo User" : "User")}</p>
            </div>
          </div>
          {inDemo ? (
            <button
              onClick={() => { disableDemoMode(); queryClient.clear(); window.location.href = "/"; }}
              className={cn("w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-900/20 transition-colors", collapsed && "lg:justify-center lg:px-2")}
            >
              <FlaskConical className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
              <span className={cn(collapsed && "lg:hidden")}>{t("exitDemo")}</span>
            </button>
          ) : (
            <button
              onClick={handleLogout}
              className={cn("w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-colors", collapsed && "lg:justify-center lg:px-2")}
            >
              <LogOut className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
              <span className={cn(collapsed && "lg:hidden")}>{t("logout")}</span>
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
