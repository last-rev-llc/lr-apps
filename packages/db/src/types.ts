export type Permission = "view" | "edit" | "admin";

export interface AppPermission {
  id: string;
  user_id: string;
  app_slug: string;
  permission: Permission;
  created_at: string;
}

export type Tier = "free" | "pro" | "enterprise";

export type SubscriptionStatus =
  | "active"
  | "canceled"
  | "past_due"
  | "trialing"
  | "incomplete";

export interface SubscriptionRow {
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
}

export interface Database {
  public: {
    Tables: {
      app_permissions: {
        Row: AppPermission;
        Insert: Omit<AppPermission, "id" | "created_at">;
        Update: Partial<Omit<AppPermission, "id">>;
      };
      subscriptions: {
        Row: SubscriptionRow;
        Insert: Omit<SubscriptionRow, "id" | "created_at" | "updated_at"> &
          Partial<Pick<SubscriptionRow, "created_at" | "updated_at">>;
        Update: Partial<Omit<SubscriptionRow, "id">>;
      };
    };
  };
}
