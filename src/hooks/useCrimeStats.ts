import { useState, useEffect, useMemo } from "react";
import { supabase } from "../lib/supabase";

type CrimeStatRow = {
  id: string;
  local_gov_area: string;
  incident_count: number;
  [key: string]: unknown;
};

/** Minimal type for GeoJSON returned by the edge function (Feature, FeatureCollection, etc.) */
export type GeoJSONResponse = Record<string, unknown> & {
  type?: string;
  geometry?: unknown;
  features?: unknown[];
};

export type CrimeStatWithGeo = {
  id: string;
  local_gov_area: string;
  incident_count: number;
  geojson: GeoJSONResponse;
};

export function useCrimeStats() {
  const [data, setData] = useState<CrimeStatWithGeo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchStats() {
      setIsLoading(true);
      setError(null);

      try {
        const { data: rows, error: fetchError } = await supabase
          .from("crime_stats")
          .select("*");

        if (fetchError) {
          throw fetchError;
        }

        const stats = (rows ?? []) as CrimeStatRow[];

        const combined = await Promise.all(
          stats.map(async (stat) => {
            const { data: invokeData, error: invokeError } = await supabase.functions.invoke(
              "geo-coding",
              { body: { address: stat.local_gov_area } }
            );

            if (invokeError) {
              throw new Error(
                `Geo-coding failed for ${stat.local_gov_area}: ${invokeError.message}`
              );
            }

            // Response may be the GeoJSON directly or wrapped (e.g. { data: geojson })
            const raw = invokeData != null && typeof invokeData === "object" ? invokeData : {};
            const geojson = (
              "data" in raw && raw.data != null && typeof raw.data === "object"
                ? raw.data
                : raw
            ) as GeoJSONResponse;

            return {
              id: stat.id,
              local_gov_area: stat.local_gov_area,
              incident_count: stat.incident_count,
              geojson,
            } satisfies CrimeStatWithGeo;
          })
        );

        setData(combined);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        setData([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchStats();
  }, []);

  const maxIncidentCount = useMemo(() => {
    if (data.length === 0) return 0;
    return Math.max(...data.map((d) => d.incident_count));
  }, [data]);

  return {
    data,
    isLoading,
    error,
    maxIncidentCount,
  };
}
