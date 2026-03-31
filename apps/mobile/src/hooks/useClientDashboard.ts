import { useCallback } from "react";
import { apiClient } from "@/src/lib/api";
import { useAsyncResource } from "@/src/hooks/useAsyncResource";

export function useClientDashboard() {
  const loader = useCallback(() => apiClient.getClientDashboard(), []);
  return useAsyncResource(loader);
}
