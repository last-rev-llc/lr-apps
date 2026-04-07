import type { AppConfig } from "./app-registry";
import { getAppBySubdomain } from "./app-registry";
import { APPS_ROOT_DOMAIN, APPS_ROOT_DOMAIN_LOCAL } from "./app-host";

const PRODUCTION_DOMAIN = "lastrev.com";
const LOCAL_DOMAIN = "lastrev.localhost";

const APPS_PROD_SUFFIX = `.${APPS_ROOT_DOMAIN}`;
const APPS_LOCAL_SUFFIX = `.${APPS_ROOT_DOMAIN_LOCAL}`;

/**
 * App slug from host when using `*.apps.lastrev.com` (or local equivalent).
 * Returns null for bare `apps.lastrev.com` / `apps.lastrev.localhost`.
 * Legacy `*.lastrev.com` (single label) is still supported for migration.
 */
export function resolveSubdomain(host: string): string | null {
  const hostname = host.split(":")[0];
  let sub: string | null = null;

  if (hostname.endsWith(APPS_PROD_SUFFIX)) {
    sub = hostname.slice(0, -APPS_PROD_SUFFIX.length);
  } else if (hostname.endsWith(APPS_LOCAL_SUFFIX)) {
    sub = hostname.slice(0, -APPS_LOCAL_SUFFIX.length);
  } else if (hostname.endsWith(`.${PRODUCTION_DOMAIN}`)) {
    sub = hostname.slice(0, -(PRODUCTION_DOMAIN.length + 1));
  } else if (hostname.endsWith(`.${LOCAL_DOMAIN}`)) {
    sub = hostname.slice(0, -(LOCAL_DOMAIN.length + 1));
  }

  if (!sub || sub === "www" || sub === "apps") return null;
  return sub;
}

export function getRouteForSubdomain(subdomain: string): string | null {
  const app = getAppBySubdomain(subdomain);
  if (!app) return null;
  return `/${app.routeGroup}`;
}

/**
 * Href to a path inside an app. On `*.apps.*` / legacy app hosts, `proxy` already
 * prefixes `/${routeGroup}` — use a root-relative path like `/calculator`. On
 * localhost / preview hosts without that prefix, use the full filesystem path.
 */
export function hrefWithinDeployedApp(
  hostHeader: string,
  app: Pick<AppConfig, "subdomain" | "routeGroup">,
  pathInApp: string,
): string {
  const clean = pathInApp.startsWith("/") ? pathInApp : `/${pathInApp}`;
  const sub = resolveSubdomain(hostHeader.trim());
  if (sub === app.subdomain) {
    return clean;
  }
  return `/${app.routeGroup}${clean}`;
}
