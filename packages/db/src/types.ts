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

// Mirrors `supabase/migrations/20260430_meme_templates.sql`. `textZones` is
// a structured JSON array — `MemeTextZone[]` — defining the text-bearing
// rectangles drawn on top of the template image (or coloured background).
export type MemeTextZone = {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  align: "left" | "center" | "right";
  fontSize?: number;
  color?: string;
  uppercase?: boolean;
  defaultText?: string;
};

export type MemeTemplateRow = {
  id: string;
  name: string;
  description: string | null;
  category: string;
  imagePath: string | null;
  imageWidth: number;
  imageHeight: number;
  backgroundColor: string | null;
  defaultTextColor: string;
  textZones: MemeTextZone[];
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
};

// Mirrors `supabase/migrations/20260430_meme_creations.sql`. `textZones` is
// keyed by zone id with the user-entered text per zone (NOT the template's
// zone definitions, which live on `meme_templates.textZones`).
export type MemeCreationRow = {
  id: string;
  user_id: string;
  title: string;
  templateId: string;
  textZones: Record<string, string>;
  fontSize: number;
  storagePath: string;
  widthPx: number;
  heightPx: number;
  createdAt: string;
  updatedAt: string;
};

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
      meme_creations: {
        Row: MemeCreationRow;
        Insert: Pick<
          MemeCreationRow,
          "user_id" | "title" | "templateId" | "storagePath"
        > &
          Partial<
            Omit<
              MemeCreationRow,
              "id" | "user_id" | "title" | "templateId" | "storagePath" | "createdAt" | "updatedAt"
            >
          >;
        Update: Partial<Omit<MemeCreationRow, "id" | "user_id" | "createdAt">>;
        Relationships: [];
      };
      meme_templates: {
        Row: MemeTemplateRow;
        Insert: Pick<
          MemeTemplateRow,
          "id" | "name" | "category" | "imageWidth" | "imageHeight" | "textZones"
        > &
          Partial<Omit<MemeTemplateRow, "id" | "name" | "category" | "imageWidth" | "imageHeight" | "textZones" | "createdAt">>;
        Update: Partial<Omit<MemeTemplateRow, "id" | "createdAt">>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
