import { requireAccess } from "@repo/auth/server";
import { getAppBySlug } from "./app-registry";

/**
 * Layout-level gate: respects {@link AppConfig.publicEntry} so an app can expose
 * a public marketing or lead surface while other routes add their own
 * `requireAccess` (or stay open).
 */
export async function requireAppLayoutAccess(appSlug: string) {
  const cfg = getAppBySlug(appSlug);
  if (cfg?.publicEntry) return;
  await requireAccess(appSlug);
}
