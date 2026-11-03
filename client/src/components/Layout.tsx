import { ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { Sidebar } from "./Sidebar";
import { useUser } from "@/hooks/use-user";
import { useIsDrawer } from "@/hooks/use-mobile";
import { Loader2, Menu } from "lucide-react";
import { useTranslation } from "@/i18n/LanguageContext";
import { TalkEasyLogo } from "./TalkEasyLogo";
import { cn } from "@/lib/utils";
import { ReleaseNotes } from "@/components/ReleaseNotes";

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
  const mainRef = useRef<HTMLElement>(null);
  const isDrawer = useIsDrawer();
  const drawerOpen = mobileNavOpen && isDrawer;
  const backgroundInertProps: any = drawerOpen ? { inert: "" } : {};

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

  // If the viewport grows into the desktop range while the drawer is open,
  // drop the modal state so the sidebar becomes an ordinary landmark again.
  useEffect(() => {
    if (!isDrawer && mobileNavOpen) {
      setMobileNavOpen(false);
      requestAnimationFrame(() => mainRef.current?.focus());
    }
  }, [isDrawer, mobileNavOpen]);

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
    <div className="h-app-viewport flex flex-col overflow-hidden bg-background text-foreground">
      <Sidebar
        mobileOpen={mobileNavOpen}
        onCloseMobile={closeMobileNav}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((prev) => !prev)}
      />

      {/* Mobile top bar */}
      <header
        {...backgroundInertProps}
        aria-hidden={drawerOpen ? true : undefined}
        className="app-mobile-header lg:hidden fixed inset-x-0 top-0 z-30 flex h-14 items-center gap-2 border-b border-border/60 bg-card/95 px-3 backdrop-blur"
      >
        <button
          ref={menuButtonRef}
          type="button"
          onClick={() => setMobileNavOpen(true)}
          aria-label={t("openMenu")}
          aria-expanded={mobileNavOpen}
          aria-controls="app-sidebar"
          className="inline-flex items-center justify-center h-11 w-11 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
        >
          <Menu className="w-6 h-6" aria-hidden="true" />
        </button>
        <TalkEasyLogo size={26} />
      </header>

      <main
        ref={mainRef}
        tabIndex={-1}
        {...backgroundInertProps}
        aria-hidden={drawerOpen ? true : undefined}
        className={cn(
          "app-main-safe-top px-4 pb-10 sm:px-6 lg:px-8 lg:pb-8 lg:pt-8",
          "flex-1 min-h-0 overflow-y-auto overflow-x-hidden transition-[margin] duration-300",
          railOffset,
          ageSettings.fontSize,
        )}
      >
        <div className="mx-auto flex min-h-full w-full max-w-6xl flex-col">
          {children}
        </div>
      </main>
      <div {...backgroundInertProps} aria-hidden={drawerOpen ? true : undefined}>
        <ReleaseNotes />
      </div>
    </div>
  );
}
