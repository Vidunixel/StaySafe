// Builds the read-only datasets the map loads, from the files in data/.
// These replace the old Supabase tables (crime_stats, cctv_locations,
// police_stations, street_lights, pedestrian_network) with the same row shapes,
// so the frontend loaders didn't need to change.
//
//   node scripts/build-data.mjs [outDir]     (default: server/datasets)

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = join(root, "data");
const outDir = resolve(process.argv[2] ?? join(root, "server", "datasets"));

// RFC 4180 CSV: quoted fields, "" escapes, commas/newlines inside quotes, BOM.
function readCsv(path) {
  const text = readFileSync(path, "utf8").replace(/^﻿/, "");
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          quoted = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += ch;
    }
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  const [header, ...body] = rows.filter((r) => r.length > 1 || r[0] !== "");
  return body.map((r) => Object.fromEntries(header.map((h, i) => [h.trim(), r[i] ?? ""])));
}

const round = (n) => Math.round(Number(n) * 1e6) / 1e6;

function latLng(lat, lng) {
  const a = round(lat);
  const b = round(lng);
  return Number.isFinite(a) && Number.isFinite(b) ? [a, b] : null;
}

// "[-38.14, 144.36]" or "-38.14, 144.36" -> [-38.14, 144.36]
function parsePair(text) {
  const parts = String(text).replace(/[[\]]/g, "").split(",");
  return parts.length === 2 ? latLng(parts[0], parts[1]) : null;
}

const roundCoords = (node) =>
  typeof node === "number" ? round(node) : node.map(roundCoords);

function titleCase(text) {
  return text.toLowerCase().replace(/\b([a-z])/g, (m) => m.toUpperCase());
}

function crimeStats() {
  const geo = JSON.parse(
    readFileSync(join(dataDir, "lga", "vic_lga_boundaries.geojson"), "utf8"),
  );
  const shapes = new Map(geo.features.map((f) => [f.properties.lga, f.geometry]));
  const predictions = readCsv(join(dataDir, "crime_stats", "LGA_predictions_march2026.csv"));
  const missing = predictions.filter((p) => !shapes.has(p.LGA)).map((p) => p.LGA);
  if (missing.length) {
    throw new Error(`No boundary for LGA(s): ${missing.join(", ")}`);
  }
  return predictions.map((p, i) => {
    const shape = shapes.get(p.LGA);
    return {
      id: String(i + 1),
      local_gov_area: p.LGA,
      avg_rate_per_100k: Number(p.avg_rate_per_100k),
      // [lng, lat] nesting, as the old jsonb column stored it (see utils/geoBounds.ts)
      geo_bounds: shape.type === "Polygon" ? [shape.coordinates] : shape.coordinates,
    };
  });
}

function cctvLocations() {
  return readCsv(join(dataDir, "cctv-locations.csv"))
    .map((r) => ({ site_name: r.site_name, geo_coordinates: parsePair(r.geo_coordinates) }))
    .filter((r) => r.geo_coordinates);
}

function policeStations() {
  return readCsv(join(dataDir, "police_stations.csv"))
    .map((r) => ({
      name: titleCase(r.facility_name),
      geo_coordinates: latLng(r.facility_lat, r.facility_long),
    }))
    .filter((r) => r.geo_coordinates);
}

function streetLights() {
  // combined_coordinates.csv is what data/street_lights/combine.py made from the 3 council files.
  return readCsv(join(dataDir, "street_lights", "combined_coordinates.csv"))
    .map((r) => ({ geo_coordinates: parsePair(r.geo_coordinates) }))
    .filter((r) => r.geo_coordinates);
}

function pedestrianNetwork() {
  return readCsv(join(dataDir, "pedestrian-network.csv")).flatMap((r) => {
    const shape = JSON.parse(r["Geo Shape"]);
    if (shape.type === "LineString") {
      return [{ type: "LineString", geo_bounds: roundCoords(shape.coordinates) }];
    }
    if (shape.type === "Point") {
      const point = parsePair(r["Geo Point"]);
      return point ? [{ type: "Point", geo_coordinates: point }] : [];
    }
    return [];
  });
}

const datasets = {
  crime_stats: crimeStats,
  cctv_locations: cctvLocations,
  police_stations: policeStations,
  street_lights: streetLights,
  pedestrian_network: pedestrianNetwork,
};

mkdirSync(outDir, { recursive: true });
for (const [name, build] of Object.entries(datasets)) {
  const rows = build();
  const json = JSON.stringify(rows);
  writeFileSync(join(outDir, `${name}.json`), json);
  console.log(`${name}: ${rows.length} rows, ${(json.length / 1e6).toFixed(1)} MB`);
}
