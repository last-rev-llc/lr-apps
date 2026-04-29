import { requireAccess } from "@repo/auth/server";
import { capture } from "@repo/analytics/server";
import { isPublicRoute } from "./app-registry";
import { withSpan } from "./otel";

/**
 * Layout-level gate: all apps are gated by default. If the app declares
 * `publicRoutes` and the current `pathname` matches, access is allowed
 * without authentication.
 *
 * On a successful access check, fires an `app_opened` analytics event
 * (no-op in test/disabled envs).
 */
export async function requireAppLayoutAccess(
  appSlug: string,
  pathname?: string,
) {
  if (pathname && isPublicRoute(appSlug, pathname)) return;
  const result = await withSpan(
    "auth.permission_lookup",
    { "app.slug": appSlug },
    () => requireAccess(appSlug),
  );
  if (result?.user?.id) {
    await capture(result.user.id, "app_opened", { slug: appSlug });
  }
  return result;
}
