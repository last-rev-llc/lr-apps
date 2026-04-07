export type Permission = "view" | "edit" | "admin";

export interface AppPermission {
  id: string;
  user_id: string;
  app_slug: string;
  permission: Permission;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      app_permissions: {
        Row: AppPermission;
        Insert: Omit<AppPermission, "id" | "created_at">;
        Update: Partial<Omit<AppPermission, "id">>;
      };
    };
  };
}
