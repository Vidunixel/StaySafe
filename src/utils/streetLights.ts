/**
 * Load street light locations from CSV files in data/street_lights/.
 * Each CSV has a geo_point_2d column (or similar) with format "lat, lng".
 * Returns a sampled list of [lat, lng] for map performance (maxPoints default 2000).
 */
import melbourneYarraUrl from '../../data/street_lights/melbourne_yarra_lighting.csv?url';
import ballaratUrl from '../../data/street_lights/ballarat_lighting.csv?url';
import cityOfCaseyUrl from '../../data/street_lights/cityOfCasey_lighting.csv?url';

const STREET_LIGHTS_CSV_URLS = [
  melbourneYarraUrl,
  ballaratUrl,
  cityOfCaseyUrl,
] as const;

/** Extract first "lat, lng" pattern from a CSV line (handles different column orders). */
function parseGeoPointFromLine(line: string): [number, number] | null {
  const match = line.match(/"(-?\d+\.\d+),\s*(-?\d+\.\d+)"/);
  if (!match) return null;
  const lat = parseFloat(match[1]);
  const lng = parseFloat(match[2]);
  if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
  return [lat, lng];
}

function parseCsvToPoints(text: string): [number, number][] {
  const lines = text.split(/\r?\n/).filter(Boolean);
  const points: [number, number][] = [];
  for (let i = 1; i < lines.length; i++) {
    const point = parseGeoPointFromLine(lines[i]);
    if (point) points.push(point);
  }
  return points;
}

/**
 * Fetch and parse all street lighting CSVs from data/street_lights/, then combine and sample.
 * Samples to maxPoints for performance when the combined set is large.
 */
export async function loadStreetLights(
  maxPoints: number = 2000
): Promise<[number, number][]> {
  const allPoints: [number, number][] = [];
  for (const url of STREET_LIGHTS_CSV_URLS) {
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const text = await res.text();
      allPoints.push(...parseCsvToPoints(text));
    } catch {
      // skip failed files
    }
  }
  if (allPoints.length === 0) {
    console.warn('Could not load any street lights from data/street_lights/');
    return [];
  }
  if (allPoints.length <= maxPoints) return allPoints;
  const step = allPoints.length / maxPoints;
  const sampled: [number, number][] = [];
  for (let i = 0; i < maxPoints; i++) {
    const idx = Math.min(Math.floor(i * step), allPoints.length - 1);
    sampled.push(allPoints[idx]);
  }
  return sampled;
}
