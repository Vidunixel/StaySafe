import { useState } from 'react';

type ReportingLocation = { lat: number; lng: number } | null;

export type ReportFormValues = {
  incidentType: string;
  description: string;
};

export function useMapState() {
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showCCTV, setShowCCTV] = useState(false);
  const [showLighting, setShowLighting] = useState(false);
  const [showReports, setShowReports] = useState(true);
  const [showPoliceStations, setShowPoliceStations] = useState(false);
  const [showPedestrianNetwork, setShowPedestrianNetwork] = useState(false);

  const [reportingLocation, setReportingLocation] = useState<ReportingLocation>(null);

  const toggleHeatmap = () => setShowHeatmap((prev) => !prev);
  const toggleCCTV = () => setShowCCTV((prev) => !prev);
  const toggleLighting = () => setShowLighting((prev) => !prev);
  const toggleReports = () => setShowReports((prev) => !prev);
  const togglePoliceStations = () => setShowPoliceStations((prev) => !prev);
  const togglePedestrianNetwork = () => setShowPedestrianNetwork((prev) => !prev);

  const handleMapClick = (lat: number, lng: number) => {
    setReportingLocation({ lat, lng });
  };

  return {
    // layer toggles
    showHeatmap,
    showCCTV,
    showLighting,
    showReports,
    showPoliceStations,
    showPedestrianNetwork,
    toggleHeatmap,
    toggleCCTV,
    toggleLighting,
    toggleReports,
    togglePoliceStations,
    togglePedestrianNetwork,
    setShowHeatmap,
    setShowCCTV,
    setShowLighting,
    setShowReports,
    setShowPoliceStations,
    setShowPedestrianNetwork,

    // reporting state
    reportingLocation,

    // actions
    handleMapClick,
    setReportingLocation,
  };
}

