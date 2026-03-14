import { useState, useEffect, useMemo } from "react";
import { supabase } from "../lib/supabase";

const GEO_CODING_URL =
  "https://lvnnqtsvjqcgrimjgrad.supabase.co/functions/v1/geo-coding";

type CrimeStatRow = {
  id: string;
  local_gov_area: string;
  incident_count: number;
  [key: string]: unknown;
};

/** Geo-coding API response: contains geojson (Feature with Polygon) */
type GeoCodingResponse = {
  address_query?: string;
  formatted_address?: string;
  place_id?: string;
  center?: { lat: number; lng: number };
  geojson?: GeoJSONResponse;
  [key: string]: unknown;
};

/** Minimal type for GeoJSON returned by the edge function (Feature with Polygon) */
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
        const anonKey =
          (import.meta as unknown as { env?: Record<string, string> }).env
            ?.VITE_SUPABASE_ANON_KEY ?? "";

        const combined = await Promise.all(
          stats.map(async (stat) => {
            const url = `${GEO_CODING_URL}?address=${encodeURIComponent(stat.local_gov_area)}`;
            const res = await fetch(url, {
              method: "GET",
              headers: {
                Authorization: `Bearer ${anonKey}`,
              },
            });

            if (!res.ok) {
              throw new Error(
                `Geo-coding failed for ${stat.local_gov_area}: ${res.status} ${res.statusText}`
              );
            }

            const body = (await res.json()) as GeoCodingResponse;
            const geojson =
              body?.geojson != null && typeof body.geojson === "object"
                ? (body.geojson as GeoJSONResponse)
                : ({} as GeoJSONResponse);

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
