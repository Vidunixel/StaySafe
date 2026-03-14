import React, { useEffect, useState } from "react";
import MapView from "./components/MapView";
import Sidebar from "./components/layout/Sidebar";
import ReportModal from "./components/ReportModal";
import { useMapState, type ReportFormValues } from "../hooks/useMapState";
import { supabase } from "../lib/supabase";

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
    showNavigation,
    showPoliceStations,
    showPedestrianNetwork,
    setShowHeatmap,
    setShowCCTV,
    setShowLighting,
    setShowReports,
    setShowNavigation,
    setShowPoliceStations,
    setShowPedestrianNetwork,
    reportingLocation,
    destination,
    handleMapClick,
    clearNavigationDestination,
    setReportingLocation,
    setDestination,
  } = useMapState();

  const [reports, setReports] = useState<Report[]>([]);

  const fetchReports = async () => {
    const { data, error } = await supabase
      .from("reports")
      .select("id, geo_coordinates, incident_type, description, created_at");
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
        return (
          Array.isArray(coords) &&
          coords.length >= 2 &&
          coords.every((value) => typeof value === "number")
        );
      })
      .map((row) => ({
        id: row.id,
        geo_coordinates: row.geo_coordinates as number[],
        incident_type: row.incident_type,
        description: row.description ?? "",
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

    const { error } = await supabase.from("reports").insert(newReport);

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
        showNavigation={showNavigation}
        setShowNavigation={setShowNavigation}
        destination={destination}
        clearNavigationDestination={clearNavigationDestination}
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
          showNavigation={showNavigation}
          showPoliceStations={showPoliceStations}
          showPedestrianNetwork={showPedestrianNetwork}
          reports={reports}
          destination={destination}
          setDestination={setDestination}
          onMapClick={handleMapClick}
          draftLocation={reportingLocation}
        />

        {reportingLocation && (
          <ReportModal
            reportingLocation={reportingLocation}
            onSubmit={(data) => {
              void submitReport(data);
            }}
            onClose={() => setReportingLocation(null)}
          />
        )}
      </main>
    </div>
  );
}
