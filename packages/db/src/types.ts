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

// Mirrors `supabase/migrations/20260429_ideas.sql`. Mixed naming is intentional:
// `id`, `user_id`, `title`, etc. are unquoted (snake_case) while the camelCase
// columns are quoted in the migration so the app code in apps/web/app/apps/ideas
// can use them without an adapter layer.
export type IdeaStatus =
  | "new"
  | "backlog"
  | "in-progress"
  | "completed"
  | "archived";

export type IdeaSource = "generated" | "community" | "manual";

export type IdeaEffort = "Low" | "Medium" | "High";

export type IdeaRow = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  category: string | null;
  status: IdeaStatus;
  source: IdeaSource;
  feasibility: number | null;
  impact: number | null;
  effort: IdeaEffort | null;
  compositeScore: number | null;
  rating: number | null;
  hidden: boolean;
  snoozedUntil: string | null;
  tags: string[];
  author: string | null;
  sourceUrl: string | null;
  plan: string | null;
  planModel: string | null;
  planGeneratedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
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
      ideas: {
        Row: IdeaRow;
        Insert: Pick<IdeaRow, "user_id" | "title"> &
          Partial<
            Omit<
              IdeaRow,
              "id" | "user_id" | "title" | "createdAt" | "updatedAt"
            >
          >;
        Update: Partial<Omit<IdeaRow, "id" | "user_id" | "createdAt">>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
