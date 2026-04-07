export type SiteStatus = "up" | "down" | "degraded";

export type SortKey = "status" | "name" | "responseTime" | "uptime";

export interface HealthSite {
  id: string;
  name: string;
  url: string;
  status: SiteStatus;
  responseTime?: number | null;
  uptime?: number | null;
  lastCheck?: string | null;
  sslExpiry?: string | null;
}
