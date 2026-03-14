import React, { useEffect, useMemo, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Circle,
  Marker,
  Popup,
  Polyline,
  useMapEvents,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import * as L from "leaflet";
import {
  ShieldAlert,
  Video,
  Lightbulb,
  Building2,
  Route,
} from "lucide-react";
import {
  cctvIcon,
  lightingIcon,
  reportIcon,
  draftIcon,
  userIcon,
  policeStationIcon,
} from "../../utils/mapIcons";
import { generateMockHeatmap } from "../../utils/mockData";
import { loadCctvLocations } from "../../utils/cctvLocations";
import { loadStreetLights } from "../../utils/streetLights";
import { loadPoliceStations } from "../../utils/policeStations";
import { loadPedestrianNetwork } from "../../utils/pedestrianNetwork";
import type { Report } from "../App";

type LatLngTuple = [number, number];

// Fix default icon path issues with standard leaflet markers (often needed in bundlers)
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

function MapEventHandler({
  onMapClick,
}: {
  onMapClick: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function FitRoute({ routePath }: { routePath: LatLngTuple[] }) {
  const map = useMap();

  useEffect(() => {
    if (routePath.length > 1) {
      map.fitBounds(routePath, { padding: [40, 40] });
    }
  }, [map, routePath]);

  return null;
}

type MapViewProps = {
  showHeatmap: boolean;
  showCCTV: boolean;
  showLighting: boolean;
  showReports: boolean;
  showNavigation: boolean;
  showPoliceStations: boolean;
  showPedestrianNetwork: boolean;
  reports: Report[];
  onMapClick: (lat: number, lng: number) => void;
  draftLocation: { lat: number; lng: number } | null;
  destination: { lat: number; lng: number } | null;
  setDestination: React.Dispatch<
    React.SetStateAction<{ lat: number; lng: number } | null>
  >;
};

export default function MapView({
  showHeatmap,
  showCCTV,
  showLighting,
  showReports,
  showPoliceStations,
  showPedestrianNetwork,
  showNavigation,
  reports,
  onMapClick,
  draftLocation,
  destination,
  setDestination,
}: MapViewProps) {
  const heatmapData = useMemo(() => generateMockHeatmap(), []);
  const [mapCenter, setMapCenter] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setMapCenter({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      () => setMapCenter({ lat: -37.8136, lng: 144.9631 }),
    );
  }, []);

  const [cctvPoints, setCctvPoints] = useState<[number, number][]>([]);
  useEffect(() => {
    loadCctvLocations().then(setCctvPoints);
  }, []);

  const [lightingPoints, setLightingPoints] = useState<[number, number][]>([]);
  useEffect(() => {
    loadStreetLights(2000).then(setLightingPoints);
  }, []);

  const [policeStations, setPoliceStations] = useState<
    Array<{ position: [number, number]; name: string }>
  >([]);
  useEffect(() => {
    loadPoliceStations().then(setPoliceStations);
  }, []);

  const [pedestrianSegments, setPedestrianSegments] = useState<
    [number, number][][]
  >([]);
  useEffect(() => {
    loadPedestrianNetwork(3000).then(setPedestrianSegments);
  }, []);

  const [fromInput, setFromInput] = useState("Current location");
  const [toInput, setToInput] = useState("");
  const [routePath, setRoutePath] = useState<LatLngTuple[]>([]);
  const [routeOrigin, setRouteOrigin] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [isFindingRoute, setIsFindingRoute] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);

  function distanceMeters(pointA: LatLngTuple, pointB: LatLngTuple) {
    const toRadians = (value: number) => (value * Math.PI) / 180;
    const earthRadius = 6371000;
    const dLat = toRadians(pointB[0] - pointA[0]);
    const dLng = toRadians(pointB[1] - pointA[1]);
    const lat1 = toRadians(pointA[0]);
    const lat2 = toRadians(pointB[0]);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);

    return 2 * earthRadius * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  function interpolatePoint(
    startPoint: LatLngTuple,
    endPoint: LatLngTuple,
    ratio: number,
  ): LatLngTuple {
    return [
      startPoint[0] + (endPoint[0] - startPoint[0]) * ratio,
      startPoint[1] + (endPoint[1] - startPoint[1]) * ratio,
    ];
  }

  function pathDistanceMeters(path: LatLngTuple[]) {
    if (path.length < 2) return 0;
    let total = 0;
    for (let i = 1; i < path.length; i++) {
      total += distanceMeters(path[i - 1], path[i]);
    }
    return total;
  }

  async function geocodePlace(
    query: string,
  ): Promise<{ lat: number; lng: number } | null> {
    const scopedQuery = `${query}, Melbourne, Victoria, Australia`;
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(scopedQuery)}`;

    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Location search failed.");
    }

    const results = (await response.json()) as Array<{
      lat: string;
      lon: string;
    }>;
    if (!results.length) return null;

    return {
      lat: Number(results[0].lat),
      lng: Number(results[0].lon),
    };
  }

  function getReportCoordinates(report: Report): LatLngTuple | null {
    const coords = report.geo_coordinates;
    if (!Array.isArray(coords) || coords.length < 2) return null;

    const lat = Number(coords[0]);
    const lng = Number(coords[1]);
    if (Number.isNaN(lat) || Number.isNaN(lng)) return null;

    return [lat, lng];
  }

  async function fetchWalkingRoute(
    start: { lat: number; lng: number },
    end: { lat: number; lng: number },
  ): Promise<LatLngTuple[]> {
    const routeUrl =
      `https://router.project-osrm.org/route/v1/foot/` +
      `${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`;

    const response = await fetch(routeUrl);
    if (!response.ok) {
      return [
        [start.lat, start.lng],
        [end.lat, end.lng],
      ];
    }

    const payload = (await response.json()) as {
      routes?: Array<{ geometry?: { coordinates?: [number, number][] } }>;
    };

    const coordinates = payload.routes?.[0]?.geometry?.coordinates;
    if (!coordinates || coordinates.length < 2) {
      return [
        [start.lat, start.lng],
        [end.lat, end.lng],
      ];
    }

    return coordinates.map(([lng, lat]) => [lat, lng] as LatLngTuple);
  }

  useEffect(() => {
    if (!showNavigation) {
      setRouteError(null);
      setIsFindingRoute(false);
      return;
    }

    if (!destination) {
      setRoutePath([]);
      setRouteError(null);
    }
  }, [showNavigation, destination]);

  useEffect(() => {
    if (!showNavigation || !destination) return;

    const start = routeOrigin ?? mapCenter;
    if (!start) return;

    let cancelled = false;

    setIsFindingRoute(true);
    setRouteError(null);

    fetchWalkingRoute(start, destination)
      .then((nextPath) => {
        if (!cancelled) {
          setRoutePath(nextPath);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setRoutePath([
            [start.lat, start.lng],
            [destination.lat, destination.lng],
          ]);
          setRouteError("Using direct route fallback right now.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsFindingRoute(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [destination, mapCenter, routeOrigin, showNavigation]);

  async function handleRouteSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!showNavigation) return;

    const fromValue = fromInput.trim();
    const toValue = toInput.trim();

    if (!toValue) {
      setRouteError("Enter a destination.");
      return;
    }

    if (!mapCenter) {
      setRouteError("Waiting for your current location.");
      return;
    }

    setRouteError(null);

    try {
      const isCurrentLocation =
        fromValue.length === 0 ||
        fromValue.toLowerCase() === "current location";

      const resolvedStart = isCurrentLocation
        ? mapCenter
        : await geocodePlace(fromValue);

      if (!resolvedStart) {
        setRouteError("Could not find the start location.");
        return;
      }

      const resolvedEnd = await geocodePlace(toValue);
      if (!resolvedEnd) {
        setRouteError("Could not find the destination.");
        return;
      }

      setRouteOrigin(resolvedStart);
      setDestination(resolvedEnd);
    } catch {
      setRouteError("Could not build route right now. Try again.");
    }
  }

  const activeRoutePath = useMemo<LatLngTuple[]>(() => {
    if (routePath.length > 1) return routePath;
    if (!showNavigation || !destination) return [];

    const start = routeOrigin ?? mapCenter;
    if (!start) return [];

    return [
      [start.lat, start.lng],
      [destination.lat, destination.lng],
    ] as LatLngTuple[];
  }, [routePath, showNavigation, destination, routeOrigin, mapCenter]);

  const navigationSummary = useMemo(() => {
    if (!showNavigation || activeRoutePath.length < 2) return null;

    const totalDistanceMeters = pathDistanceMeters(activeRoutePath);
    const samples = Math.min(
      30,
      Math.max(11, Math.floor(totalDistanceMeters / 250)),
    );
    let cctvCoverage = 0;
    let lightingCoverage = 0;
    const nearbyReportIds = new Set<string>();

    for (let i = 0; i < samples; i++) {
      const ratio = i / (samples - 1);
      const targetDistance = totalDistanceMeters * ratio;
      let coveredDistance = 0;
      let samplePoint: LatLngTuple =
        activeRoutePath[activeRoutePath.length - 1];

      for (
        let segmentIdx = 1;
        segmentIdx < activeRoutePath.length;
        segmentIdx++
      ) {
        const segmentStart = activeRoutePath[segmentIdx - 1];
        const segmentEnd = activeRoutePath[segmentIdx];
        const segmentDistance = distanceMeters(segmentStart, segmentEnd);

        if (coveredDistance + segmentDistance >= targetDistance) {
          const localRatio =
            segmentDistance === 0
              ? 0
              : (targetDistance - coveredDistance) / segmentDistance;
          samplePoint = interpolatePoint(segmentStart, segmentEnd, localRatio);
          break;
        }

        coveredDistance += segmentDistance;
      }

      const cctvNearby = cctvPoints.some(
        (point) => distanceMeters(samplePoint, point) <= 250,
      );
      const lightingNearby = lightingPoints.some(
        (point) => distanceMeters(samplePoint, point) <= 180,
      );

      if (cctvNearby) cctvCoverage += 1;
      if (lightingNearby) lightingCoverage += 1;

      reports.forEach((report) => {
        const coordinates = getReportCoordinates(report);
        if (coordinates && distanceMeters(samplePoint, coordinates) <= 250) {
          nearbyReportIds.add(report.id);
        }
      });
    }

    const cctvFactor = cctvCoverage / samples;
    const lightingFactor = lightingCoverage / samples;
    const reportPenalty = Math.min(35, nearbyReportIds.size * 8);

    const score = Math.max(
      0,
      Math.min(
        100,
        Math.round(45 + cctvFactor * 25 + lightingFactor * 25 - reportPenalty),
      ),
    );

    const estimatedMinutes = Math.max(
      1,
      Math.round((totalDistanceMeters / 1000 / 4.8) * 60),
    );
    const safetyLabel =
      score >= 75 ? "Safer" : score >= 55 ? "Moderate" : "Caution";

    return {
      score,
      safetyLabel,
      distanceKm: (totalDistanceMeters / 1000).toFixed(2),
      estimatedMinutes,
    };
  }, [showNavigation, activeRoutePath, cctvPoints, lightingPoints, reports]);

  function RecenterMap({ center }: { center: { lat: number; lng: number } }) {
    const map = useMap();

    useEffect(() => {
      if (center) {
        map.setView(center, 15);
      }
    }, [center, map]);

    return null;
  }

  return (
    <div className="w-full h-full relative z-0">
      <MapContainer
        center={mapCenter || { lat: -37.8136, lng: 144.9631 }}
        zoom={11}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />

        {mapCenter && (
          <>
            <Marker position={mapCenter} icon={userIcon} />
            <RecenterMap center={mapCenter} />
          </>
        )}
        <MapEventHandler onMapClick={onMapClick} />

        {showHeatmap &&
          heatmapData.map((region, idx) => (
            <Circle
              key={`heat-${idx}`}
              center={region.center as [number, number]}
              pathOptions={{
                color: region.color,
                fillColor: region.fillColor,
                fillOpacity: region.intensity,
                weight: 1,
              }}
              radius={region.radius}
            >
              <Popup>
                <div className="font-sans">
                  <h3 className="font-bold text-sm text-slate-800">
                    {region.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 capitalize">
                    Predicted Risk:{" "}
                    <span className="font-semibold text-slate-700">
                      {region.risk}
                    </span>
                  </p>
                </div>
              </Popup>
            </Circle>
          ))}

        {showCCTV &&
          cctvPoints.map((point, idx) => (
            <Marker key={`cctv-${idx}`} position={point} icon={cctvIcon}>
              <Popup>
                <div className="font-sans text-xs">
                  <span className="font-semibold text-blue-700 block mb-1">
                    Public CCTV Camera
                  </span>
                  <span className="text-slate-500">Active and recording.</span>
                </div>
              </Popup>
            </Marker>
          ))}

        {showLighting &&
          lightingPoints.map((point, idx) => (
            <Marker key={`light-${idx}`} position={point} icon={lightingIcon}>
              <Popup>
                <div className="font-sans text-xs">
                  <span className="font-semibold text-amber-600 block mb-1">
                    Street Lighting
                  </span>
                  <span className="text-slate-500">
                    Designated well-lit area.
                  </span>
                </div>
              </Popup>
            </Marker>
          ))}
        {showReports &&
          reports.map((report) => {
            const coordinates = getReportCoordinates(report);
            if (!coordinates) return null;

            return (
              <Marker key={report.id} position={coordinates} icon={reportIcon}>
                <Popup>
                  <div className="font-sans min-w-[200px]">
                    <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-100">
                      <ShieldAlert className="w-4 h-4 text-red-600" />
                      <h3 className="font-bold text-sm text-slate-900">
                        {report.incident_type}
                      </h3>
                    </div>
                    <p className="text-sm text-slate-600 mb-2">
                      {report.description}
                    </p>
                    <p className="text-xs text-slate-400">
                      Reported: {new Date(report.created_at).toLocaleString()}
                    </p>
                  </div>
                </Popup>
              </Marker>
            );
          })}

        {showPoliceStations &&
          policeStations.map((station, idx) => (
            <Marker
              key={`police-${idx}`}
              position={station.position}
              icon={policeStationIcon}
            >
              <Popup>
                <div className="font-sans text-xs">
                  <span className="font-semibold text-indigo-700 block mb-1">
                    Police Station
                  </span>
                  <span className="text-slate-600">{station.name}</span>
                </div>
              </Popup>
            </Marker>
          ))}

        {showPedestrianNetwork &&
          pedestrianSegments.map((segment, idx) => (
            <Polyline
              key={`pedestrian-${idx}`}
              positions={segment}
              pathOptions={{ color: "#10b981", weight: 2, opacity: 0.35 }}
            />
          ))}

        {draftLocation && (
          <Marker
            position={[draftLocation.lat, draftLocation.lng]}
            icon={draftIcon}
          />
        )}

        {showNavigation && activeRoutePath.length > 1 && (
          <>
            <Polyline
              positions={activeRoutePath}
              pathOptions={{ color: "#10b981", weight: 5, opacity: 0.85 }}
            />
            <FitRoute routePath={activeRoutePath} />
          </>
        )}

        {showNavigation && destination && (
          <Marker
            position={[destination.lat, destination.lng]}
            icon={draftIcon}
          >
            <Popup>
              <div className="font-sans text-xs">
                <span className="font-semibold text-emerald-700 block mb-1">
                  Destination
                </span>
                <span className="text-slate-500">
                  Navigation point selected.
                </span>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>

      {showNavigation && (
        <form
          onSubmit={handleRouteSubmit}
          className="absolute top-6 left-6 z-[450] bg-white p-4 rounded-xl shadow-lg border border-slate-200 w-[320px]"
        >
          <div className="flex items-center gap-2 mb-3">
            <Route className="w-4 h-4 text-emerald-600" />
            <h4 className="text-sm font-semibold text-slate-900">Find Route</h4>
          </div>

          <div className="space-y-2">
            <input
              value={fromInput}
              onChange={(event) => setFromInput(event.target.value)}
              placeholder="From (default: current location)"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <input
              value={toInput}
              onChange={(event) => setToInput(event.target.value)}
              placeholder="To (e.g. Melbourne Central)"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {routeError && (
            <p className="mt-2 text-xs text-red-600">{routeError}</p>
          )}

          <div className="mt-3 flex gap-2">
            <button
              type="submit"
              disabled={isFindingRoute}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white text-sm font-medium py-2 rounded-lg transition-colors"
            >
              {isFindingRoute ? "Finding…" : "Get Route"}
            </button>
            <button
              type="button"
              onClick={() => setFromInput("Current location")}
              className="px-3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm rounded-lg transition-colors"
            >
              Use Me
            </button>
          </div>
        </form>
      )}

      <div className="absolute bottom-6 right-6 z-[400] bg-white p-4 rounded-xl shadow-lg border border-slate-100">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
          Legend
        </h4>
        <div className="space-y-2 text-sm">
          {showHeatmap && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-violet-500 opacity-60"></div>
              <span className="text-slate-600">High Risk Area</span>
            </div>
          )}
          {showHeatmap && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-fuchsia-500 opacity-60"></div>
              <span className="text-slate-600">Medium Risk Area</span>
            </div>
          )}
          {showHeatmap && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-cyan-500 opacity-60"></div>
              <span className="text-slate-600">Low Risk Area</span>
            </div>
          )}
          {showCCTV && (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-blue-100 border border-blue-200 flex items-center justify-center">
                <Video className="w-2.5 h-2.5 text-blue-700" />
              </div>
              <span className="text-slate-600">CCTV Camera</span>
            </div>
          )}
          {showLighting && (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-amber-100 border border-amber-200 flex items-center justify-center">
                <Lightbulb className="w-2.5 h-2.5 text-amber-600" />
              </div>
              <span className="text-slate-600">Street Lighting</span>
            </div>
          )}
          {showReports && (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-red-100 border border-red-200 flex items-center justify-center">
                <ShieldAlert className="w-2.5 h-2.5 text-red-700" />
              </div>
              <span className="text-slate-600">User Report</span>
            </div>
          )}
          {showPoliceStations && (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-indigo-100 border border-indigo-200 flex items-center justify-center">
                <Building2 className="w-2.5 h-2.5 text-indigo-700" />
              </div>
              <span className="text-slate-600">Police Station</span>
            </div>
          )}
          {showPedestrianNetwork && (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-emerald-100 border border-emerald-200 flex items-center justify-center">
                <Route className="w-2.5 h-2.5 text-emerald-700" />
              </div>
              <span className="text-slate-600">Pedestrian Network</span>
            </div>
          )}
        </div>
      </div>

      {showNavigation && navigationSummary && (
        <div className="absolute top-6 right-6 z-[450] bg-white p-4 rounded-xl shadow-lg border border-emerald-100 min-w-[220px]">
          <h4 className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-2">
            Route Summary
          </h4>
          <div className="space-y-1.5 text-sm text-slate-700">
            <div className="flex items-center justify-between">
              <span>Safety Score</span>
              <span className="font-semibold">
                {navigationSummary.score}/100
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Risk Level</span>
              <span className="font-semibold">
                {navigationSummary.safetyLabel}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Distance</span>
              <span className="font-semibold">
                {navigationSummary.distanceKm} km
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>ETA (walk)</span>
              <span className="font-semibold">
                ~{navigationSummary.estimatedMinutes} min
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
