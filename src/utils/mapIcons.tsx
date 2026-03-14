import * as L from 'leaflet';
import { renderToString } from 'react-dom/server';
import { User } from "lucide-react";
import { Crosshair } from "lucide-react";

// Raw SVG strings for custom map icons
const cctvSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-video"><path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5"/><rect x="2" y="6" width="14" height="12" rx="2"/></svg>`;
const lightingSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-lightbulb"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1.3.5 2.6 1.5 3.5.8.8 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>`;
const reportSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-shield-alert"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2-1 4-3 5.99-5a1 1 0 0 1 1.02 0c2 2 4 4 5.99 5a1 1 0 0 1 1 1z"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>`;
const draftSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-map-pin"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>`;
const humanSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-user"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;
const policeSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-building-2"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/></svg>`;

const createCustomIconHtml = (svgString: string, colorClass: string, bgClass: string) => {
  return `
    <div class="p-1.5 rounded-full shadow-md border-2 border-white flex items-center justify-center w-8 h-8 ${bgClass} ${colorClass}">
      ${svgString}
    </div>
  `;
};

const createLeafletIcon = (html: string) => {
  return L.divIcon({
    html,
    className: 'custom-leaflet-icon',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

export const cctvIcon = createLeafletIcon(
  createCustomIconHtml(cctvSvg, 'text-slate-900', 'bg-slate-200'),
);

export const lightingIcon = createLeafletIcon(
  createCustomIconHtml(lightingSvg, 'text-amber-600', 'bg-amber-100'),
);

export const reportIcon = createLeafletIcon(
  createCustomIconHtml(reportSvg, 'text-red-700', 'bg-red-100'),
);

export const draftIcon = createLeafletIcon(
  createCustomIconHtml(draftSvg, 'text-slate-700', 'bg-slate-100'),
);

export const userIcon = createLeafletIcon(
  createCustomIconHtml(humanSvg, 'text-white', 'bg-blue-500'),
);

export const policeStationIcon = createLeafletIcon(
  createCustomIconHtml(policeSvg, 'text-blue-700', 'bg-blue-100'),
);

export const recenterIcon = (
    <Crosshair className="w-6 h-6 text-white" />
);