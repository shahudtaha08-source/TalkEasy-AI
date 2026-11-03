/**
 * TalkEasy v6.5-C — Sidebar configuration validation (shared, pure, testable).
 *
 * Defines the set of known sidebar navigation item IDs and validates/parses
 * stored sidebar config JSON. Used by both server and client.
 */

export const SIDEBAR_ITEM_IDS = [
  "/dashboard",
  "/chat",
  "/mood-enhanced",
  "/habits",
  "/sleep",
  "/water",
  "/stress",
  "/exercise",
  "/insights/wellness",
  "/insights/wearable",
  "/trends-30",
  "/trends-90",
  "/reports",
  "/journal",
  "/statistics",
  "/history",
  "/resources",
  "/goals",
  "/wellness-journey",
  "/reflections",
  "/pattern-explorer",
  "/wellness-plan",
  "/safety-plan",
  "/wellness-dna",
  "/then-vs-now",
  "/why-today",
  "/life-timeline",
  "/since-last-checkin",
  "/lab",
  "/help",
  "/settings",
] as const;

// /focus-mode was previously included but is not a sidebar navigation item.
// It is retained here for backward compatibility with older persisted configs.
export const LEGACY_SIDEBAR_ITEM_IDS = ["/focus-mode"] as const;

export type SidebarItemId = (typeof SIDEBAR_ITEM_IDS)[number];

// Essential items that must always remain visible
export const ESSENTIAL_SIDEBAR_ITEMS: SidebarItemId[] = [
  "/dashboard",
  "/settings",
  "/help",
];

// Category definitions for sidebar navigation
export const SIDEBAR_CATEGORIES: { label: string; items: SidebarItemId[] }[] = [
  { label: "Dashboard", items: ["/dashboard"] },
  { label: "Trackers", items: ["/mood-enhanced", "/sleep", "/water", "/stress", "/exercise", "/habits"] },
  { label: "Wellness", items: ["/journal", "/insights/wellness", "/insights/wearable", "/statistics", "/history"] },
  { label: "Growth", items: ["/goals", "/wellness-journey", "/reflections", "/wellness-plan", "/safety-plan"] },
  { label: "Insights", items: ["/trends-30", "/trends-90", "/reports", "/pattern-explorer", "/wellness-dna", "/then-vs-now", "/why-today", "/life-timeline", "/since-last-checkin", "/lab"] },
  { label: "Support", items: ["/chat", "/resources", "/help"] },
  { label: "App", items: ["/settings"] },
];

export function getCategoryForItem(itemId: SidebarItemId): string | null {
  for (const cat of SIDEBAR_CATEGORIES) {
    if (cat.items.includes(itemId)) return cat.label;
  }
  return null;
}

export function getItemsInCategory(categoryLabel: string): SidebarItemId[] {
  const cat = SIDEBAR_CATEGORIES.find((c) => c.label === categoryLabel);
  return cat ? [...cat.items] : [];
}

export interface SidebarConfig {
  version: number;
  visible: SidebarItemId[];
  hidden: SidebarItemId[];
  order: SidebarItemId[];
}

export const DEFAULT_SIDEBAR_CONFIG: SidebarConfig = {
  version: 1,
  visible: [...SIDEBAR_ITEM_IDS],
  hidden: [],
  order: [...SIDEBAR_ITEM_IDS],
};

export function isValidSidebarItemId(id: string): id is SidebarItemId {
  return (SIDEBAR_ITEM_IDS as readonly string[]).includes(id);
}

export function parseSidebarConfig(raw: string | null | undefined): SidebarConfig {
  if (!raw) {
    return { version: 1, visible: [...SIDEBAR_ITEM_IDS], hidden: [], order: [...SIDEBAR_ITEM_IDS] };
  }
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      return { version: 1, visible: [...SIDEBAR_ITEM_IDS], hidden: [], order: [...SIDEBAR_ITEM_IDS] };
    }

    const version = typeof parsed.version === "number" ? parsed.version : 1;
    const visible = Array.isArray(parsed.visible)
      ? parsed.visible.filter((v: unknown) => typeof v === "string" && isValidSidebarItemId(v))
      : [...SIDEBAR_ITEM_IDS];
    const hidden = Array.isArray(parsed.hidden)
      ? parsed.hidden.filter((v: unknown) => typeof v === "string" && isValidSidebarItemId(v))
      : [];
    const order = Array.isArray(parsed.order)
      ? parsed.order.filter((v: unknown) => typeof v === "string" && isValidSidebarItemId(v))
      : [...SIDEBAR_ITEM_IDS];

    // Ensure essential items are always visible
    for (const essential of ESSENTIAL_SIDEBAR_ITEMS) {
      if (hidden.includes(essential)) {
        hidden.splice(hidden.indexOf(essential), 1);
      }
      if (!visible.includes(essential)) {
        visible.push(essential);
      }
      if (!order.includes(essential)) {
        order.push(essential);
      }
    }

    // Add any missing items to visible + order
    const accounted = new Set([...visible, ...hidden, ...order]);
    for (const id of SIDEBAR_ITEM_IDS) {
      if (!accounted.has(id)) {
        visible.push(id);
        order.push(id);
      }
    }

    // Remove duplicates
    const uniqueVisible = Array.from(new Set(visible)) as SidebarItemId[];
    const uniqueHidden = (Array.from(new Set(hidden)) as SidebarItemId[]).filter((h) => !uniqueVisible.includes(h));
    const uniqueOrder = Array.from(new Set(order)) as SidebarItemId[];

    return { version, visible: uniqueVisible, hidden: uniqueHidden, order: uniqueOrder };
  } catch {
    return { version: 1, visible: [...SIDEBAR_ITEM_IDS], hidden: [], order: [...SIDEBAR_ITEM_IDS] };
  }
}

