import { ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { Sidebar } from "./Sidebar";
import { useUser } from "@/hooks/use-user";
import { Loader2, Menu } from "lucide-react";
import { useTranslation } from "@/i18n/LanguageContext";
import { TalkEasyLogo } from "./TalkEasyLogo";
import { cn } from "@/lib/utils";

const COLLAPSE_KEY = "talkeasy:sidebar-collapsed";

export function Layout({ children }: { children: ReactNode }) {
  const { isLoading, data: user } = useUser();
  const { isRTL, t } = useTranslation();

  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(COLLAPSE_KEY) === "1";
    } catch {
      return false;
    }
  });
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    try {
      localStorage.setItem(COLLAPSE_KEY, collapsed ? "1" : "0");
    } catch {
      // storage unavailable — collapse preference is best-effort only
    }
  }, [collapsed]);

  const closeMobileNav = useCallback(() => {
    setMobileNavOpen(false);
    // Return focus to the control that opened the drawer.
    requestAnimationFrame(() => menuButtonRef.current?.focus());
  }, []);

  // Age-adaptive UX
  const getAgeGroupSettings = () => {
    const ageGroup = user?.ageGroup || '';
    if (ageGroup.includes('Teen')) {
      return { fontSize: 'text-base' };
    } else if (ageGroup.includes('Young Adult')) {
      return { fontSize: 'text-base' };
    } else if (ageGroup.includes('Senior')) {
      return { fontSize: 'text-lg' };
    }
    // Default for adults
    return { fontSize: 'text-base' };
  };

  const ageSettings = getAgeGroupSettings();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-teal-600" />
      </div>
    );
  }

  const railOffset = collapsed
    ? (isRTL ? "lg:mr-20" : "lg:ml-20")
    : (isRTL ? "lg:mr-64" : "lg:ml-64");

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Sidebar
        mobileOpen={mobileNavOpen}
        onCloseMobile={closeMobileNav}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((prev) => !prev)}
      />

      {/* Mobile top bar */}
      <header className="lg:hidden fixed top-0 inset-x-0 z-30 h-14 flex items-center gap-2 px-3 bg-card/95 backdrop-blur border-b border-border/60">
        <button
          ref={menuButtonRef}
          type="button"
          onClick={() => setMobileNavOpen(true)}
          aria-label={t("openMenu")}
          aria-expanded={mobileNavOpen}
          aria-controls="app-sidebar"
          className="inline-flex items-center justify-center h-10 w-10 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
        >
          <Menu className="w-6 h-6" aria-hidden="true" />
        </button>
        <TalkEasyLogo size={26} />
      </header>

      <main
        className={cn(
          "p-4 pb-10 pt-[4.5rem] sm:px-6 lg:px-8 lg:pb-8 lg:pt-8",
          "h-screen overflow-y-auto overflow-x-hidden transition-[margin] duration-300",
          railOffset,
          ageSettings.fontSize,
        )}
      >
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
