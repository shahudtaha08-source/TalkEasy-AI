import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useUser } from "@/hooks/use-user";
import { useUserPreferences, useUpdateUserPreferences, userPreferencesQueryKey, clearUserPreferenceCache } from "@/hooks/use-user-preferences";
import { parseSidebarConfig, serializeSidebarConfig, resetSidebarConfig, type SidebarConfig } from "@shared/sidebar-config";
import { toast } from "@/hooks/use-toast";

/**
 * TalkEasy v6.5-C — Sidebar configuration hook with single-flight save queue.
 *
 * Maintains:
 * - latestDesired: the latest intended config (local state)
 * - currentUserId: scopes state to authenticated user
 * - debounceTimer: delays saves
 * - inFlight: whether a save is currently pending
 * - dirty: whether there are unsaved changes
 * - saveError: whether the last save failed
 *
 * Single-flight guarantee: at most one PUT is in-flight at any time.
 * While a PUT is pending, new changes are queued (latestDesired updated).
 * When the PUT completes, if latestDesired differs from what was saved,
 * a new PUT is sent with the latest config.
 */

const DEFAULT_CONFIG: SidebarConfig = {
  version: 1,
  visible: [],
  hidden: [],
  order: [],
};

function defaultConfig(): SidebarConfig {
  // Import dynamically to avoid circular deps
  return {
    version: 1,
    visible: [],
    hidden: [],
    order: [],
  };
}

export interface UseSidebarConfigResult {
  config: SidebarConfig;
  isLoading: boolean;
  isSaving: boolean;
  hasError: boolean;
  updateConfig: (newConfig: SidebarConfig) => void;
  retrySave: () => void;
  resetConfig: () => void;
}

export function useSidebarConfig(): UseSidebarConfigResult {
  const { data: user } = useUser();
  const userId = user?.id ?? null;
  const queryClient = useQueryClient();

  const { data: prefs, isLoading: prefsLoading } = useUserPreferences(userId);
  const updatePrefs = useUpdateUserPreferences(userId);

  // Server-parsed config
  const serverConfig = React.useMemo(() => {
    if (prefs?.sidebarConfig) {
      return parseSidebarConfig(prefs.sidebarConfig);
    }
    return null;
  }, [prefs?.sidebarConfig]);

  // Local state (latest desired)
  const [localConfig, setLocalConfig] = React.useState<SidebarConfig | null>(null);
  const [hydrated, setHydrated] = React.useState(false);
  const [prevUserId, setPrevUserId] = React.useState<string | null>(null);

  // Single-flight state
  const latestDesiredRef = React.useRef<SidebarConfig | null>(null);
  const inFlightRef = React.useRef(false);
  const pendingSaveRef = React.useRef<SidebarConfig | null>(null);
  const debounceTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const [hasError, setHasError] = React.useState(false);

  // Reset on account change
  React.useEffect(() => {
    if (userId !== prevUserId) {
      // Clear previous user's cache
      if (prevUserId !== null && userId === null) {
        clearUserPreferenceCache(queryClient);
      }
      setLocalConfig(null);
      setHydrated(false);
      latestDesiredRef.current = null;
      pendingSaveRef.current = null;
      inFlightRef.current = false;
      setIsSaving(false);
      setHasError(false);
      setPrevUserId(userId);
    }
  }, [userId, prevUserId, queryClient]);

  // Hydrate from server when prefs arrive
  React.useEffect(() => {
    if (!userId || !serverConfig || hydrated) return;
    setLocalConfig(serverConfig);
    setHydrated(true);
    latestDesiredRef.current = serverConfig;
  }, [userId, serverConfig, hydrated]);

  // The config displayed to UI: local if available, else server, else default
  const config = localConfig ?? serverConfig ?? {
    version: 1,
    visible: [],
    hidden: [],
    order: [],
  };

  // Single-flight save function
  const doSave = React.useCallback((configToSave: SidebarConfig) => {
    if (inFlightRef.current) {
      // Queue the latest config
      pendingSaveRef.current = configToSave;
      return;
    }

    inFlightRef.current = true;
    setIsSaving(true);
    setHasError(false);

    updatePrefs.mutate(
      { sidebarConfig: serializeSidebarConfig(configToSave) },
      {
        onSuccess: () => {
          inFlightRef.current = false;
          setIsSaving(false);
          // Check if there's a pending save
          const pending = pendingSaveRef.current;
          pendingSaveRef.current = null;
          if (pending) {
            // Compare: only save if different from what we just saved
            const savedJson = serializeSidebarConfig(configToSave);
            const pendingJson = serializeSidebarConfig(pending);
            if (savedJson !== pendingJson) {
              doSave(pending);
            }
          }
        },
        onError: () => {
          inFlightRef.current = false;
          setIsSaving(false);
          setHasError(true);
          // Clear pending — user must retry
          pendingSaveRef.current = null;
          toast({
            title: "Failed to save sidebar settings",
            description: "Your changes were applied locally but could not be saved. Click retry to try again.",
            variant: "destructive",
          });
        },
      },
    );
  }, [updatePrefs]);

  const scheduleSave = React.useCallback((newConfig: SidebarConfig) => {
    latestDesiredRef.current = newConfig;
    setLocalConfig(newConfig);

    // Optimistic cache update
    if (userId) {
      queryClient.setQueryData(userPreferencesQueryKey(userId), (old: any) => ({
        ...old,
        sidebarConfig: serializeSidebarConfig(newConfig),
      }));
    }

    // Clear existing debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Debounce 400ms
    debounceTimerRef.current = setTimeout(() => {
      const toSave = latestDesiredRef.current;
      if (toSave) {
        doSave(toSave);
      }
    }, 400);
  }, [userId, queryClient, doSave]);

  const updateConfig = React.useCallback((newConfig: SidebarConfig) => {
    scheduleSave(newConfig);
  }, [scheduleSave]);

  const retrySave = React.useCallback(() => {
    const toSave = latestDesiredRef.current ?? localConfig;
    if (toSave) {
      setHasError(false);
      doSave(toSave);
    }
  }, [localConfig, doSave]);

  const resetConfig = React.useCallback(() => {
    const reset = resetSidebarConfig();
    updateConfig(reset);
  }, [updateConfig]);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return {
    config,
    isLoading: prefsLoading && !!userId,
    isSaving,
    hasError,
    updateConfig,
    retrySave,
    resetConfig,
  };
}