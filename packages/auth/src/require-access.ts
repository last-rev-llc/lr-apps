import { redirect } from "next/navigation";
import { createClient } from "@repo/db/server";
import type { Permission } from "@repo/db/types";
import { hasPermission } from "./permissions";

export interface AccessResult {
  user: {
    id: string;
    email: string;
  };
  permission: Permission;
}

const AUTH_URL =
  process.env.NEXT_PUBLIC_AUTH_URL ?? "https://auth.lastrev.com";

export async function requireAccess(
  appSlug: string,
  minPermission: Permission = "view",
): Promise<AccessResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(
      `${AUTH_URL}/login?redirect=${encodeURIComponent(appSlug)}`,
    );
  }

  const { data: perm } = (await supabase
    .from("app_permissions")
    .select("permission")
    .eq("user_id", user.id)
    .eq("app_slug", appSlug)
    .single()) as { data: { permission: string } | null };

  if (!perm || !hasPermission(perm.permission as Permission, minPermission)) {
    redirect(`${AUTH_URL}/unauthorized`);
  }

  return {
    user: { id: user.id, email: user.email ?? "" },
    permission: perm.permission as Permission,
  };
}
