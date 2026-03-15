import React, { useEffect, useRef, useState } from "react";
import MapView from "./components/MapView";
import Sidebar from "./components/layout/Sidebar";
import ReportModal from "./components/ReportModal";
import { useMapState, type ReportFormValues } from "../hooks/useMapState";
import { supabase } from "../lib/supabase";
import { Button } from "./components/ui/button";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Map as LeafletMap } from 'leaflet';

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
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const mapRef = useRef<LeafletMap | null>(null);  
  
  const zoomToLocation = (lat: number, lng: number) => {
    if (!mapRef.current) {
      console.log("mapRef is null");
      return;
    }
    console.log("Zooming map to:", lat, lng);
    mapRef.current.flyTo([lat, lng], 15, { duration: 0.8 });
  };

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
      {/* Always-visible sidebar toggle button */}
      <Button
        variant="outline"
        size="icon"
        className="fixed left-0 top-1/2 z-30 -translate-y-1/2 h-10 w-8 rounded-r-lg rounded-l-none border-l-0 shadow-md bg-white hover:bg-slate-50 transition-[left] duration-300 ease-in-out"
        style={{ left: sidebarOpen ? "20rem" : 0 }}
        onClick={() => setSidebarOpen((open) => !open)}
        aria-label={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
      >
        {sidebarOpen ? (
          <PanelLeftClose className="h-5 w-5" />
        ) : (
          <PanelLeftOpen className="h-5 w-5" />
        )}
      </Button>

      {/* Sidebar wrapper: animated width so main content resizes smoothly */}
      <div
        className="flex shrink-0 overflow-hidden transition-[width] duration-300 ease-in-out"
        style={{ width: sidebarOpen ? "20rem" : 0 }}
      >
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
          onReportClick={zoomToLocation}
        />
      </div>

      <main
        className="min-h-0 h-full relative overflow-hidden"
        style={{
          flex: "1 1 0%",
          minWidth: 0,
          width: sidebarOpen ? undefined : "100%",
        }}
      >
        <MapView
          sidebarOpen={sidebarOpen}
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
          mapRef={mapRef}
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
