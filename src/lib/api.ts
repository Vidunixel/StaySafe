// Talks to the self-hosted StaySafe server (server/server.mjs), which replaced
// Supabase. Same origin in production; `npm run dev` proxies /api to it.

export type NewReport = {
  geo_coordinates: [number, number];
  incident_type: string;
  description: string;
};

export async function fetchTable<T>(table: string): Promise<T[]> {
  const response = await fetch(`/api/${encodeURIComponent(table)}`);
  if (!response.ok) {
    throw new Error(`Could not load ${table} (${response.status})`);
  }
  return (await response.json()) as T[];
}

export async function createReport(report: NewReport): Promise<void> {
  const response = await fetch("/api/reports", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(report),
  });
  if (!response.ok) {
    throw new Error(`Could not save report (${response.status})`);
  }
}
