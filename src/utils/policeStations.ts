/**
 * Load police station locations from data/police_stations.csv.
 * CSV columns: X (lng), Y (lat), ..., facility_name
 */
import policeStationsCsvUrl from '../../data/police_stations.csv?url';

export type PoliceStation = {
  position: [number, number];
  name: string;
};

function parseRow(line: string): PoliceStation | null {
  const parts = line.split(',');
  if (parts.length < 8) return null;
  const lng = parseFloat(parts[0]);
  const lat = parseFloat(parts[1]);
  if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
  const name = (parts[7] ?? 'Police Station').trim();
  return { position: [lat, lng], name };
}

/**
 * Fetch and parse police_stations.csv, return stations for map markers.
 */
export async function loadPoliceStations(): Promise<PoliceStation[]> {
  try {
    const res = await fetch(policeStationsCsvUrl);
    if (!res.ok) {
      console.warn('Could not load police_stations.csv:', res.status);
      return [];
    }
    const text = await res.text();
    const lines = text.split(/\r?\n/).filter(Boolean);
    const stations: PoliceStation[] = [];
    for (let i = 1; i < lines.length; i++) {
      const row = parseRow(lines[i]);
      if (row) stations.push(row);
    }
    return stations;
  } catch (e) {
    console.warn('Could not load police_stations.csv', e);
    return [];
  }
}
