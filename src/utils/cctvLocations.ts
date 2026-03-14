/**
 * Load CCTV camera locations from data/cctv-locations.csv.
 * The CSV has a geo_point column with format "lat, lng".
 */
import cctvCsvUrl from '../../data/cctv-locations.csv?url';

function parseGeoPointFromLine(line: string): [number, number] | null {
  const match = line.match(/"(-?\d+\.\d+),\s*(-?\d+\.\d+)"/);
  if (!match) return null;
  const lat = parseFloat(match[1]);
  const lng = parseFloat(match[2]);
  if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
  return [lat, lng];
}

/**
 * Fetch and parse cctv-locations.csv, return array of [lat, lng].
 */
export async function loadCctvLocations(): Promise<[number, number][]> {
  try {
    const res = await fetch(cctvCsvUrl);
    if (!res.ok) {
      console.warn('Could not load cctv-locations.csv:', res.status);
      return [];
    }
    const text = await res.text();
    const lines = text.split(/\r?\n/).filter(Boolean);
    const points: [number, number][] = [];
    for (let i = 1; i < lines.length; i++) {
      const point = parseGeoPointFromLine(lines[i]);
      if (point) points.push(point);
    }
    return points;
  } catch (e) {
    console.warn('Could not load cctv-locations.csv', e);
    return [];
  }
}
