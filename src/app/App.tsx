import React from 'react';
import MapView from './components/MapView';
import Sidebar from './components/layout/Sidebar';
import ReportModal from './components/ReportModal';
import { useMapState } from '../hooks/useMapState';

export type Report = {
  id: string;
  lat: number;
  lng: number;
  type: string;
  description: string;
  date: string;
};

export default function App() {
  const {
    showHeatmap,
    showCCTV,
    showLighting,
    setShowHeatmap,
    setShowCCTV,
    setShowLighting,
    reports,
    reportingLocation,
    handleMapClick,
    submitReport,
    setReportingLocation,
  } = useMapState();

  return (
    <div className="flex h-screen w-full bg-slate-50 text-slate-900 font-sans overflow-hidden">
      <Sidebar
        showHeatmap={showHeatmap}
        setShowHeatmap={setShowHeatmap}
        showCCTV={showCCTV}
        setShowCCTV={setShowCCTV}
        showLighting={showLighting}
        setShowLighting={setShowLighting}
        reports={reports}
      />

      <main className="flex-1 relative">
        <MapView
          showHeatmap={showHeatmap}
          showCCTV={showCCTV}
          showLighting={showLighting}
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