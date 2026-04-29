import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@repo/db/server";
import type { Permission } from "@repo/db/types";
import { hasPermission } from "./permissions";
import {
  getAuth0ClientForHost,
  getHostFromRequestHeaders,
} from "./auth0-factory";
import { authHubUrl } from "./cluster-host";

export interface AccessResult {
  user: {
    id: string;
    email: string;
  };
  permission: Permission;
}

export async function requireAccess(
  appSlug: string,
  minPermission: Permission = "view",
): Promise<AccessResult> {
  const h = await headers();
  const host = getHostFromRequestHeaders(h);
  const auth0 = getAuth0ClientForHost(host);
  const session = await auth0.getSession();

  if (!session?.user) {
    // Distinguish between no session and expired/invalid session
    const errorParam = session ? "&error=session_expired" : "";
    redirect(
      authHubUrl(
        host,
        `/login?redirect=${encodeURIComponent(appSlug)}${errorParam}`,
      ),
    );
  }

  const userId = session.user.sub;
  const email =
    typeof session.user.email === "string" ? session.user.email : "";

  const supabase = await createClient();

  const { data: perm } = (await supabase
    .from("app_permissions")
    .select("permission")
    .eq("user_id", userId)
    .eq("app_slug", appSlug)
    .single()) as { data: { permission: string } | null };

  if (!perm || !hasPermission(perm.permission as Permission, minPermission)) {
    redirect(
      authHubUrl(host, `/unauthorized?app=${encodeURIComponent(appSlug)}`),
    );
  }

  return {
    user: { id: userId, email },
    permission: perm.permission as Permission,
  };
}
