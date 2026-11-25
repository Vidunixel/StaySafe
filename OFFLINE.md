# StaySafe: self-hosted, offline version

Notes on the self-hosted version (branch `offline`). Started 2026-10-13.

The original app ran on Vercel with a Supabase database. Both are gone (the
Supabase address no longer resolves), so this branch makes StaySafe run entirely
on one small Ubuntu home server ("the box") with no outside services.

## Where it stands

**Running at:** port 8100 on the box, home network only (`http://<server>:8100`).

**Everything works with no internet:**
- **Crime-risk heatmap:** all 79 Victorian councils, from
  `data/crime_stats/LGA_predictions_march2026.csv` plus council boundaries
  exported from R `ozmaps` (`data/lga/vic_lga_boundaries.geojson`).
- **Street lights, CCTV, police stations, pedestrian network:** built from the
  CSVs in `data/`.
- **Community reports:** stored in SQLite on the box.
- **Basemap:** one Protomaps vector-tile file for Victoria
  (`tiles/victoria.pmtiles`, 520 MB), drawn in the browser.
- **Walking routes:** a local **OSRM** server (foot profile) built from a
  Victoria OpenStreetMap extract. Routes follow real paths.
- **Place search** (Navigation "From"/"To" boxes): a local **Nominatim**
  server imported from the same extract (about 2 hours, 2026-10-13). Searches
  cover the whole state; see "Search scope" below.
- **Leaflet marker images:** bundled into the app; they used to come from a CDN.

**Checked in a headless browser (2026-10-13, against the box):**
- first load;
- all four layer toggles: 1,685 markers, which is exactly 1,569 police
  stations + 115 CCTV sites + you;
- click-on-map walking route, which follows the Yarra trail and shows the
  route summary card;
- typed From/To search route. "Melbourne Central" suggestions come from the
  local database, and Monash University Clayton → Melbourne Central = 20.98 km,
  about 4 h 22 min on foot;
- submitting a report through the form. The test report was deleted afterwards.

## How it fits together

```
browser ──► staysafe (server/server.mjs, Node 24, no npm packages) :8100 → 8080
              ├─ /api/<dataset>   JSON built by scripts/build-data.mjs from data/
              ├─ /api/reports     SQLite at var/staysafe.sqlite (GET list, POST add)
              ├─ /api/geocode ──► staysafe-nominatim  (mediagis/nominatim:5.3.2)
              ├─ /api/route   ──► staysafe-osrm       (osrm-backend:v26.4.0, foot)
              ├─ /tiles/*         tiles/victoria.pmtiles (range requests)
              └─ everything else  the built React app (dist/)
```

- **Only port 8100 is exposed.** The browser only talks to `staysafe`.
  Nominatim and OSRM are reachable only inside the compose network
  (`GEOCODER_URL`/`OSRM_URL` in `docker-compose.yml`).
- **If either one is down,** search says it couldn't find the place and routes
  fall back to a straight line. The rest of the app keeps working.
- **On the box, besides the app files:**
  - `osm/`: `victoria.osm.pbf` (269 MB, from download.openstreetmap.fr) plus
    the OSRM files built from it (2.0 GB in total);
  - the `staysafe_nominatim-db` Docker volume: Nominatim's PostgreSQL database
    (5.1 GB).

**What changed from upstream** (branch `offline`, see `git status` and
`git diff mock`):
- `src/lib/supabase.ts` is replaced by `src/lib/api.ts`.
- `fetchAllRows` in `src/lib/dataLoader.ts` now calls the server. The loaders
  that call it are unchanged.
- `App.tsx` saves reports through the server.
- `MapView.tsx`:
  - the Protomaps basemap replaces the CARTO tiles
  - search and routing go through `/api/...`
  - marker images are bundled locally
  - a failed route is no longer cached for 24 hours
  - **search scope:** searches end in ", Victoria, Australia" instead of
    ", Melbourne, Victoria, Australia" (see below)
- New files:
  - `server/server.mjs`
  - `scripts/build-data.mjs`
  - `scripts/export_lga_boundaries.R`
  - `scripts/prepare-osm.sh`
  - `data/lga/`
  - `Dockerfile`, `.dockerignore`, `docker-compose.yml`
- Removed: the dead Supabase leftovers (`supabase/` and `utils/supabase/`,
  which held the old key).
- `package.json`:
  - `@supabase/supabase-js` removed
  - `react`/`react-dom` 18.3.1 pinned as real dependencies (upstream only
    listed them as optional peers)
  - `protomaps-leaflet` 5.1.0 added
  - new `build:data` and `start` scripts

## Running it

**On the box:**
```bash
cd StaySafe                           # this repo, branch offline
bash scripts/prepare-osm.sh          # first time only: osm/ extract + OSRM files (~5 min)
docker compose up -d --build         # staysafe + osrm + nominatim
docker compose ps
curl http://localhost:8100/api/health
```
- Reports live in `var/staysafe.sqlite`, which survives rebuilds.
- Nominatim imports on its **first** start only. A fresh import took about
  **2 hours** on the box (2026-10-13), with all 4 cores busy the whole time.
  Watch it with `docker logs -f staysafe-nominatim`.

**Refreshing map data** (OpenStreetMap changes over time; none of this is
urgent):
- **Basemap:** `~/.local/bin/pmtiles extract https://build.protomaps.com/<YYYYMMDD>.pmtiles
  tiles/victoria.pmtiles --bbox=140.96,-39.2,150.0,-33.98 --maxzoom=15`. Today's
  builds are listed at https://build-metadata.protomaps.dev/builds.json, and
  only the last few days are kept.
