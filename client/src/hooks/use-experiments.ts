import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export function useExperiments() {
  return useQuery({ queryKey: ["/api/experiments"] });
}

export function useCreateExperiment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/experiments", data).then((r:any)=>r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/experiments"] }),
  });
}

export function useUpdateExperiment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: any) => apiRequest("PATCH", `/api/experiments/${id}`, data).then((r:any)=>r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/experiments"] }),
  });
}
