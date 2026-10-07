import type { LucideIcon } from "lucide-react";
import {
  Home,
  MessageCircle,
  Smile,
  CheckCircle,
  PieChart,
  History,
  Settings,
  HeartPulse,
  BookOpen,
  Book,
  Moon,
  Droplet,
  TrendingUp,
  FileText,
  Brain,
  Target,
  Compass,
  Sparkles,
  Shield,
  LineChart,
  FlaskConical,
  CalendarClock,
  BookOpenCheck,
  Clock,
} from "lucide-react";
import type { Translations } from "@/i18n/translations";

export type SearchCategory =
  | "support"
  | "wellness"
  | "growth"
  | "insights"
  | "safety"
  | "app";

export interface FeatureEntry {
  /** Stable identifier (also used as the command-palette value). */
  id: string;
  /** Existing application route — never a duplicated/fabricated page. */
  route: string;
  /** i18n key for the feature name. */
  titleKey: keyof Translations;
  /** i18n key for the short description. */
  descKey: keyof Translations;
  /** i18n key of the category this feature belongs to. */
  category: SearchCategory;
  /** Extra (non-sensitive) English keywords to widen matching. */
  keywords: string[];
  icon: LucideIcon;
}

export const SEARCH_CATEGORY_LABELS: Record<SearchCategory, keyof Translations> = {
  support: "groupSupportReflection",
  wellness: "groupDailyWellness",
  growth: "groupPersonalGrowth",
  insights: "groupInsights",
  safety: "groupSupportSafety",
  app: "searchCategoryApp",
};

export const SEARCH_CATEGORY_ORDER: SearchCategory[] = [
  "support",
  "wellness",
  "growth",
  "insights",
  "safety",
  "app",
];

/**
 * Central searchable registry of TalkEasy features/pages.
 * Client-side only — no API calls, no private records, no database scans.
 */