- **Routes:** run `bash scripts/prepare-osm.sh --refresh`, then
  `docker compose restart osrm`.
- **Search:** refresh routes first (that downloads the new `.pbf`), then
  re-import: `docker compose rm -s -f nominatim`,
  `docker volume rm staysafe_nominatim-db`, `docker compose up -d nominatim`.
  That means hours without search while it imports.

**On a dev laptop** (no search or routing unless you also run those
containers):
```bash
npm install
npm run build:data       # data/ -> server/datasets/*.json
npm run build && npm start      # http://localhost:8080
# or, for live reload: npm start in one terminal, npm run dev in another
```
For a small basemap (about 30 MB), use the `pmtiles` CLI from
https://github.com/protomaps/go-pmtiles/releases:
`pmtiles extract https://build.protomaps.com/<YYYYMMDD>.pmtiles tiles/victoria.pmtiles --bbox=144.85,-37.97,145.2,-37.75 --maxzoom=15`.

## Blockers and open work

### 1. "Current location" is always Melbourne CBD
Browsers only share your real location with **HTTPS** pages (or `localhost`),
and the app is plain `http://<server>:8100`. The app then falls back to
Melbourne CBD (`-37.8136, 144.9631`). This was built into upstream.

- **What still works:** routes start from the CBD unless you type a "From"
  place.
- **Fix:** put StaySafe behind HTTPS, e.g. a **Caddy** site block with Caddy's
  internal certificate authority (each phone/laptop has to trust it once), or
  a Tailscale HTTPS name.

### 2. RAM on the box is tight
The box has 7.7 GB of RAM, and swap was already in use before StaySafe.

- **What StaySafe adds once running:** Nominatim about 0.5 GB, OSRM 0.35 to
  1.1 GB, the app about 75 MB. 4.7 GB was still available afterwards.
- **The heavy parts are one-offs:** building OSRM peaked at 4.4 GB, and the
  Nominatim import kept the box busy for 2 hours.
- **If the box gets sluggish:** `docker compose stop nominatim` costs only
  place search (routes still work from a map click).

### 3. Not checked yet
- phone layout;
- a real (non-headless) browser on another device.

The headless runs showed no errors from the app itself. The only console
errors came from a built-in Edge extension.

### 4. The crime predictions are frozen at March 2026
The heatmap uses the team's one-off LightGBM output
(`LGA_predictions_march2026.csv`). Refreshing it means re-running the R
pipeline in `R files/`, which has its own gaps:
- `cleaning.R` reads a `street_lights.csv` that isn't in the repo;
- the newest crime spreadsheets have to be downloaded again from the Crime
  Statistics Agency (Victoria);
- `analysis.R` needs the `lightgbm` R package.

### 5. Data coverage is partial (same as the original)
- Street lights cover only Melbourne/Yarra, Casey and Ballarat.
- CCTV covers only Geelong.

More public datasets can be added as CSVs plus a few lines in
`scripts/build-data.mjs`.

### 6. The original reports are gone, and reports have no moderation
The old reports went down with the Supabase project, so the list started empty
on the box.

- **No moderation:** anyone on the home Wi-Fi can post, and there's no delete
  button. The app only shows the last 24 hours, but rows stay in the database.
- **Removing one by hand** (tested 2026-10-13):
  ```bash
  docker exec staysafe node -e "const{DatabaseSync}=require('node:sqlite');new DatabaseSync('/app/var/staysafe.sqlite').prepare('DELETE FROM reports WHERE id=?').run(process.argv[1])" <report-id>
  ```

### 7. Council boundaries are the 2018 ABS set
They're the same ones the team used, via R `ozmaps`. Moreland was renamed
Merri-bek by hand in `scripts/export_lga_boundaries.R`. Re-running that script
needs R plus `sf` and `ozmaps` (installed on the dev laptop).

### 8. Git
This work lives on branch **`offline`** of the fork `Partypants16/StaySafe`
(since 2026-11-26). The team's original is `Vidunixel/StaySafe` (branch `mock`),
kept as the `upstream` remote.

- **The box copy has no `.git`.** To update it, copy changed files over and
  `docker compose up -d --build`.

### Smaller notes
- **Search scope:** upstream added ", Melbourne, Victoria, Australia" to
  every search. Against the local database that sent "Geelong" to a road
  reserve in Laverton, "Ballarat" to a building in West Melbourne, and
  "Bendigo" to a crescent in Thomastown. Scoping to ", Victoria, Australia"
  finds the real towns and gives the same results for Melbourne places. This
  matters because the app has CCTV data for Geelong and street lights for
  Ballarat. It's `SEARCH_SCOPE` in `MapView.tsx`.
- **Search ranking:** Nominatim was imported without Wikipedia importance
  data. Rankings looked fine in testing. If famous places ever rank oddly,
  re-import with `IMPORT_WIKIPEDIA: "true"` (a one-off download).
- **Dark mode:** branch `darkswitch` isn't merged. If it is, the basemap could
  use Protomaps' `dark` flavour to match.
- **Typecheck:** `npm run typecheck` shows two errors in the upstream
  `vite.config.ts` (it needs `@types/node`). They were there before; the app
  code is clean.
- **npm warnings:** npm warns that the `esbuild` and `@tailwindcss/oxide`
  install scripts didn't run. The build works anyway.
- **README:** the upstream README says Next.js. It's actually Vite + React
  (a Figma Make export).
