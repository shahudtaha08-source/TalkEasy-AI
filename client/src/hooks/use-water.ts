import { useQuery } from "@tanstack/react-query";
export function useWater() {
  return useQuery({ queryKey: ["/api/water-entries"] });
}
