import { useCallback } from "react";
import { apiClient } from "@/src/lib/api";
import { useAsyncResource } from "@/src/hooks/useAsyncResource";

export function useClientWorkouts() {
  const loader = useCallback(() => apiClient.getClientWorkouts(), []);
  return useAsyncResource(loader);
}
