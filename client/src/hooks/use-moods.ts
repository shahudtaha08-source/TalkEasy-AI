import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { isDemoMode, getDemoMoods, createDemoMood } from "@/lib/demo-data";

export function useMoods() {
  return useQuery({
    queryKey: [api.moods.list.path],
    queryFn: async () => {
      if (isDemoMode()) {
        return getDemoMoods();
      }
      const res = await fetch(api.moods.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch moods");
      return await res.json();
    },
  });
}

export function useMoodEntries(limit = 30) {
  return useQuery({
    queryKey: ["/api/mood-entries", limit],
    queryFn: async () => {
      if (isDemoMode()) return [];
      const res = await fetch(`/api/mood-entries?limit=${limit}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch mood entries");
      return await res.json();
    },
  });
}

export function useCreateMood() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      mood: string;
      notes?: string;
      date?: string;
      intensity?: number;
      factors?: string[];
      contextNote?: string;
    }) => {
      if (isDemoMode()) {
        return createDemoMood(data);
      }
      const res = await fetch(api.moods.create.path, {
        method: api.moods.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create mood");
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.moods.list.path] });
      queryClient.invalidateQueries({ queryKey: ["/api/mood-entries"] });
      queryClient.invalidateQueries({ queryKey: [api.history.emotional.path] });
    },
  });
}
