import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export function useReflectionPrompts() {
  return useQuery({ queryKey: ["/api/reflection-prompts"] });
}

export function useReflectionResponses() {
  return useQuery({ queryKey: ["/api/reflection-responses"] });
}

export function useCreateReflectionResponse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/reflection-responses", data).then((r:any)=>r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/reflection-responses"] }); },
  });
}
