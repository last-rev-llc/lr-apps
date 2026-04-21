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
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
