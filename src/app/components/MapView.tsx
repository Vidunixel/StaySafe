import React, { useState, useEffect } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
  useMap,
  GeoJSON,
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import * as L from 'leaflet';
import { ShieldAlert, Video, Lightbulb } from 'lucide-react';
import { cctvIcon, lightingIcon, reportIcon, draftIcon, userIcon } from '../../utils/mapIcons';
import { loadCctvLocations } from '../../utils/cctvLocations';
import { loadStreetLights } from '../../utils/streetLights';
import { useCrimeStats } from '../../hooks/useCrimeStats';
import type { Report } from '../App';

// Fix default icon path issues with standard leaflet markers (often needed in bundlers)
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Map Click Handler Component
function MapEventHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

type MapViewProps = {
  showHeatmap: boolean;
  showCCTV: boolean;
  showLighting: boolean;
  showReports: boolean;
  reports: Report[];
  onMapClick: (lat: number, lng: number) => void;
  draftLocation: {lat: number, lng: number} | null;
};

export default function MapView({ 
  showHeatmap, 
  showCCTV, 
  showLighting, 
  showReports,
  reports,
  onMapClick,
  draftLocation
}: MapViewProps) {
  const { data: crimeStats, isLoading: crimeStatsLoading, maxIncidentCount } = useCrimeStats();

  // Set user location as center on initial load
  const [mapCenter, setMapCenter] = useState<{lat: number, lng: number} | null>(null);

  // Get user location on mount
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setMapCenter({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      () => setMapCenter({ lat: -37.8136, lng: 144.9631 }) // fallback: Melbourne
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

  function RecenterMap({ center }: { center: { lat: number; lng: number } }) {
    const map = useMap();

    useEffect(() => {
      if (center) {
        console.log("Recentering map to:", center);
        map.setView(center, 15); // zoom 15
      }
    }, [center]);

    return null;
  }

  return (
    <div className="w-full h-full relative z-0">
      <MapContainer 
        center={mapCenter || { lat: -37.8136, lng: 144.9631 }} // fallback to Melb Center if not loaded yet
        zoom={11}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        
        {/* Recenter dynamically when user location is ready */}
        {mapCenter && (
          <>
            <Marker position={mapCenter} icon={userIcon} />
            <RecenterMap center={mapCenter} />
          </>
        )}
        <MapEventHandler onMapClick={onMapClick} />

        {/* Crime stats heatmap (GeoJSON polygons by LGA) */}
        {showHeatmap &&
          !crimeStatsLoading &&
          crimeStats.map((stat) => {
            const intensity =
              maxIncidentCount > 0 ? stat.incident_count / maxIncidentCount : 0;
            const hue = 120 * (1 - intensity);
            const fillColor = `hsl(${hue}, 70%, 45%)`;
            const fillOpacity = 0.2 + intensity * 0.6;
            const g = stat.geojson as {
              geometry?: { coordinates?: unknown };
              features?: Array<{ geometry?: { coordinates?: unknown } }>;
            };
            const coords =
              g.geometry?.coordinates ?? g.features?.[0]?.geometry?.coordinates ?? '';
            const geoKey = `${stat.id}-${JSON.stringify(coords)}`;

            return (
              <GeoJSON
                key={geoKey}
                data={stat.geojson}
                style={() => ({
                  color: '#1e293b',
                  weight: 1,
                  fillColor,
                  fillOpacity,
                })}
                onEachFeature={(_feature, layer) => {
                  layer.bindPopup(
                    `<div class="font-sans min-w-[140px]">
                      <h3 class="font-bold text-sm text-slate-800">${stat.local_gov_area}</h3>
                      <p class="text-xs text-slate-500 mt-1">Incident count: <span class="font-semibold text-slate-700">${stat.incident_count}</span></p>
                    </div>`
                  );
                }}
              />
            );
          })}

        {/* CCTV Layer */}
        {showCCTV && cctvPoints.map((point, idx) => (
          <Marker 
            key={`cctv-${idx}`} 
            position={point} 
            icon={cctvIcon}
          >
            <Popup>
              <div className="font-sans text-xs">
                <span className="font-semibold text-blue-700 block mb-1">Public CCTV Camera</span>
                <span className="text-slate-500">Active and recording.</span>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Lighting Layer */}
        {showLighting && lightingPoints.map((point, idx) => (
          <Marker 
            key={`light-${idx}`} 
            position={point} 
            icon={lightingIcon}
          >
             <Popup>
              <div className="font-sans text-xs">
                <span className="font-semibold text-amber-600 block mb-1">Street Lighting</span>
                <span className="text-slate-500">Designated well-lit area.</span>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* User Reports Layer - geo_coordinates is [lat, lng] (array of floats) */}
        {showReports && reports.map((report) => {
          const coords = report.geo_coordinates;
          if (!Array.isArray(coords) || coords.length < 2) return null;
          const lat = Number(coords[0]);
          const lng = Number(coords[1]);
          if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
          return (
            <Marker
              key={report.id}
              position={[lat, lng]}
              icon={reportIcon}
            >
              <Popup>
                <div className="font-sans min-w-[200px]">
                  <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-100">
                    <ShieldAlert className="w-4 h-4 text-red-600" />
                    <h3 className="font-bold text-sm text-slate-900">{report.incident_type}</h3>
                  </div>
                  <p className="text-sm text-slate-600 mb-2">{report.description}</p>
                  <p className="text-xs text-slate-400">
                    Reported: {new Date(report.created_at).toLocaleString()}
                  </p>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Draft Location Marker */}
        {draftLocation && (
          <Marker 
            position={[draftLocation.lat, draftLocation.lng]} 
            icon={draftIcon}
          />
        )}
      </MapContainer>
      
      {/* Custom Map Overlay UI for legends/controls if needed */}
      <div className="absolute bottom-6 right-6 z-[400] bg-white p-4 rounded-xl shadow-lg border border-slate-100">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Legend</h4>
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
        </div>
      </div>
    </div>
  );
}