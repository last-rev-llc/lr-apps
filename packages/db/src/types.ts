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
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
