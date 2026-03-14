import React, { useMemo } from 'react';
import {
  MapContainer,
  TileLayer,
  Circle,
  Marker,
  Popup,
  useMapEvents,
  useMap,
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { User } from "lucide-react";
import * as L from 'leaflet';
import { ShieldAlert, Video, Lightbulb, MapPin } from 'lucide-react';
import { cctvIcon, lightingIcon, reportIcon, draftIcon, userIcon } from '../../utils/mapIcons';
import { generateMockHeatmap, generateRandomPoints } from '../../utils/mockData';
import { useEffect, useState } from "react";



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
  reports: Array<{id: string, lat: number, lng: number, type: string, description: string}>;
  onMapClick: (lat: number, lng: number) => void;
  draftLocation: {lat: number, lng: number} | null;
};

export default function MapView({ 
  showHeatmap, 
  showCCTV, 
  showLighting, 
  reports,
  onMapClick,
  draftLocation
}: MapViewProps) {
  
  // Memoize mock data so it doesn't regenerate on every render
  const heatmapData = useMemo(() => generateMockHeatmap(), []);

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

  const cctvPoints = useMemo(() => {
    // Generate some clusters around major areas
    const melbourne = generateRandomPoints([-37.8136, 144.9631], 5, 40);
    const dandenong = generateRandomPoints([-37.9810, 145.2150], 3, 15);
    const geelong = generateRandomPoints([-38.1499, 144.3617], 4, 20);
    return [...melbourne, ...dandenong, ...geelong];
  }, []);

  const lightingPoints = useMemo(() => {
    // Generate more widespread lighting points
    const melbourneWide = generateRandomPoints([-37.8136, 144.9631], 15, 100);
    const geelongWide = generateRandomPoints([-38.1499, 144.3617], 8, 30);
    return [...melbourneWide, ...geelongWide];
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

        {/* Heatmap Layer (Simulated with Circles) */}
        {showHeatmap && heatmapData.map((region, idx) => (
          <Circle
            key={`heat-${idx}`}
            center={region.center as [number, number]}
            pathOptions={{ 
              color: region.color, 
              fillColor: region.fillColor, 
              fillOpacity: region.intensity,
              weight: 1
            }}
            radius={region.radius}
          >
            <Popup>
              <div className="font-sans">
                <h3 className="font-bold text-sm text-slate-800">{region.name}</h3>
                <p className="text-xs text-slate-500 mt-1 capitalize">Predicted Risk: <span className="font-semibold text-slate-700">{region.risk}</span></p>
              </div>
            </Popup>
          </Circle>
        ))}

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

        {/* User Reports Layer */}
        {reports.map((report) => (
          <Marker 
            key={report.id} 
            position={[report.lat, report.lng]} 
            icon={reportIcon}
          >
            <Popup>
              <div className="font-sans min-w-[200px]">
                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-100">
                  <ShieldAlert className="w-4 h-4 text-red-600" />
                  <h3 className="font-bold text-sm text-slate-900">{report.type}</h3>
                </div>
                <p className="text-sm text-slate-600 mb-2">{report.description}</p>
                <p className="text-xs text-slate-400">
                  Reported: {new Date(report.date).toLocaleDateString()}
                </p>
              </div>
            </Popup>
          </Marker>
        ))}

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
              <div className="w-3 h-3 rounded-full bg-red-500 opacity-60"></div>
              <span className="text-slate-600">High Risk Area</span>
            </div>
          )}
          {showHeatmap && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-500 opacity-60"></div>
              <span className="text-slate-600">Medium Risk Area</span>
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
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-100 border border-red-200 flex items-center justify-center">
              <ShieldAlert className="w-2.5 h-2.5 text-red-700" />
            </div>
            <span className="text-slate-600">User Report</span>
          </div>
        </div>
      </div>
    </div>
  );
}