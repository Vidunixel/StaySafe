import { supabase } from "../lib/supabase";

type CctvRow = {
  geo_coordinates: unknown;
};

function parseGeoCoordinates(value: unknown): [number, number] | null {
  if (!Array.isArray(value) || value.length < 2) return null;
  const lat = Number(value[0]);
  const lng = Number(value[1]);
  if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
  return [lat, lng];
}

/**
 * Fetch CCTV camera locations from Supabase table cctv_locations.
 */
export async function loadCctvLocations(): Promise<[number, number][]> {
  try {
    const { data, error } = await supabase
      .from("cctv_locations")
      .select("geo_coordinates")
      .not("geo_coordinates", "is", null);

    if (error) {
      console.warn("Could not load cctv_locations:", error.message);
      return [];
    }

    const rows = (data ?? []) as CctvRow[];
    return rows
      .map((row) => parseGeoCoordinates(row.geo_coordinates))
      .filter((point): point is [number, number] => point !== null);
  } catch (e) {
    console.warn("Could not load cctv_locations", e);
    return [];
  }
}
