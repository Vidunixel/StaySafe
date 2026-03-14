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

  const [reportingLocation, setReportingLocation] = useState<ReportingLocation>(null);

  const toggleHeatmap = () => setShowHeatmap((prev) => !prev);
  const toggleCCTV = () => setShowCCTV((prev) => !prev);
  const toggleLighting = () => setShowLighting((prev) => !prev);
  const toggleReports = () => setShowReports((prev) => !prev);

  const handleMapClick = (lat: number, lng: number) => {
    setReportingLocation({ lat, lng });
  };

  return {
    // layer toggles
    showHeatmap,
    showCCTV,
    showLighting,
    showReports,
    toggleHeatmap,
    toggleCCTV,
    toggleLighting,
    toggleReports,
    setShowHeatmap,
    setShowCCTV,
    setShowLighting,
    setShowReports,

    // reporting state
    reportingLocation,

    // actions
    handleMapClick,
    setReportingLocation,
  };
}

