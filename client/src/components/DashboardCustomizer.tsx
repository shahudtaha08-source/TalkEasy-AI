import * as React from "react";
import { Settings, Eye, EyeOff, ArrowUp, ArrowDown, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUserPreferences, useUpdateUserPreferences } from "@/hooks/use-user-preferences";
import { useUser } from "@/hooks/use-user";
import {
  DASHBOARD_WIDGET_IDS,
  DEFAULT_DASHBOARD_LAYOUT,
  parseDashboardLayout,
  serializeDashboardLayout,
  toggleWidgetVisibility,
  moveWidget,
  isWidgetVisible,
  type DashboardWidgetId,
  type DashboardLayout,
} from "@shared/dashboard-layout";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import * as PopoverPrimitive from "@radix-ui/react-popover";

const WIDGET_LABELS: Record<DashboardWidgetId, string> = {
  "chat-cta": "Support Chat CTA",
  "today-mood": "Today's Mood",
  "habit-progress": "Habit Progress",
  "recent-journal": "Recent Journal",
  "daily-thought": "Daily Thought",
  "pattern-insights": "Pattern Insights",
  "quick-actions": "Quick Actions",
  "recent-timeline": "Recent Activity",
};

interface DashboardCustomizerProps {
  layout: DashboardLayout;
  onLayoutChange: (layout: DashboardLayout) => void;
}

export function DashboardCustomizer({ layout, onLayoutChange }: DashboardCustomizerProps) {
  const [open, setOpen] = React.useState(false);
  const [announcement, setAnnouncement] = React.useState("");

  const announce = (msg: string) => {
    setAnnouncement(msg);
    // Clear after a short delay so repeated identical actions still announce
    setTimeout(() => setAnnouncement(""), 100);
  };

  const handleToggle = (id: DashboardWidgetId) => {
    const wasVisible = isWidgetVisible(layout, id);
    onLayoutChange(toggleWidgetVisibility(layout, id));
    announce(`${wasVisible ? "Hidden" : "Shown"} ${WIDGET_LABELS[id]}`);
  };

  const handleMoveUp = (id: DashboardWidgetId) => {
    onLayoutChange(moveWidget(layout, id, "up"));
    announce(`Moved ${WIDGET_LABELS[id]} up`);
  };

  const handleMoveDown = (id: DashboardWidgetId) => {
    onLayoutChange(moveWidget(layout, id, "down"));
    announce(`Moved ${WIDGET_LABELS[id]} down`);
  };

  const handleReset = () => {
    onLayoutChange({ ...DEFAULT_DASHBOARD_LAYOUT, widgets: [...DEFAULT_DASHBOARD_LAYOUT.widgets], hidden: [] });
    announce("Dashboard layout reset to default");
  };

  const panelId = React.useId();

  return (
    <div className="relative">
      <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
        <PopoverPrimitive.Trigger asChild>
          <Button variant="outline" size="sm" aria-expanded={open} aria-controls={panelId} aria-haspopup="dialog">
            <Settings className="w-4 h-4 mr-2" /> Customize Dashboard
          </Button>
        </PopoverPrimitive.Trigger>
      {/* Screen-reader live region */}
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
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Dashboard Widgets</h3>
          <button onClick={handleReset} className="min-h-[44px] min-w-[44px] flex items-center justify-center text-xs text-teal-600 hover:underline gap-1 rounded-lg hover:bg-muted/50 transition-colors">
            <RotateCcw className="w-3 h-3" /> Reset
          </button>
        </div>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {DASHBOARD_WIDGET_IDS.map((id) => {
            const visible = isWidgetVisible(layout, id);
            const idx = layout.widgets.indexOf(id);
            return (
              <div key={id} className="flex items-center justify-between p-2 rounded-lg bg-muted/40 border border-border/50">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggle(id)}
                    className="min-h-[44px] min-w-[44px] flex items-center justify-center text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/50 transition-colors"
                    aria-label={visible ? `Hide ${WIDGET_LABELS[id]}` : `Show ${WIDGET_LABELS[id]}`}
                  >
                    {visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                  <span className={cn("text-sm", !visible && "text-muted-foreground line-through")}>
                    {WIDGET_LABELS[id]}
                  </span>
                </div>
                {visible && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleMoveUp(id)}
                      disabled={idx === 0}
                      className="min-h-[44px] min-w-[44px] flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30 rounded-lg hover:bg-muted/50 transition-colors"
                      aria-label={`Move ${WIDGET_LABELS[id]} up`}
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleMoveDown(id)}
                      disabled={idx === layout.widgets.length - 1}
                      className="min-h-[44px] min-w-[44px] flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30 rounded-lg hover:bg-muted/50 transition-colors"
                      aria-label={`Move ${WIDGET_LABELS[id]} down`}
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </PopoverPrimitive.Content>
      </PopoverPrimitive.Root>
    </div>
  );
}