import { useState } from 'react';
import type { Report } from '../app/App';

type ReportingLocation = { lat: number; lng: number } | null;

export type ReportFormValues = {
  incidentType: string;
  description: string;
};

export function useMapState() {
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showCCTV, setShowCCTV] = useState(false);
  const [showLighting, setShowLighting] = useState(false);

  const [reports, setReports] = useState<Report[]>([]);
  const [reportingLocation, setReportingLocation] = useState<ReportingLocation>(null);

  const toggleHeatmap = () => setShowHeatmap((prev) => !prev);
  const toggleCCTV = () => setShowCCTV((prev) => !prev);
  const toggleLighting = () => setShowLighting((prev) => !prev);

  const handleMapClick = (lat: number, lng: number) => {
    setReportingLocation({ lat, lng });
  };

  const submitReport = (data: ReportFormValues) => {
    if (!reportingLocation) return;

    const newReport: Report = {
      id: Math.random().toString(36).substring(7),
      lat: reportingLocation.lat,
      lng: reportingLocation.lng,
      type: data.incidentType,
      description: data.description,
      date: new Date().toISOString(),
    };

    setReports((prev) => [...prev, newReport]);
    setReportingLocation(null);
  };

  return {
    // layer toggles
    showHeatmap,
    showCCTV,
    showLighting,
    toggleHeatmap,
    toggleCCTV,
    toggleLighting,
    setShowHeatmap,
    setShowCCTV,
    setShowLighting,

    // reporting state
    reports,
    reportingLocation,

    // actions
    handleMapClick,
    submitReport,
    setReportingLocation,
  };
}

