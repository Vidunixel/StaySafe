import { supabase } from "../lib/supabase";

export type PoliceStation = {
  position: [number, number];
  name: string;
};

type PoliceStationRow = {
  geo_coordinates: unknown;
};

function parseStation(row: PoliceStationRow): PoliceStation | null {
  if (!Array.isArray(row.geo_coordinates) || row.geo_coordinates.length < 2) {
    return null;
  }
  const lat = Number(row.geo_coordinates[0]);
  const lng = Number(row.geo_coordinates[1]);
  if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
  return { position: [lat, lng], name: "Police Station" };
}

/**
 * Fetch police stations from Supabase police_stations table.
 */
export async function loadPoliceStations(): Promise<PoliceStation[]> {
  try {
    const { data, error } = await supabase
      .from("police_stations")
      .select("geo_coordinates")
      .not("geo_coordinates", "is", null);

    if (error) {
      console.warn("Could not load police_stations:", error.message);
      return [];
    }

    return ((data ?? []) as PoliceStationRow[])
      .map(parseStation)
      .filter((station): station is PoliceStation => station !== null);
  } catch (e) {
    console.warn("Could not load police_stations", e);
    return [];
  }
}
