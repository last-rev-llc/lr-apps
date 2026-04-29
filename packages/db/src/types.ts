export type Permission = "view" | "edit" | "admin";

export type AppPermission = {
  id: string;
  user_id: string;
  app_slug: string;
  permission: Permission;
  created_at: string;
};

export type Tier = "free" | "pro" | "enterprise";

export type SubscriptionStatus =
  | "active"
  | "canceled"
  | "past_due"
  | "trialing"
  | "incomplete";

export type SubscriptionRow = {
  id: string;
  user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  tier: Tier;
  status: SubscriptionStatus;
  current_period_start: string | null;
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
};

export type ProcessedWebhookEvent = {
  event_id: string;
  processed_at: string;
};

export type AuditLogRow = {
  id: string;
  user_id: string | null;
  action: string;
  resource: string | null;
  metadata: Record<string, unknown>;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
};

export type FeatureFlagRow = {
  id: string;
  key: string;
  user_id: string | null;
  tier: Tier | null;
  enabled: boolean;
  created_at: string;
};

export type ClientStatus = "active" | "paused" | "churned" | "prospect";
export type ContractStatus = "active" | "expiring-soon" | "expired" | "none";

export type ClientRow = {
  id: string;
  user_id: string;
  name: string;
  industry: string | null;
  status: ClientStatus;
  contractStatus: ContractStatus | null;
  contractEndDate: string | null;
  primaryContactName: string | null;
  primaryContactEmail: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ClientSiteRow = {
  id: string;
  user_id: string;
  clientId: string;
  label: string;
  url: string;
  isPrimary: boolean;
  openTicketCount: number;
  ticketsLastUpdated: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SiteMetadataRow = {
  url: string;
  sslExpiry: string | null;
  sslIssuer: string | null;
  sslLastChecked: string | null;
  sslLastError: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type StatusPulseSiteRow = {
  id: string;
  url: string;
  name: string | null;
  description: string | null;
  status: "up" | "down" | "degraded";
  uptimePercent: number | null;
  responseTimeMs: number | null;
  lastChecked: string | null;
};

export type AlertType =
  | "site-down"
  | "ssl-expiring"
  | "ssl-expired"
  | "ticket-spike"
  | "health-score-drop";
export type AlertSeverity = "info" | "warning" | "critical";

export type ClientHealthAlertRow = {
  id: string;
  user_id: string;
  clientId: string | null;
  type: AlertType;
  severity: AlertSeverity;
  title: string | null;
  message: string | null;
  deliveredAt: string | null;
  acknowledgedAt: string | null;
  createdAt: string;
};

export interface Database {
  public: {
    Tables: {
      app_permissions: {
        Row: AppPermission;
        Insert: Omit<AppPermission, "id" | "created_at">;
        Update: Partial<Omit<AppPermission, "id">>;
        Relationships: [];
      };
      subscriptions: {
        Row: SubscriptionRow;
        Insert: Pick<SubscriptionRow, "user_id" | "tier" | "status"> &
          Partial<Omit<SubscriptionRow, "user_id" | "tier" | "status">>;
        Update: Partial<Omit<SubscriptionRow, "id">>;
        Relationships: [];
      };
      processed_webhook_events: {
        Row: ProcessedWebhookEvent;
        Insert: Pick<ProcessedWebhookEvent, "event_id"> &
          Partial<Pick<ProcessedWebhookEvent, "processed_at">>;
        Update: Partial<ProcessedWebhookEvent>;
        Relationships: [];
      };
      audit_log: {
        Row: AuditLogRow;
        Insert: Pick<AuditLogRow, "action"> &
          Partial<Omit<AuditLogRow, "id" | "action" | "created_at">>;
        Update: Partial<Omit<AuditLogRow, "id" | "created_at">>;
        Relationships: [];
      };
      feature_flags: {
        Row: FeatureFlagRow;
        Insert: Pick<FeatureFlagRow, "key"> &
          Partial<Omit<FeatureFlagRow, "id" | "created_at">>;
        Update: Partial<Omit<FeatureFlagRow, "id" | "created_at">>;
        Relationships: [];
      };
      clients: {
        Row: ClientRow;
        Insert: Pick<ClientRow, "name"> &
          Partial<Omit<ClientRow, "id" | "user_id" | "createdAt" | "updatedAt">>;
        Update: Partial<Omit<ClientRow, "id" | "user_id" | "createdAt" | "updatedAt">>;
        Relationships: [];
      };
      client_sites: {
        Row: ClientSiteRow;
        Insert: Pick<ClientSiteRow, "clientId" | "label" | "url"> &
          Partial<Omit<ClientSiteRow, "id" | "user_id" | "createdAt" | "updatedAt">>;
        Update: Partial<Omit<ClientSiteRow, "id" | "user_id" | "createdAt" | "updatedAt">>;
        Relationships: [];
      };
      site_metadata: {
        Row: SiteMetadataRow;
        Insert: Pick<SiteMetadataRow, "url"> &
          Partial<Omit<SiteMetadataRow, "createdAt" | "updatedAt">>;
        Update: Partial<Omit<SiteMetadataRow, "createdAt" | "updatedAt">>;
        Relationships: [];
      };
      sites: {
        Row: StatusPulseSiteRow;
        Insert: Pick<StatusPulseSiteRow, "url" | "status"> &
          Partial<Omit<StatusPulseSiteRow, "id">>;
        Update: Partial<Omit<StatusPulseSiteRow, "id">>;
        Relationships: [];
      };
      client_health_alerts: {
        Row: ClientHealthAlertRow;
        Insert: Pick<ClientHealthAlertRow, "type" | "severity"> &
          Partial<Omit<ClientHealthAlertRow, "id" | "user_id" | "createdAt">>;
        Update: Partial<Omit<ClientHealthAlertRow, "id" | "user_id" | "createdAt">>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
