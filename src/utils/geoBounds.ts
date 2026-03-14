import type { LatLngExpression } from "leaflet";

type CoordPair = [number, number];

function isCoordPair(value: unknown): value is CoordPair {
  return (
    Array.isArray(value) &&
    value.length >= 2 &&
    typeof value[0] === "number" &&
    typeof value[1] === "number"
  );
}

/**
 * Converts a GeoJSON-like coordinate array (typically [lng, lat]) into Leaflet-compatible
 * polygon positions (typically [lat, lng]), preserving the original nesting shape.
 *
 * Supports Polygon and MultiPolygon-style nesting:
 * - Polygon:        [ [ [lng,lat], ... ] , ...? ]
 * - MultiPolygon:   [ [ [ [lng,lat], ... ] ] , ... ]
 */
export function geoBoundsToLatLngs(geoBounds: unknown): LatLngExpression[] | LatLngExpression[][] | LatLngExpression[][][] | null {
  if (!Array.isArray(geoBounds)) return null;

  const convert = (node: unknown): any => {
    if (isCoordPair(node)) {
      const [lng, lat] = node;
      return [lat, lng] as LatLngExpression;
    }
    if (Array.isArray(node)) return node.map(convert);
    return null;
  };

  const converted = convert(geoBounds);
  return converted;
}

