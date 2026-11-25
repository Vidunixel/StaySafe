// StaySafe self-hosted server. Replaces the old Supabase project:
//   GET  /api/<dataset>   read-only datasets built by scripts/build-data.mjs
//   GET  /api/reports     community incident reports (SQLite)
//   POST /api/reports     add a report
//   GET  /api/geocode     place search, forwarded to GEOCODER_URL (Nominatim API)
//   GET  /api/route       walking route, forwarded to OSRM_URL (OSRM API)
//   GET  /tiles/*         basemap files from TILES_DIR (victoria.pmtiles)
//   everything else       the built frontend in dist/
// Static files support HTTP range requests, which PMTiles needs.
//
// No npm dependencies: node:http + node:sqlite (Node 24+).

import { createServer } from "node:http";
import { createReadStream, existsSync, mkdirSync, readFileSync, statSync } from "node:fs";
import { dirname, extname, join, normalize, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import { gzipSync } from "node:zlib";
import { DatabaseSync } from "node:sqlite";

const here = dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT ?? 8080);
const STATIC_DIR = resolve(process.env.STATIC_DIR ?? join(here, "..", "dist"));
const DATASET_DIR = resolve(process.env.DATASET_DIR ?? join(here, "datasets"));
const TILES_DIR = resolve(process.env.TILES_DIR ?? join(here, "..", "tiles"));
const DB_PATH = resolve(process.env.DB_PATH ?? join(here, "..", "var", "staysafe.sqlite"));
// Empty = feature off. Point these at local Nominatim/OSRM containers once they exist.
const GEOCODER_URL = (process.env.GEOCODER_URL ?? "").replace(/\/+$/, "");
const OSRM_URL = (process.env.OSRM_URL ?? "").replace(/\/+$/, "");

const DATASETS = [
  "crime_stats",
  "cctv_locations",
  "police_stations",
  "street_lights",
  "pedestrian_network",
];

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".pmtiles": "application/octet-stream",
};

// --- datasets: loaded once, kept gzipped in memory ---
const datasets = new Map();
for (const name of DATASETS) {
  const raw = readFileSync(join(DATASET_DIR, `${name}.json`));
  datasets.set(name, { raw, gzip: gzipSync(raw) });
}

// --- reports ---
mkdirSync(dirname(DB_PATH), { recursive: true });
const db = new DatabaseSync(DB_PATH);
db.exec(`
  CREATE TABLE IF NOT EXISTS reports (
    id            TEXT PRIMARY KEY,
    lat           REAL NOT NULL,
    lng           REAL NOT NULL,
    incident_type TEXT NOT NULL,
    description   TEXT NOT NULL DEFAULT '',
    created_at    TEXT NOT NULL
  )
`);
const listReports = db.prepare(
  "SELECT id, lat, lng, incident_type, description, created_at FROM reports ORDER BY created_at DESC",
);
const insertReport = db.prepare(
  "INSERT INTO reports (id, lat, lng, incident_type, description, created_at) VALUES (?, ?, ?, ?, ?, ?)",
);
const toApi = (r) => ({
  id: r.id,
  geo_coordinates: [r.lat, r.lng],
  incident_type: r.incident_type,
  description: r.description,
  created_at: r.created_at,
});

// --- helpers ---
function sendJson(req, res, status, body) {
  const raw = Buffer.from(JSON.stringify(body));
  res.writeHead(status, { "Content-Type": MIME[".json"], "Cache-Control": "no-store" });
  res.end(req.method === "HEAD" ? undefined : raw);
}

function readBody(req, limit = 16 * 1024) {
  return new Promise((resolveBody, reject) => {
    let size = 0;
    const chunks = [];
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > limit) {
        reject(Object.assign(new Error("Body too large"), { status: 413 }));
        req.destroy();
      } else {
        chunks.push(chunk);
      }
    });
    req.on("end", () => resolveBody(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

async function forward(req, res, url) {
  try {
    const upstream = await fetch(url, {
      headers: { Accept: "application/json", "User-Agent": "StaySafe-selfhost/1.0" },
      signal: AbortSignal.timeout(15000),
    });
    const body = Buffer.from(await upstream.arrayBuffer());
    res.writeHead(upstream.status, { "Content-Type": MIME[".json"] });
    res.end(body);
  } catch (err) {
    sendJson(req, res, 502, { error: `Upstream failed: ${err.message}` });
  }
}

function serveStatic(req, res, pathname, baseDir, spaFallback) {
  let decoded;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    res.writeHead(400).end();
    return;
  }
  let file = normalize(join(baseDir, decoded));
  if (file !== baseDir && !file.startsWith(baseDir + sep)) {
    res.writeHead(403).end();
    return;
  }
  if (!existsSync(file) || statSync(file).isDirectory()) {
    if (!spaFallback) {
      res.writeHead(404).end();
      return;
    }
    file = join(baseDir, "index.html");
  }
  const { size } = statSync(file);
  const type = MIME[extname(file)] ?? "application/octet-stream";
  const cache = pathname.startsWith("/assets/")
    ? "public, max-age=31536000, immutable"
    : "no-cache";
  const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range ?? "");
  if (range) {
    // Needed for PMTiles map tiles, which read slices of one big file.
    const start = range[1] === "" ? size - Number(range[2]) : Number(range[1]);
    const end = range[1] !== "" && range[2] !== "" ? Math.min(Number(range[2]), size - 1) : size - 1;
    if (start < 0 || start > end || start >= size) {
      res.writeHead(416, { "Content-Range": `bytes */${size}` }).end();
      return;
    }
    res.writeHead(206, {
      "Content-Type": type,
      "Content-Length": end - start + 1,
      "Content-Range": `bytes ${start}-${end}/${size}`,
      "Accept-Ranges": "bytes",
      "Cache-Control": cache,
    });
    if (req.method === "HEAD") return res.end();
    createReadStream(file, { start, end }).pipe(res);
    return;
  }
  res.writeHead(200, {
    "Content-Type": type,
    "Content-Length": size,
    "Accept-Ranges": "bytes",
    "Cache-Control": cache,
  });
  if (req.method === "HEAD") return res.end();
  createReadStream(file).pipe(res);
}

