import {
  fetchAllRows,
  getDefaultCacheTtlMs,
  loadWithCache,
} from "../lib/dataLoader";

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
    return await loadWithCache(
      "police_stations.all_points",
      async () => {
        const rows = await fetchAllRows<PoliceStationRow>(
          "police_stations",
          "geo_coordinates",
        );
        return rows
          .map(parseStation)
          .filter((station): station is PoliceStation => station !== null);
      },
      getDefaultCacheTtlMs(),
    );
  } catch (e) {
    console.warn("Could not load police_stations", e);
    return [];
  }
}
