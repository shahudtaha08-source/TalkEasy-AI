import * as React from "react";
import { Settings, Eye, EyeOff, ArrowUp, ArrowDown, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUserPreferences, useUpdateUserPreferences } from "@/hooks/use-user-preferences";
import { useUser } from "@/hooks/use-user";
import {
  SIDEBAR_ITEM_IDS,
  ESSENTIAL_SIDEBAR_ITEMS,
  SIDEBAR_CATEGORIES,
  DEFAULT_SIDEBAR_CONFIG,
  parseSidebarConfig,
  serializeSidebarConfig,
  toggleSidebarItemVisibility,
  moveSidebarItem,
  canMoveSidebarItem,
  isSidebarItemVisible,
  resetSidebarConfig,
  type SidebarItemId,
  type SidebarConfig,
} from "@shared/sidebar-config";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import * as PopoverPrimitive from "@radix-ui/react-popover";

const ITEM_LABELS: Record<SidebarItemId, string> = {
  "/dashboard": "Dashboard",
  "/chat": "Support Chat",
  "/mood-enhanced": "Mood Tracker",
  "/habits": "Habits",
  "/sleep": "Sleep Tracker",
  "/water": "Water Intake",
  "/stress": "Stress Tracker",
  "/exercise": "Exercise",
  "/insights/wellness": "Wellness Insights",
  "/insights/wearable": "Wearable Insights",
  "/trends-30": "Trends (30 days)",
  "/trends-90": "Trends (90 days)",
  "/reports": "Reports",
  "/journal": "Journal",
  "/statistics": "Statistics",
  "/history": "Emotional History",
  "/resources": "Resources",
  "/goals": "Personal Goals",
  "/wellness-journey": "Wellness Journey",
  "/reflections": "Reflections",
  "/pattern-explorer": "Pattern Explorer",
  "/wellness-plan": "Wellness Plan",
  "/safety-plan": "Safety Plan",
  "/wellness-dna": "Wellness DNA",
  "/then-vs-now": "Then vs Now",
  "/why-today": "Why Today",
  "/life-timeline": "Life Timeline",
  "/since-last-checkin": "Since Last Check-in",
  "/lab": "TalkEasy Lab",
  "/help": "Find Help",
  "/settings": "Settings",
};

interface SidebarCustomizerProps {
  config: SidebarConfig;
  onConfigChange: (config: SidebarConfig) => void;
}

export function SidebarCustomizer({ config, onConfigChange }: SidebarCustomizerProps) {
  const [open, setOpen] = React.useState(false);
  const [announcement, setAnnouncement] = React.useState("");

  const announce = (msg: string) => {
    setAnnouncement(msg);
    setTimeout(() => setAnnouncement(""), 100);
  };

  const handleToggle = (id: SidebarItemId) => {
    if (ESSENTIAL_SIDEBAR_ITEMS.includes(id)) return;
    const wasVisible = isSidebarItemVisible(config, id);
    onConfigChange(toggleSidebarItemVisibility(config, id));
    announce(`${wasVisible ? "Hidden" : "Shown"} ${ITEM_LABELS[id]}`);
  };

  const handleMoveUp = (id: SidebarItemId) => {
    onConfigChange(moveSidebarItem(config, id, "up"));
    announce(`Moved ${ITEM_LABELS[id]} up`);
  };

  const handleMoveDown = (id: SidebarItemId) => {
    onConfigChange(moveSidebarItem(config, id, "down"));
    announce(`Moved ${ITEM_LABELS[id]} down`);
  };

  const handleReset = () => {
    onConfigChange(resetSidebarConfig());
    announce("Sidebar navigation reset to default");
  };

  const panelId = React.useId();

  return (
    <div className="relative">
      <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
        <PopoverPrimitive.Trigger asChild>
          <Button variant="outline" size="sm" aria-expanded={open} aria-controls={panelId} aria-haspopup="dialog">
            <Settings className="w-4 h-4 mr-2" /> Customize Sidebar
          </Button>
        </PopoverPrimitive.Trigger>
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement}
      </div>
      <PopoverPrimitive.Content
        id={panelId}
        align="end"
        sideOffset={8}
        collisionPadding={8}
        className="z-50 w-72 max-w-[calc(100vw-2.5rem)] rounded-2xl border border-border bg-card p-4 shadow-lg space-y-3"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Sidebar Items</h3>
          <button onClick={handleReset} className="min-h-[44px] min-w-[44px] flex items-center justify-center text-xs text-teal-600 hover:underline gap-1 rounded-lg hover:bg-muted/50 transition-colors">
            <RotateCcw className="w-3 h-3" /> Reset
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          Essential items (Dashboard, Settings, Find Help) cannot be hidden.
        </p>
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {SIDEBAR_CATEGORIES.map((category) => (
            <div key={category.label} className="space-y-1">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-2 py-1">
                {category.label}
              </h4>
              {category.items.map((id) => {
                const visible = isSidebarItemVisible(config, id);
                const isEssential = ESSENTIAL_SIDEBAR_ITEMS.includes(id);
                return (
                  <div key={id} className="flex items-center justify-between p-2 rounded-lg bg-muted/40 border border-border/50">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggle(id)}
                        disabled={isEssential}
                        className={cn(
                          "min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg transition-colors",
                          isEssential ? "text-muted-foreground/50 cursor-not-allowed" : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                        )}
                        aria-label={visible ? `Hide ${ITEM_LABELS[id]}` : `Show ${ITEM_LABELS[id]}`}
                      >
                        {visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                      <span className={cn("text-sm", !visible && "text-muted-foreground line-through", isEssential && "font-semibold")}>
                        {ITEM_LABELS[id]}
                      </span>
                    </div>
                    {visible && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleMoveUp(id)}
                          disabled={!canMoveSidebarItem(config, id, "up")}
                          className="min-h-[44px] min-w-[44px] flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30 rounded-lg hover:bg-muted/50 transition-colors"
                          aria-label={`Move ${ITEM_LABELS[id]} up`}
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleMoveDown(id)}
                          disabled={!canMoveSidebarItem(config, id, "down")}
                          className="min-h-[44px] min-w-[44px] flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30 rounded-lg hover:bg-muted/50 transition-colors"
                          aria-label={`Move ${ITEM_LABELS[id]} down`}
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </PopoverPrimitive.Content>
      </PopoverPrimitive.Root>
    </div>
  );
}