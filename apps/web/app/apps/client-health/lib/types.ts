import type {
  AlertSeverity,
  AlertType,
  ClientHealthAlertRow,
  ClientRow,
  ClientSiteRow,
  ClientStatus,
  ContractStatus,
  SiteMetadataRow,
  StatusPulseSiteRow,
} from "@repo/db/types";
import type { ScoreResult } from "./score";

export type SiteStatus = "up" | "down" | "degraded";

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export type {
  AlertSeverity,
  AlertType,
  ClientHealthAlertRow as ClientHealthAlert,
  ClientRow,
  ClientSiteRow,
  ClientStatus,
  ContractStatus,
  SiteMetadataRow,
  StatusPulseSiteRow,
};

export interface SiteWithMeta extends ClientSiteRow {
  status: SiteStatus | null;
  uptime: number | null;
  responseTime: number | null;
  sslExpiry: string | null;
}

export interface ClientHealthPayload {
  client: ClientRow;
  sites: SiteWithMeta[];
  score: ScoreResult;
}
