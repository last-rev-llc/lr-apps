import { requireAccess, type AccessResult } from "@repo/auth/server";
import { isPublicRoute } from "./app-registry";

/**
 * Layout-level gate: all apps are gated by default. If the app declares
 * `publicRoutes` and the current `pathname` matches, access is allowed
 * without authentication (and `null` is returned).
 *
 * Returns the authenticated user's access details when the route is gated,
 * so callers can perform follow-up checks like `hasFeatureAccess(user.id, ...)`.
 */
export async function requireAppLayoutAccess(
  appSlug: string,
  pathname?: string,
): Promise<AccessResult | null> {
  if (pathname && isPublicRoute(appSlug, pathname)) return null;
  return await requireAccess(appSlug);
}
