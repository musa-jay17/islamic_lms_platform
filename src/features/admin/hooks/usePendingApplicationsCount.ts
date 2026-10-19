import { useCallback, useEffect, useState } from "react";

import { getPendingApplicationsCount } from "@/features/admin/api/studentApplicationsApi";

export function usePendingApplicationsCount() {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      setCount(await getPendingApplicationsCount());
    } catch (cause) {
      setError(cause instanceof Error ? cause : new Error("Failed to load pending applications."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { count, loading, error, refresh };
}
