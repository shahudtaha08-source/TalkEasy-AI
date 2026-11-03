import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export function useWorkouts() {
  return useQuery({
    queryKey: ["/api/workouts"],
    queryFn: async () => {
      const res = await fetch("/api/workouts", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
  });
}

export function useExerciseCatalog() {
  return useQuery({
    queryKey: ["/api/exercise/catalog"],
    queryFn: async () => {
      const res = await fetch("/api/exercise/catalog", { credentials: "include" });
      if (!res.ok) return null;
      return res.json();
    },
  });
}

export function useLogWorkout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: any) => {
      const res = await fetch("/api/workouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed to log workout");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/workouts"] }),
  });
}

export function useDeleteWorkout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/workouts/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete workout");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/workouts"] }),
  });
}
