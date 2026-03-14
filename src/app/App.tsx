import React, { useState, useEffect } from 'react';
import MapView from './components/MapView';
import Sidebar from './components/layout/Sidebar';
import ReportModal from './components/ReportModal';
import { useMapState } from '../hooks/useMapState';
import { supabase } from '../lib/supabase';
import type { ReportFormValues } from '../hooks/useMapState';

export type Report = {
  id: string;
  geo_coordinates: number[];
  incident_type: string;
  description: string;
  created_at: string;
};

export default function App() {
  const {
    showHeatmap,
    showCCTV,
    showLighting,
    showReports,
    showPoliceStations,
    showPedestrianNetwork,
    setShowHeatmap,
    setShowCCTV,
    setShowLighting,
    setShowReports,
    setShowPoliceStations,
    setShowPedestrianNetwork,
    reportingLocation,
    handleMapClick,
    setReportingLocation,
  } = useMapState();

  const [reports, setReports] = useState<Report[]>([]);

  const fetchReports = async () => {
    const { data, error } = await supabase
      .from('reports')
      .select('id, geo_coordinates, incident_type, description, created_at');
    if (error) return;
    const rows = (data ?? []) as Array<{
      id: string;
      geo_coordinates: number[] | unknown;
      incident_type: string;
      description: string;
      created_at: string;
    }>;
    const normalized: Report[] = rows
      .filter((row) => {
        const coords = row.geo_coordinates;
        return Array.isArray(coords) && coords.length >= 2 && coords.every((n) => typeof n === 'number');
      })
      .map((row) => ({
        id: row.id,
        geo_coordinates: row.geo_coordinates as number[],
        incident_type: row.incident_type,
        description: row.description ?? '',
        created_at: row.created_at ?? new Date().toISOString(),
      }));
    setReports(normalized);
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const submitReport = async (data: ReportFormValues) => {
    if (!reportingLocation) return;

    const newReport = {
      geo_coordinates: [reportingLocation.lat, reportingLocation.lng],
      incident_type: data.incidentType,
      description: data.description,
    };

    const { error } = await supabase
      .from('reports')
      .insert(newReport);

    if (!error) {
      await fetchReports();
      setReportingLocation(null);
    }
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 text-slate-900 font-sans overflow-hidden">
      <Sidebar
        showHeatmap={showHeatmap}
        setShowHeatmap={setShowHeatmap}
        showCCTV={showCCTV}
        setShowCCTV={setShowCCTV}
        showLighting={showLighting}
        setShowLighting={setShowLighting}
        showReports={showReports}
        setShowReports={setShowReports}
        showPoliceStations={showPoliceStations}
        setShowPoliceStations={setShowPoliceStations}
        showPedestrianNetwork={showPedestrianNetwork}
        setShowPedestrianNetwork={setShowPedestrianNetwork}
        reports={reports}
      />

      <main className="flex-1 relative">
        <MapView
          showHeatmap={showHeatmap}
          showCCTV={showCCTV}
          showLighting={showLighting}
          showReports={showReports}
          showPoliceStations={showPoliceStations}
          showPedestrianNetwork={showPedestrianNetwork}
          reports={reports}
          onMapClick={handleMapClick}
          draftLocation={reportingLocation}
        />

        {reportingLocation && (
          <ReportModal
            reportingLocation={reportingLocation}
            onSubmit={submitReport}
            onClose={() => setReportingLocation(null)}
          />
        )}
      </main>
    </div>
  );
}
