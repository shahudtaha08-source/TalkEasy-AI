/**
 * TalkEasy v6.5.0-B — Dashboard layout validation (shared, pure, testable).
 *
 * Defines the set of known dashboard widget IDs and validates/parses
 * stored dashboard layout JSON. Used by both server and client.
 */

export const DASHBOARD_WIDGET_IDS = [
  "chat-cta",
  "today-mood",
  "habit-progress",
  "recent-journal",
  "daily-thought",
  "pattern-insights",
  "quick-actions",
  "recent-timeline",
] as const;

export type DashboardWidgetId = (typeof DASHBOARD_WIDGET_IDS)[number];

export interface DashboardLayout {
  version: number;
  widgets: DashboardWidgetId[];
  hidden: DashboardWidgetId[];
}

export const DEFAULT_DASHBOARD_LAYOUT: DashboardLayout = {
  version: 1,
  widgets: [...DASHBOARD_WIDGET_IDS],
  hidden: [],
};

export function isValidWidgetId(id: string): id is DashboardWidgetId {
  return (DASHBOARD_WIDGET_IDS as readonly string[]).includes(id);
}

/**
 * Parses and validates a dashboard layout JSON string.
 * Returns the default layout if parsing fails or data is invalid.
 * Filters out unknown widget IDs.
 */
export function parseDashboardLayout(raw: string | null | undefined): DashboardLayout {
  if (!raw) return { ...DEFAULT_DASHBOARD_LAYOUT, widgets: [...DEFAULT_DASHBOARD_LAYOUT.widgets], hidden: [] };
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      return { ...DEFAULT_DASHBOARD_LAYOUT, widgets: [...DEFAULT_DASHBOARD_LAYOUT.widgets], hidden: [] };
    }

    const version = typeof parsed.version === "number" ? parsed.version : 1;
    const widgets = Array.isArray(parsed.widgets)
      ? parsed.widgets.filter((w: unknown) => typeof w === "string" && isValidWidgetId(w))
      : [...DEFAULT_DASHBOARD_LAYOUT.widgets];
    const hidden = Array.isArray(parsed.hidden)
      ? parsed.hidden.filter((w: unknown) => typeof w === "string" && isValidWidgetId(w))
      : [];

    // Ensure all known widgets are accounted for (add any missing to widgets)
    const accounted = new Set([...widgets, ...hidden]);
    for (const id of DASHBOARD_WIDGET_IDS) {
      if (!accounted.has(id)) {
        widgets.push(id);
      }
    }

    // Remove duplicates
    const uniqueWidgets = Array.from(new Set(widgets)) as DashboardWidgetId[];
    const uniqueHidden = (Array.from(new Set(hidden)) as DashboardWidgetId[]).filter((h) => !uniqueWidgets.includes(h));

    return { version, widgets: uniqueWidgets, hidden: uniqueHidden };
  } catch {
    return { ...DEFAULT_DASHBOARD_LAYOUT, widgets: [...DEFAULT_DASHBOARD_LAYOUT.widgets], hidden: [] };
  }
}

/**
 * Serializes a dashboard layout to a JSON string for storage.
 */
export function serializeDashboardLayout(layout: DashboardLayout): string {
  return JSON.stringify(layout);
}

/**
 * Checks if a widget is visible given a layout.
 */
export function isWidgetVisible(layout: DashboardLayout, widgetId: DashboardWidgetId): boolean {
  return layout.widgets.includes(widgetId) && !layout.hidden.includes(widgetId);
}

/**
 * Moves a widget up or down in the order.
 */
export function moveWidget(layout: DashboardLayout, widgetId: DashboardWidgetId, direction: "up" | "down"): DashboardLayout {
  const idx = layout.widgets.indexOf(widgetId);
  if (idx === -1) return layout;
  const newIdx = direction === "up" ? idx - 1 : idx + 1;
  if (newIdx < 0 || newIdx >= layout.widgets.length) return layout;
  const newWidgets = [...layout.widgets];
  [newWidgets[idx], newWidgets[newIdx]] = [newWidgets[newIdx], newWidgets[idx]];
  return { ...layout, widgets: newWidgets };
}

/**
 * Toggles widget visibility.
 */
export function toggleWidgetVisibility(layout: DashboardLayout, widgetId: DashboardWidgetId): DashboardLayout {
  if (layout.hidden.includes(widgetId)) {
    // Show it: remove from hidden, add to widgets if not present
    const newHidden = layout.hidden.filter((h) => h !== widgetId);
    const newWidgets = layout.widgets.includes(widgetId) ? layout.widgets : [...layout.widgets, widgetId];
    return { ...layout, widgets: newWidgets, hidden: newHidden };
  } else {
    // Hide it: add to hidden, remove from widgets
    const newWidgets = layout.widgets.filter((w) => w !== widgetId);
    const newHidden = [...layout.hidden, widgetId];
    return { ...layout, widgets: newWidgets, hidden: newHidden };
  }
}