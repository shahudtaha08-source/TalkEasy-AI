import { useQuery } from "@tanstack/react-query";
export function useSleep() {
  return useQuery({ queryKey: ["/api/sleep-entries"] });
}
