import { supabase } from "../lib/supabase";

export type PedestrianSegment = [number, number][];
export type PedestrianPoint = [number, number];
export type PedestrianNetworkData = {
  segments: PedestrianSegment[];
  points: PedestrianPoint[];
};

type PedestrianRow = {
  type?: unknown;
  geo_bounds: unknown;
  geo_coordinates?: unknown;
};

function parseCoordPair(value: unknown): [number, number] | null {
  if (!Array.isArray(value) || value.length < 2) return null;
  const a = Number(value[0]);
  const b = Number(value[1]);
  if (Number.isNaN(a) || Number.isNaN(b)) return null;
  return [a, b];
}

function toLatLng(pair: [number, number]): [number, number] {
  const [a, b] = pair;
  // Most geo arrays here are [lng, lat], but fallback for [lat, lng].
  if (Math.abs(a) > 90 && Math.abs(b) <= 90) return [b, a];
  return [a, b];
}

function extractSegments(node: unknown): PedestrianSegment[] {
  if (!Array.isArray(node) || node.length === 0) return [];

  const pairs = node.map(parseCoordPair);
  if (pairs.every((pair) => pair !== null)) {
    const segment = pairs.map((pair) => toLatLng(pair as [number, number]));
    return segment.length >= 2 ? [segment] : [];
  }

  return node.flatMap((child) => extractSegments(child));
}

/**
 * Fetch and parse pedestrian network segments from Supabase.
 */
export async function loadPedestrianNetwork(
  maxSegments: number = 3000,
): Promise<PedestrianNetworkData> {
  try {
    const { data, error } = await supabase
      .from("pedestrian_network")
      .select("type, geo_bounds, geo_coordinates");

    if (error) {
      console.warn("Could not load pedestrian_network:", error.message);
      return { segments: [], points: [] };
    }

    const rows = (data ?? []) as PedestrianRow[];
    const points: PedestrianPoint[] = [];
    const allSegments: PedestrianSegment[] = [];

    for (const row of rows) {
      const rowType = String(row.type ?? "").toLowerCase();

      if (rowType === "point") {
        const pair = parseCoordPair(row.geo_coordinates);
        if (pair) {
          points.push(toLatLng(pair));
        }
        continue;
      }

      if (rowType === "linestring") {
        allSegments.push(...extractSegments(row.geo_bounds));
        continue;
      }

      // Fallback for rows without a trusted type.
      if (row.geo_bounds != null) {
        allSegments.push(...extractSegments(row.geo_bounds));
      }
      if (row.geo_coordinates != null) {
        const pair = parseCoordPair(row.geo_coordinates);
        if (pair) {
          points.push(toLatLng(pair));
        }
      }
    }

    const segments = allSegments;
    if (segments.length <= maxSegments) return { segments, points };
    const step = segments.length / maxSegments;
    const sampled: PedestrianSegment[] = [];
    for (let i = 0; i < maxSegments; i++) {
      const idx = Math.min(Math.floor(i * step), segments.length - 1);
      sampled.push(segments[idx]);
    }
    return { segments: sampled, points };
  } catch (e) {
    console.warn("Could not load pedestrian_network", e);
    return { segments: [], points: [] };
  }
}
