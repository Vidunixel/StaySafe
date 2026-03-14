import { useState, useEffect, useMemo } from "react";
import { supabase } from "../lib/supabase";

type CrimeStatRow = {
  id: string;
  local_gov_area: string;
  avg_rate_per_100k: number;
  geo_bounds?: unknown; // jsonb: multi-dimensional array of coordinates
  [key: string]: unknown;
};

export type CrimeStatWithBounds = {
  id: string;
  local_gov_area: string;
  avg_rate_per_100k: number;
  geo_bounds: unknown;
};

export function useCrimeStats() {
  const [data, setData] = useState<CrimeStatWithBounds[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchStats() {
      setIsLoading(true);
      setError(null);

      try {
        const { data: rows, error: fetchError } = await supabase
          .from("crime_stats")
          .select("id, local_gov_area, avg_rate_per_100k, geo_bounds");

        if (fetchError) {
          throw fetchError;
        }

        const stats = (rows ?? []) as CrimeStatRow[];
        setData(
          stats.map((stat) => ({
            id: stat.id,
            local_gov_area: stat.local_gov_area,
            avg_rate_per_100k: stat.avg_rate_per_100k,
            geo_bounds: stat.geo_bounds ?? null,
          })),
        );
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        setData([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchStats();
  }, []);

  const maxAvgRate = useMemo(() => {
    if (data.length === 0) return 0;
    return Math.max(...data.map((d) => d.avg_rate_per_100k));
  }, [data]);

  return {
    data,
    isLoading,
    error,
    maxAvgRate,
  };
}
