import { useEffect, useState } from "react";

type ReportingLocation = { lat: number; lng: number } | null;
type DestinationLocation = { lat: number; lng: number } | null;

type Report = {
  id: string;
  lat: number;
  lng: number;
  type: string;
  description: string;
  date: string;
};

export type ReportFormValues = {
  incidentType: string;
  description: string;
};

function createReportId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function useMapState() {
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showCCTV, setShowCCTV] = useState(false);
  const [showLighting, setShowLighting] = useState(false);
  const [showReports, setShowReports] = useState(true);
  const [showNavigation, setShowNavigation] = useState(false);
  const [showPoliceStations, setShowPoliceStations] = useState(false);
  const [showPedestrianNetwork, setShowPedestrianNetwork] = useState(false);

  const [reportingLocation, setReportingLocation] =
    useState<ReportingLocation>(null);
  const [destination, setDestination] = useState<DestinationLocation>(null);
  const [reports, setReports] = useState<Report[]>([]);

  useEffect(() => {
    if (showNavigation) {
      setReportingLocation(null);
    }
  }, [showNavigation]);

  const toggleHeatmap = () => setShowHeatmap((prev) => !prev);
  const toggleCCTV = () => setShowCCTV((prev) => !prev);
  const toggleLighting = () => setShowLighting((prev) => !prev);
  const toggleReports = () => setShowReports((prev) => !prev);
  const toggleNavigation = () => {
    setShowNavigation((prev) => {
      const nextValue = !prev;
      if (nextValue) {
        setReportingLocation(null);
      }
      return nextValue;
    });
  };
  const togglePoliceStations = () => setShowPoliceStations((prev) => !prev);
  const togglePedestrianNetwork = () =>
    setShowPedestrianNetwork((prev) => !prev);

  const handleMapClick = (lat: number, lng: number) => {
    if (showNavigation) {
      setDestination({ lat, lng });
      return;
    }
    setReportingLocation({ lat, lng });
  };

  const submitReport = (data: ReportFormValues) => {
    if (!reportingLocation) return;

    const report: Report = {
      id: createReportId(),
      lat: reportingLocation.lat,
      lng: reportingLocation.lng,
      type: data.incidentType,
      description: data.description,
      date: new Date().toISOString(),
    };

    setReports((prev) => [...prev, report]);
    setReportingLocation(null);
  };

  const clearNavigationDestination = () => {
    setDestination(null);
  };

  return {
    // layer toggles
    showHeatmap,
    showCCTV,
    showLighting,
    showReports,
    showNavigation,
    showPoliceStations,
    showPedestrianNetwork,
    toggleHeatmap,
    toggleCCTV,
    toggleLighting,
    toggleReports,
    toggleNavigation,
    togglePoliceStations,
    togglePedestrianNetwork,
    setShowHeatmap,
    setShowCCTV,
    setShowLighting,
    setShowReports,
    setShowNavigation,
    setShowPoliceStations,
    setShowPedestrianNetwork,

    // reporting state
    reportingLocation,
    reports,
    destination,

    // actions
    handleMapClick,
    submitReport,
    clearNavigationDestination,
    setReportingLocation,
    setDestination,
  };
}
