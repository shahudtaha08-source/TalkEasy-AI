import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export function useGoals() {
  return useQuery({
    queryKey: ["/api/goals"],
  });
}

export function useCreateGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/goals", data).then((r:any)=>r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/goals"] }),
  });
}

export function useUpdateGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: any) => apiRequest("PATCH", `/api/goals/${id}`, data).then((r:any)=>r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/goals"] }),
  });
}

export function useDeleteGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/goals/${id}`).then((r:any)=>r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/goals"] }),
  });
}
