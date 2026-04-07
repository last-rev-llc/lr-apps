import { requireAccess } from "@repo/auth/server";
import { isPublicRoute } from "./app-registry";

/**
 * Layout-level gate: all apps are gated by default. If the app declares
 * `publicRoutes` and the current `pathname` matches, access is allowed
 * without authentication.
 */
export async function requireAppLayoutAccess(
  appSlug: string,
  pathname?: string,
) {
  if (pathname && isPublicRoute(appSlug, pathname)) return;
  await requireAccess(appSlug);
}
