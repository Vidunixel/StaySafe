export type HeatmapRegion = {
  name: string;
  center: [number, number];
  radius: number;
  risk: 'high' | 'medium' | 'low';
  color: string;
  fillColor: string;
  intensity: number;
};

// Mock Data Generators for Victoria (focusing around Melbourne/Geelong/Ballarat)
export const generateMockHeatmap = (): HeatmapRegion[] => {
  const regions = [
    { name: 'Melbourne CBD', center: [-37.8136, 144.9631] as [number, number], radius: 3000, risk: 'high' as const },
    { name: 'Dandenong', center: [-37.981, 145.215] as [number, number], radius: 4000, risk: 'high' as const },
    { name: 'Frankston', center: [-38.1438, 145.1227] as [number, number], radius: 3500, risk: 'medium' as const },
    { name: 'Geelong', center: [-38.1499, 144.3617] as [number, number], radius: 5000, risk: 'medium' as const },
    { name: 'Ballarat', center: [-37.5622, 143.8503] as [number, number], radius: 4000, risk: 'low' as const },
    { name: 'Bendigo', center: [-36.757, 144.2794] as [number, number], radius: 4000, risk: 'low' as const },
    { name: 'Richmond', center: [-37.823, 145] as [number, number], radius: 1500, risk: 'high' as const },
    { name: 'St Kilda', center: [-37.864, 144.982] as [number, number], radius: 2000, risk: 'medium' as const },
    { name: 'Werribee', center: [-37.9015, 144.6601] as [number, number], radius: 4500, risk: 'low' as const },
    { name: 'Broadmeadows', center: [-37.6833, 144.9167] as [number, number], radius: 3000, risk: 'high' as const },
  ];

  return regions.map((r) => ({
    ...r,
    color: r.risk === 'high' ? '#dc2626' : r.risk === 'medium' ? '#f59e0b' : '#10b981',
    fillColor: r.risk === 'high' ? '#f87171' : r.risk === 'medium' ? '#fbbf24' : '#34d399',
    intensity: r.risk === 'high' ? 0.4 : r.risk === 'medium' ? 0.3 : 0.2,
  }));
};

export const generateRandomPoints = (
  center: [number, number],
  radiusKm: number,
  count: number,
): [number, number][] => {
  const points: [number, number][] = [];
  for (let i = 0; i < count; i++) {
    // Random point within a circle
    const r = (radiusKm / 111.3) * Math.sqrt(Math.random());
    const theta = Math.random() * 2 * Math.PI;
    const lat = center[0] + r * Math.cos(theta);
    const lng = center[1] + r * Math.sin(theta);
    points.push([lat, lng]);
  }
  return points;
};

