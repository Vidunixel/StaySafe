import React from "react";
import {
  Shield,
  Map as MapIcon,
  Video,
  Lightbulb,
  AlertTriangle,
  ShieldAlert,
  Building2,
  Route,
} from "lucide-react";
import ToggleCard from "../ToggleCard";
import type { Report } from "../../App";

type SidebarProps = {
  showHeatmap: boolean;
  setShowHeatmap: React.Dispatch<React.SetStateAction<boolean>>;
  showCCTV: boolean;
  setShowCCTV: React.Dispatch<React.SetStateAction<boolean>>;
  showLighting: boolean;
  setShowLighting: React.Dispatch<React.SetStateAction<boolean>>;
  showReports: boolean;
  setShowReports: React.Dispatch<React.SetStateAction<boolean>>;
  showNavigation: boolean;
  setShowNavigation: React.Dispatch<React.SetStateAction<boolean>>;
  destination: { lat: number; lng: number } | null;
  clearNavigationDestination: () => void;
  showPoliceStations: boolean;
  setShowPoliceStations: React.Dispatch<React.SetStateAction<boolean>>;
  showPedestrianNetwork: boolean;
  setShowPedestrianNetwork: React.Dispatch<React.SetStateAction<boolean>>;
  reports: Report[];
};

export default function Sidebar({
  showHeatmap,
  setShowHeatmap,
  showCCTV,
  setShowCCTV,
  showLighting,
  setShowLighting,
  showReports,
  setShowReports,
  showNavigation,
  setShowNavigation,
  destination,
  clearNavigationDestination,
  showPoliceStations,
  setShowPoliceStations,
  showPedestrianNetwork,
  setShowPedestrianNetwork,
  reports,
}: SidebarProps) {
  const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;
  const recentReports = reports.filter(
    (r) => new Date(r.created_at).getTime() >= twentyFourHoursAgo
  );

  return (
    <aside className="w-80 bg-white border-r border-slate-200 flex flex-col z-20 shadow-lg relative">
      <div className="p-6 border-b border-slate-100 flex items-center gap-3">
        <div className="bg-blue-600 p-2 rounded-lg">
          <Shield className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            StaySafe
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Victoria Crime Prediction
          </p>
        </div>
      </div>

      <div className="p-6 flex-1 overflow-y-auto">
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">
          Map Layers
        </h2>

        <div className="space-y-3">
          <ToggleCard
            active={showHeatmap}
            onClick={() => setShowHeatmap((prev) => !prev)}
            icon={<MapIcon className="w-5 h-5" />}
            title="Crime Map"
            description="Predicted crime risk "
            colorClass="text-violet-600 bg-violet-50 border-violet-200"
          />
          <ToggleCard
            active={showCCTV}
            onClick={() => setShowCCTV((prev) => !prev)}
            icon={<Video className="w-5 h-5" />}
            title="CCTV Cameras"
            description="Surveillance areas"
            colorClass="text-blue-600 bg-blue-50 border-blue-200"
          />
          <ToggleCard
            active={showLighting}
            onClick={() => setShowLighting((prev) => !prev)}
            icon={<Lightbulb className="w-5 h-5" />}
            title="Street Lighting"
            description="Well-lit areas"
            colorClass="text-amber-500 bg-amber-50 border-amber-200"
          />
          <ToggleCard
            active={showReports}
            onClick={() => setShowReports((prev) => !prev)}
            icon={<ShieldAlert className="w-5 h-5" />}
            title="User Reports"
            description="Incident reports"
            colorClass="text-red-600 bg-red-50 border-red-200"
          />
          <ToggleCard
            active={showPoliceStations}
            onClick={() => setShowPoliceStations((prev) => !prev)}
            icon={<Building2 className="w-5 h-5" />}
            title="Police Stations"
            description="Police locations"
            colorClass="text-indigo-600 bg-indigo-50 border-indigo-200"
          />
          <ToggleCard
            active={showPedestrianNetwork}
            onClick={() => setShowPedestrianNetwork((prev) => !prev)}
            icon={<Route className="w-5 h-5" />}
            title="Pedestrian Network"
            description="Walking paths"
            colorClass="text-emerald-600 bg-emerald-50 border-emerald-200"
          />
          <ToggleCard
            active={showNavigation}
            onClick={() => setShowNavigation((prev) => !prev)}
            icon={<Route className="w-5 h-5" />}
            title="Safe Navigation"
            description="Set destination"
            colorClass="text-emerald-600 bg-emerald-50 border-emerald-200"
          />
        </div>

        {showNavigation && (
          <div className="mt-4 bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-sm text-emerald-800">
            <p className="font-medium">Navigation is active.</p>
            <p className="text-xs mt-1">
              Click on the map to set a destination and view the safest route
              estimate.
            </p>
            {destination && (
              <button
                onClick={clearNavigationDestination}
                className="mt-3 w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium py-2 rounded-lg transition-colors"
              >
                Clear Destination
              </button>
            )}
          </div>
        )}

        {reports.length === 0 && (
          <div className="mt-8">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">
              How to Report
            </h2>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-600">
              <p className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <span>
                  Click anywhere on the map to drop a pin and report an incident
                  or unsafe area.
                </span>
              </p>
            </div>
          </div>
        )}

        {recentReports.length > 0 && (
          <div className="mt-8">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">
              Recent Reports (24h)
            </h2>
            <div className="space-y-3">
              {recentReports
                .slice()
                .reverse()
                .map((report) => (
                  <div
                    key={report.id}
                    className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-sm"
                  >
                    <div className="font-semibold text-slate-800">
                      {report.incident_type}
                    </div>
                    <div className="text-slate-500 text-xs mt-1 truncate">
                      {report.description}
                    </div>
                    <div className="text-slate-400 text-xs mt-1.5">
                      {new Date(report.created_at).toLocaleString()}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
