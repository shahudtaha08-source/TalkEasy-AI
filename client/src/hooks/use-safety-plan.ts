import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export function useSafetyPlan() {
  return useQuery({ queryKey: ["/api/safety-plan"] });
}

export function useSaveSafetyPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/safety-plan", data).then((r:any)=>r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/safety-plan"] }),
  });
}
