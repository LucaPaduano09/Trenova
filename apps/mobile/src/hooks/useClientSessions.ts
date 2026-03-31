import { useCallback } from "react";
import { apiClient } from "@/src/lib/api";
import { useAsyncResource } from "@/src/hooks/useAsyncResource";

export function useClientSessions(month?: string) {
  const loader = useCallback(() => apiClient.getClientSessions(month), [month]);
  return useAsyncResource(loader);
}
