export type Permission = "view" | "edit" | "admin";

export interface AppPermissionRow {
  id: string;
  user_id: string;
  app_slug: string;
  permission: Permission;
  created_at: string;
  // joined user info (optional)
  user_email?: string | null;
  user_name?: string | null;
}