export function serializeSidebarConfig(config: SidebarConfig): string {
  return JSON.stringify(config);
}

export function isSidebarItemVisible(config: SidebarConfig, itemId: SidebarItemId): boolean {
  return config.visible.includes(itemId) && !config.hidden.includes(itemId);
}

export function toggleSidebarItemVisibility(config: SidebarConfig, itemId: SidebarItemId): SidebarConfig {
  // Essential items cannot be hidden
  if (ESSENTIAL_SIDEBAR_ITEMS.includes(itemId)) return config;

  if (config.hidden.includes(itemId)) {
    const newHidden = config.hidden.filter((h) => h !== itemId);
    const newVisible = config.visible.includes(itemId) ? config.visible : [...config.visible, itemId];
    return { ...config, visible: newVisible, hidden: newHidden };
  } else {
    const newVisible = config.visible.filter((v) => v !== itemId);
    const newHidden = [...config.hidden, itemId];
    return { ...config, visible: newVisible, hidden: newHidden };
  }
}

export function moveSidebarItem(config: SidebarConfig, itemId: SidebarItemId, direction: "up" | "down"): SidebarConfig {
  const category = getCategoryForItem(itemId);
  if (!category) return config;

  const categoryItems = getItemsInCategory(category);
  // Only consider visible items in this category (hidden items don't participate in reordering)
  const visibleCategoryItems = categoryItems.filter((id) => config.visible.includes(id) && !config.hidden.includes(id));

  const idx = visibleCategoryItems.indexOf(itemId);
  if (idx === -1) return config;
  const newIdx = direction === "up" ? idx - 1 : idx + 1;
  if (newIdx < 0 || newIdx >= visibleCategoryItems.length) return config;

  // Reorder within the category: build new order array
  const newVisibleCategory = [...visibleCategoryItems];
  [newVisibleCategory[idx], newVisibleCategory[newIdx]] = [newVisibleCategory[newIdx], newVisibleCategory[idx]];

  // Reconstruct the full order array:
  // - Hidden category items stay in their relative positions
  // - Visible category items are replaced in order with the reordered list
  const newOrder = [...config.order];
  let vi = 0; // index into newVisibleCategory
  for (let i = 0; i < newOrder.length; i++) {
    if (categoryItems.includes(newOrder[i])) {
      if (config.hidden.includes(newOrder[i])) {
        // Hidden item: keep in place
        continue;
      } else {
        // Visible item: assign next reordered item
        if (vi < newVisibleCategory.length) {
          newOrder[i] = newVisibleCategory[vi++];
        }
      }
    }
  }
  // Append any remaining visible items (shouldn't happen, but safety)
  while (vi < newVisibleCategory.length) {
    newOrder.push(newVisibleCategory[vi++]);
  }

  return { ...config, order: newOrder };
}

export function canMoveSidebarItem(config: SidebarConfig, itemId: SidebarItemId, direction: "up" | "down"): boolean {
  const category = getCategoryForItem(itemId);
  if (!category) return false;
  const categoryItems = getItemsInCategory(category);
  const visibleCategoryItems = categoryItems.filter((id) => config.visible.includes(id) && !config.hidden.includes(id));
  const idx = visibleCategoryItems.indexOf(itemId);
  if (idx === -1) return false;
  const newIdx = direction === "up" ? idx - 1 : idx + 1;
  return newIdx >= 0 && newIdx < visibleCategoryItems.length;
}

export function resetSidebarConfig(): SidebarConfig {
  return { version: 1, visible: [...SIDEBAR_ITEM_IDS], hidden: [], order: [...SIDEBAR_ITEM_IDS] };
}