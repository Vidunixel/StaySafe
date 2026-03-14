/**
 * Load police station locations from data/police_stations.csv.
 * CSV columns: X (lng), Y (lat), ..., facility_name, ...
 */
import policeStationsCsvUrl from '../../data/police_stations.csv?url';

export type PoliceStation = {
  position: [number, number];
  name: string;
};

function parseLineToStation(line: string): PoliceStation | null {
  const parts = line.split(',');
  if (parts.length < 2) return null;
  const lng = parseFloat(parts[0]);
  const lat = parseFloat(parts[1]);
  if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
  const nameMatch = line.match(/POLICING FACILITY,([^,]+),OPERATIONAL/);
  const name = nameMatch ? nameMatch[1].trim() : 'Police Station';
  return { position: [lat, lng], name };
}

/**
 * Fetch and parse police_stations.csv, return array of { position, name }.
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
      const station = parseLineToStation(lines[i]);
      if (station) stations.push(station);
    }
    return stations;
  } catch (e) {
    console.warn('Could not load police_stations.csv', e);
    return [];
  }
}
