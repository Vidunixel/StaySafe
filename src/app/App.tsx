import React from "react";
import MapView from "./components/MapView";
import Sidebar from "./components/layout/Sidebar";
import ReportModal from "./components/ReportModal";
import { useMapState } from "../hooks/useMapState";

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
    showReports,
    showNavigation,
    setShowHeatmap,
    setShowCCTV,
    setShowLighting,
    setShowReports,
    setShowNavigation,
    reports,
    reportingLocation,
    destination,
    handleMapClick,
    submitReport,
    clearNavigationDestination,
    setReportingLocation,
    setDestination,
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
        showReports={showReports}
        setShowReports={setShowReports}
        showNavigation={showNavigation}
        setShowNavigation={setShowNavigation}
        destination={destination}
        clearNavigationDestination={clearNavigationDestination}
        reports={reports}
      />

      <main className="flex-1 relative">
        <MapView
          showHeatmap={showHeatmap}
          showCCTV={showCCTV}
          showLighting={showLighting}
          showReports={showReports}
          showNavigation={showNavigation}
          reports={reports}
          destination={destination}
          setDestination={setDestination}
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
