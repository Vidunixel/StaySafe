/**
 * Load police station locations from data/police_stations.csv.
 * CSV columns: X (lng), Y (lat), ...
 */
import policeStationsCsvUrl from '../../data/police_stations.csv?url';

function parseLineToPoint(line: string): [number, number] | null {
  const parts = line.split(',');
  if (parts.length < 2) return null;
  const lng = parseFloat(parts[0]);
  const lat = parseFloat(parts[1]);
  if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
  return [lat, lng];
}

/**
 * Fetch and parse police_stations.csv, return array of [lat, lng].
 */
export async function loadPoliceStations(): Promise<[number, number][]> {
  try {
    const res = await fetch(policeStationsCsvUrl);
    if (!res.ok) {
      console.warn('Could not load police_stations.csv:', res.status);
      return [];
    }
    const text = await res.text();
    const lines = text.split(/\r?\n/).filter(Boolean);
    const points: [number, number][] = [];
    for (let i = 1; i < lines.length; i++) {
      const point = parseLineToPoint(lines[i]);
      if (point) points.push(point);
    }
    return points;
  } catch (e) {
    console.warn('Could not load police_stations.csv', e);
    return [];
  }
}