export const FEATURE_REGISTRY: FeatureEntry[] = [
  {
    id: "dashboard",
    route: "/dashboard",
    titleKey: "dashboard",
    descKey: "descDashboard",
    category: "app",
    keywords: ["overview", "home", "summary", "main", "today"],
    icon: Home,
  },
  {
    id: "support-chat",
    route: "/chat",
    titleKey: "supportChat",
    descKey: "descSupportChat",
    category: "support",
    keywords: ["chat", "talk", "conversation", "ai", "assistant", "support"],
    icon: MessageCircle,
  },
  {
    id: "mood",
    route: "/mood-enhanced",
    titleKey: "moodTracker",
    descKey: "descMood",
    category: "wellness",
    keywords: ["mood", "emotion", "feeling", "check in", "happy", "sad"],
    icon: Smile,
  },
  {
    id: "stress",
    route: "/stress",
    titleKey: "navStressTracker",
    descKey: "descStress",
    category: "wellness",
    keywords: ["stress", "pressure", "tension", "calm", "relax"],
    icon: Brain,
  },
  {
    id: "sleep",
    route: "/sleep",
    titleKey: "navSleepTracker",
    descKey: "descSleep",
    category: "wellness",
    keywords: ["sleep", "rest", "night", "nap", "tired", "insomnia"],
    icon: Moon,
  },
  {
    id: "water",
    route: "/water",
    titleKey: "navWaterIntake",
    descKey: "descWater",
    category: "wellness",
    keywords: ["water", "hydration", "drink", "ml", "bottle"],
    icon: Droplet,
  },
  {
    id: "habits",
    route: "/habits",
    titleKey: "habits",
    descKey: "descHabits",
    category: "wellness",
    keywords: ["habit", "routine", "streak", "daily", "consistency"],
    icon: CheckCircle,
  },
  {
    id: "goals",
    route: "/goals",
    titleKey: "navPersonalGoals",
    descKey: "descGoals",
    category: "growth",
    keywords: ["goal", "target", "aim", "objective", "suggested"],
    icon: Target,
  },
  {
    id: "wellness-journey",
    route: "/wellness-journey",
    titleKey: "navWellnessJourney",
    descKey: "descWellnessJourney",
    category: "growth",
    keywords: ["journey", "milestone", "progress", "history"],
    icon: Compass,
  },
  {
    id: "wellness-plan",
    route: "/wellness-plan",
    titleKey: "navWellnessPlan",
    descKey: "descWellnessPlan",
    category: "growth",
    keywords: ["plan", "wellness plan", "personal plan", "routine"],
    icon: FileText,
  },
  {
    id: "journal",
    route: "/journal",
    titleKey: "journal",
    descKey: "descJournal",
    category: "support",
    keywords: ["journal", "diary", "write", "entry", "gratitude"],
    icon: BookOpen,
  },
  {
    id: "reflections",
    route: "/reflections",
    titleKey: "navReflections",
    descKey: "descReflections",
    category: "support",
    keywords: ["reflection", "prompt", "think", "review"],
    icon: BookOpenCheck,
  },
  {
    id: "statistics",
    route: "/statistics",
    titleKey: "statistics",
    descKey: "descStatistics",
    category: "insights",
    keywords: ["statistics", "stats", "charts", "numbers", "average"],
    icon: PieChart,
  },
  {
    id: "trends-30",
    route: "/trends-30",
    titleKey: "navTrends30",
    descKey: "descTrends30",
    category: "insights",
    keywords: ["trends", "30 days", "month", "graph", "sleep trends"],
    icon: TrendingUp,
  },
  {
    id: "trends-90",
    route: "/trends-90",
    titleKey: "navTrends90",
    descKey: "descTrends90",
    category: "insights",
    keywords: ["trends", "90 days", "quarter", "long term", "graph"],
    icon: TrendingUp,
  },
  {
    id: "pattern-explorer",
    route: "/pattern-explorer",
    titleKey: "navPatternExplorer",
    descKey: "descPatternExplorer",
    category: "insights",
    keywords: ["pattern", "explore", "insight", "correlation", "ml"],
    icon: Sparkles,
  },
  {
    id: "wellness-dna",
    route: "/wellness-dna",
    titleKey: "navWellnessDna",
    descKey: "descWellnessDna",
    category: "insights",
    keywords: ["dna", "traits", "profile", "behaviour", "signature"],
    icon: LineChart,
  },
  {
    id: "then-vs-now",
    route: "/then-vs-now",
    titleKey: "navThenVsNow",
    descKey: "descThenVsNow",
    category: "insights",
    keywords: ["compare", "then", "now", "before", "after"],
    icon: Clock,
  },
  {
    id: "why-today",
    route: "/why-today",
    titleKey: "navWhyToday",
    descKey: "descWhyToday",
    category: "insights",
    keywords: ["why today", "prompt", "reason", "check in"],
    icon: CalendarClock,
  },
  {
    id: "since-last-checkin",
    route: "/since-last-checkin",
    titleKey: "navSinceLastCheckin",
    descKey: "descSinceCheckin",
    category: "insights",
    keywords: ["since", "last check in", "gap", "summary"],
    icon: Clock,
  },
  {
    id: "life-timeline",
    route: "/life-timeline",
    titleKey: "navLifeTimeline",
    descKey: "descLifeTimeline",
    category: "insights",
    keywords: ["timeline", "life", "chronological", "events"],
    icon: History,
  },
  {
    id: "lab",
    route: "/lab",
    titleKey: "navLab",
    descKey: "descLab",
    category: "insights",
    keywords: ["lab", "experiment", "trial", "micro experiment"],
    icon: FlaskConical,
  },
  {
    id: "reports",
    route: "/reports",
    titleKey: "navReports",
    descKey: "descReports",
    category: "insights",
    keywords: ["report", "summary", "export", "30 day", "90 day"],
    icon: FileText,
  },
  {
    id: "resources",
    route: "/resources",
    titleKey: "resources",
    descKey: "descResources",
    category: "safety",
    keywords: ["resources", "articles", "guides", "reading", "help"],
    icon: Book,
  },
  {
    id: "find-help",
    route: "/help",
    titleKey: "findHelp",
    descKey: "descFindHelp",
    category: "safety",
    keywords: ["help", "helpline", "counsellor", "therapist", "emergency", "support"],
    icon: HeartPulse,
  },
  {
    id: "safety-plan",
    route: "/safety-plan",
    titleKey: "navSafetyPlan",
    descKey: "descSafetyPlan",
    category: "safety",
    keywords: ["safety plan", "crisis", "coping", "grounding", "contacts"],
    icon: Shield,
  },
  {
    id: "settings",
    route: "/settings",
    titleKey: "settings",
    descKey: "descSettings",
    category: "app",
    keywords: ["settings", "preferences", "language", "profile", "account", "version"],
    icon: Settings,
  },
];
