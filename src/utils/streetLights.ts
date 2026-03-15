import { supabase } from "../lib/supabase";

type StreetLightRow = {
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
 * Fetch and sample street lighting points from Supabase street_lights table.
 */
export async function loadStreetLights(
  maxPoints: number = 2000,
): Promise<[number, number][]> {
  try {
    const { data, error } = await supabase
      .from("street_lights")
      .select("geo_coordinates")
      .not("geo_coordinates", "is", null);

    if (error) {
      console.warn("Could not load street_lights:", error.message);
      return [];
    }

    const allPoints = ((data ?? []) as StreetLightRow[])
      .map((row) => parseGeoCoordinates(row.geo_coordinates))
      .filter((point): point is [number, number] => point !== null);

    if (allPoints.length === 0) return [];
    if (allPoints.length <= maxPoints) return allPoints;

    const step = allPoints.length / maxPoints;
    const sampled: [number, number][] = [];
    for (let i = 0; i < maxPoints; i++) {
      const idx = Math.min(Math.floor(i * step), allPoints.length - 1);
      sampled.push(allPoints[idx]);
    }
    return sampled;
  } catch (e) {
    console.warn("Could not load street_lights", e);
    return [];
  }
}
