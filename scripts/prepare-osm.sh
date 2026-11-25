#!/usr/bin/env bash
# Prepares offline walking routes (OSRM) from a Victoria OpenStreetMap extract.
# Run on the box from the repo root:  bash scripts/prepare-osm.sh [--refresh]
#
#   1. downloads osm/victoria.osm.pbf (skipped if present, unless --refresh)
#   2. builds the OSRM foot-profile files next to it (osm/victoria.osrm.*)
#
# Then `docker compose up -d` starts osrm and nominatim. Nominatim imports the
# same .pbf on its first start (hours); see OFFLINE.md for refreshing it.
set -euo pipefail
cd "$(dirname "$0")/.."

OSRM_IMAGE=ghcr.io/project-osrm/osrm-backend:v26.4.0
PBF_URL=https://download.openstreetmap.fr/extracts/oceania/australia/victoria-latest.osm.pbf

mkdir -p osm
if [ ! -f osm/victoria.osm.pbf ] || [ "${1:-}" = "--refresh" ]; then
  curl -fL -o osm/victoria.osm.pbf.part "$PBF_URL"
  mv osm/victoria.osm.pbf.part osm/victoria.osm.pbf
fi

run_osrm() {
  docker run --rm -v "$PWD/osm:/data" "$OSRM_IMAGE" "$@"
}
run_osrm osrm-extract -p /opt/foot.lua /data/victoria.osm.pbf
run_osrm osrm-partition /data/victoria.osrm
run_osrm osrm-customize /data/victoria.osrm
echo "OSRM data ready in osm/"
