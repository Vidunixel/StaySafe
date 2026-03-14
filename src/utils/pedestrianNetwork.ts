/**
 * Load pedestrian network segments from data/pedestrian-network.csv.
 * Geo Shape column contains GeoJSON LineString: coordinates are [lng, lat][].
 * Returns array of segments as Leaflet positions [lat, lng][].
 */
import pedestrianNetworkCsvUrl from '../../data/pedestrian-network.csv?url';

/** One segment of the pedestrian network: array of [lat, lng] for Polyline */
export type PedestrianSegment = [number, number][];

function parseLineToSegment(line: string): PedestrianSegment | null {
  const coordStart = line.indexOf('[[', line.indexOf('coordinates'));
  if (coordStart === -1) return null;
  const coordEnd = line.indexOf(']]', coordStart) + 2;
  const arrStr = line.slice(coordStart, coordEnd);
  let coords: [number, number][];
  try {
    coords = JSON.parse(arrStr) as [number, number][];
  } catch {
    return null;
  }
  if (!Array.isArray(coords) || coords.length < 2) return null;
  // GeoJSON is [lng, lat]; Leaflet wants [lat, lng]
  return coords.map(([lng, lat]) => [lat, lng]);
}

/**
 * Fetch and parse pedestrian-network.csv, return line segments for the map.
 * Samples to maxSegments when the file is large (default 3000).
 */
export async function loadPedestrianNetwork(
  maxSegments: number = 3000
): Promise<PedestrianSegment[]> {
  try {
    const res = await fetch(pedestrianNetworkCsvUrl);
    if (!res.ok) {
      console.warn('Could not load pedestrian-network.csv:', res.status);
      return [];
    }
    const text = await res.text();
    const lines = text.split(/\r?\n/).filter(Boolean);
    const segments: PedestrianSegment[] = [];
    for (let i = 1; i < lines.length; i++) {
      const segment = parseLineToSegment(lines[i]);
      if (segment) segments.push(segment);
    }
    if (segments.length <= maxSegments) return segments;
    const step = segments.length / maxSegments;
    const sampled: PedestrianSegment[] = [];
    for (let i = 0; i < maxSegments; i++) {
      const idx = Math.min(Math.floor(i * step), segments.length - 1);
      sampled.push(segments[idx]);
    }
    return sampled;
  } catch (e) {
    console.warn('Could not load pedestrian-network.csv', e);
    return [];
  }
}