// --- routes ---
async function handleApi(req, res, url) {
  const name = url.pathname.slice("/api/".length);

  if (name === "health") {
    return sendJson(req, res, 200, {
      ok: true,
      geocoder: Boolean(GEOCODER_URL),
      routing: Boolean(OSRM_URL),
    });
  }

  if (datasets.has(name) && (req.method === "GET" || req.method === "HEAD")) {
    const { raw, gzip } = datasets.get(name);
    const useGzip = /\bgzip\b/.test(req.headers["accept-encoding"] ?? "");
    const body = useGzip ? gzip : raw;
    res.writeHead(200, {
      "Content-Type": MIME[".json"],
      "Content-Length": body.length,
      "Cache-Control": "no-cache",
      Vary: "Accept-Encoding",
      ...(useGzip ? { "Content-Encoding": "gzip" } : {}),
    });
    return res.end(req.method === "HEAD" ? undefined : body);
  }

  if (name === "reports" && req.method === "GET") {
    return sendJson(req, res, 200, listReports.all().map(toApi));
  }

  if (name === "reports" && req.method === "POST") {
    let input;
    try {
      input = JSON.parse(await readBody(req));
    } catch (err) {
      return sendJson(req, res, err.status ?? 400, { error: err.status ? err.message : "Invalid JSON" });
    }
    const [lat, lng] = Array.isArray(input?.geo_coordinates) ? input.geo_coordinates.map(Number) : [];
    const type = typeof input?.incident_type === "string" ? input.incident_type.trim() : "";
    const description = typeof input?.description === "string" ? input.description.trim() : "";
    if (!(Math.abs(lat) <= 90 && Math.abs(lng) <= 180)) {
      return sendJson(req, res, 400, { error: "geo_coordinates must be [lat, lng]" });
    }
    if (!type || type.length > 64 || description.length > 2000) {
      return sendJson(req, res, 400, { error: "incident_type (1-64 chars) and description (max 2000) required" });
    }
    const row = { id: randomUUID(), lat, lng, incident_type: type, description, created_at: new Date().toISOString() };
    insertReport.run(row.id, row.lat, row.lng, row.incident_type, row.description, row.created_at);
    return sendJson(req, res, 201, toApi(row));
  }

  if (name === "geocode" && req.method === "GET") {
    if (!GEOCODER_URL) return sendJson(req, res, 503, { error: "Place search is not set up yet (GEOCODER_URL)" });
    const q = url.searchParams.get("q") ?? "";
    const limit = Math.min(Number(url.searchParams.get("limit") ?? 5) || 5, 10);
    return forward(req, res, `${GEOCODER_URL}/search?format=json&limit=${limit}&q=${encodeURIComponent(q)}`);
  }

  if (name === "route" && req.method === "GET") {
    if (!OSRM_URL) return sendJson(req, res, 503, { error: "Routing is not set up yet (OSRM_URL)" });
    const coords = url.searchParams.get("coords") ?? "";
    if (!/^-?\d+(\.\d+)?,-?\d+(\.\d+)?;-?\d+(\.\d+)?,-?\d+(\.\d+)?$/.test(coords)) {
      return sendJson(req, res, 400, { error: "coords must be lng,lat;lng,lat" });
    }
    return forward(req, res, `${OSRM_URL}/route/v1/foot/${coords}?overview=full&geometries=geojson`);
  }

  return sendJson(req, res, 404, { error: "Not found" });
}

createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://localhost");
    if (url.pathname.startsWith("/api/")) return await handleApi(req, res, url);
    if (req.method !== "GET" && req.method !== "HEAD") return res.writeHead(405).end();
    if (url.pathname.startsWith("/tiles/")) {
      return serveStatic(req, res, url.pathname.slice("/tiles".length), TILES_DIR, false);
    }
    return serveStatic(req, res, url.pathname, STATIC_DIR, true);
  } catch (err) {
    console.error(err);
    if (!res.headersSent) sendJson(req, res, 500, { error: "Server error" });
    else res.end();
  }
}).listen(PORT, () => {
  console.log(`StaySafe on :${PORT} (geocoder ${GEOCODER_URL || "off"}, routing ${OSRM_URL || "off"})`);
});
