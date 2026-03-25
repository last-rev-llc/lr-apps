export interface SiteHistory {
  date: string;
  status: "up" | "down" | "degraded";
  responseTimeMs?: number;
  incidents?: SiteIncident[];
}

export interface SiteIncident {
  start: string;
  end?: string;
  description: string;
  resolved: boolean;
}

export interface Site {
  id: string;
  name: string;
  url: string;
  description?: string;
  status: "up" | "down" | "degraded";
  responseTimeMs?: number;
  uptimePercent?: number;
  lastChecked?: string;
  history?: SiteHistory[];
  createdAt?: string;
  updatedAt?: string;
}
