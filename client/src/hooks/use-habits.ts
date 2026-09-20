import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { isDemoMode, getDemoHabits, createDemoHabit, updateDemoHabit } from "@/lib/demo-data";

export function useHabits(date?: string) {
  return useQuery({
    queryKey: [api.habits.list.path, date],
    queryFn: async () => {
      if (isDemoMode()) {
        return getDemoHabits(date);
      }
      const url = new URL(api.habits.list.path, window.location.origin);
      if (date) url.searchParams.append("date", date);
      const res = await fetch(url.toString(), { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch habits");
      return await res.json();
    },
  });
}

export function useCreateHabit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { type: string; completed: boolean; completionPercentage?: number; notes?: string; date?: string }) => {
      if (isDemoMode()) {
        return createDemoHabit(data);
      }
      const res = await fetch(api.habits.create.path, {
        method: api.habits.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create habit");
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.habits.list.path] });
    },
  });
}

export function useUpdateHabit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number; completed?: boolean; completionPercentage?: number; notes?: string }) => {
      if (isDemoMode()) {
        return updateDemoHabit(id, data);
      }
      const url = buildUrl(api.habits.update.path, { id });
      const res = await fetch(url, {
        method: api.habits.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update habit");
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.habits.list.path] });
    },
  });
}
