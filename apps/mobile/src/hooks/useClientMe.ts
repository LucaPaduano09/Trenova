import { useCallback } from "react";
import { apiClient } from "@/src/lib/api";
import { useAsyncResource } from "@/src/hooks/useAsyncResource";

export function useClientMe() {
  const loader = useCallback(() => apiClient.getClientMe(), []);
  return useAsyncResource(loader);
}
