import { useCallback, useEffect, useState } from "react";
import { ApiClientError } from "@trenova/api-client";

export function useAsyncResource<T>(loader: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unauthorized, setUnauthorized] = useState(false);

  const run = useCallback(async () => {
    setLoading(true);
    setError(null);
    setUnauthorized(false);

    try {
      const next = await loader();
      setData(next);
    } catch (err) {
      if (err instanceof ApiClientError && (err.status === 401 || err.status === 403)) {
        setUnauthorized(true);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Unexpected error");
      }
    } finally {
      setLoading(false);
    }
  }, [loader]);

  useEffect(() => {
    void run();
  }, [run]);

  return {
    data,
    loading,
    error,
    unauthorized,
    refetch: run,
  };
}
