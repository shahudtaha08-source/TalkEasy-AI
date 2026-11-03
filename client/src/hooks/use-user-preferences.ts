import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface UserPreference {
  id?: number;
  userId?: string;
  theme?: string;
  accentPalette?: string;
  accentColor?: string | null;
  backgroundColor?: string | null;
  surfaceColor?: string | null;
  dashboardLayout?: string;
  sidebarConfig?: string;
  homeShortcuts?: string;
  updatedAt?: string;
  createdAt?: string;
}

/**
 * User-specific query key that includes the authenticated user's ID.
 * This prevents cache collisions between different accounts.
 */
export function userPreferencesQueryKey(userId: string | null | undefined): (string | null)[] {
  return ["/api/user-preferences", userId ?? null];
}

export function useUserPreferences(userId: string | null | undefined) {
  return useQuery<UserPreference | null>({
    queryKey: userPreferencesQueryKey(userId),
    queryFn: async () => {
      const res = await fetch("/api/user-preferences", { credentials: "include" });
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes — matches useUser
    refetchOnMount: true, // Re-fetch when component mounts (handles account switch)
  });
}

export function useUpdateUserPreferences(userId: string | null | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Partial<UserPreference>) => {
      const res = await fetch("/api/user-preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed to save user preferences");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: userPreferencesQueryKey(userId) });
    },
    onError: () => {
      // Cache is not invalidated on error; local state remains as-is.
      // The caller (useTheme) handles user feedback.
    },
  });
}

/**
 * Removes all user-preference cache entries. Call on logout.
 */
export function clearUserPreferenceCache(qc: ReturnType<typeof useQueryClient>): void {
  qc.removeQueries({ queryKey: ["/api/user-preferences"] });
}