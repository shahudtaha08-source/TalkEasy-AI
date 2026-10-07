import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
} from "@/components/ui/command";
import { useTranslation } from "@/i18n/LanguageContext";
import {
  FEATURE_REGISTRY,
  SEARCH_CATEGORY_LABELS,
  SEARCH_CATEGORY_ORDER,
  type FeatureEntry,
} from "@/lib/feature-registry";

function normalize(value: string): string {
  return value.toLowerCase().trim();
}

/**
 * Lightweight client-side global search over the TalkEasy feature registry.
 * No API requests, no private records — local filtering only.
 */
export function GlobalSearch() {
  const { t, language } = useTranslation();
  const [, setLocation] = useLocation();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    const onToggle = () => setOpen((prev) => !prev);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("talkeasy:global-search-toggle", onToggle);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("talkeasy:global-search-toggle", onToggle);
    };
  }, []);

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const results = useMemo(() => {
    const tokens = normalize(query).split(/\s+/).filter(Boolean);

    const scored = FEATURE_REGISTRY.map((entry) => {
      const title = t(entry.titleKey);
      const desc = t(entry.descKey);
      const haystack = normalize(
        `${title} ${desc} ${entry.keywords.join(" ")} ${entry.id.replace(/-/g, " ")}`
      );
      if (!tokens.every((token) => haystack.includes(token))) return null;

      const normTitle = normalize(title);
      let score = tokens.length === 0 ? 1 : 3;
      if (tokens.length > 0 && normTitle.startsWith(tokens[0])) score += 3;
      else if (tokens.length > 0 && normTitle.includes(tokens[0])) score += 2;
      return { entry, title, desc, score };
    }).filter((item): item is { entry: FeatureEntry; title: string; desc: string; score: number } => item !== null);

    scored.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));
    return scored;
    // `language` is the stable dependency for translated lookups.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, language]);

  const grouped = useMemo(() => {
    return SEARCH_CATEGORY_ORDER.map((category) => ({
      category,
      items: results.filter((r) => r.entry.category === category),
    })).filter((group) => group.items.length > 0);
  }, [results]);

  const select = (route: string) => {
    setOpen(false);
    setQuery("");
    setLocation(route);
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder={t("searchPlaceholder")}
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>{t("searchNoResults")}</CommandEmpty>
        {grouped.map(({ category, items }) => (
          <CommandGroup key={category} heading={t(SEARCH_CATEGORY_LABELS[category])}>
            {items.map(({ entry, title, desc }) => {
              const Icon = entry.icon;
              return (
                <CommandItem
                  key={entry.id}
                  value={`${title} ${desc} ${entry.keywords.join(" ")} ${entry.id}`}
                  onSelect={() => select(entry.route)}
                  className="gap-3 py-2.5"
                >
                  <Icon className="h-4 w-4 shrink-0 text-teal-600" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{title}</p>
                    <p className="text-xs text-muted-foreground truncate">{desc}</p>
                  </div>
                  <CommandShortcut>{t("searchOpen")}</CommandShortcut>
                </CommandItem>
              );
            })}
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  );
}
