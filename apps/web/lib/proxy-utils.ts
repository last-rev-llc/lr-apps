import { getAppBySubdomain } from "./app-registry";

const PRODUCTION_DOMAIN = "lastrev.com";
const LOCAL_DOMAIN = "lastrev.localhost";

export function resolveSubdomain(host: string): string | null {
  const hostname = host.split(":")[0];

  if (hostname.endsWith(`.${PRODUCTION_DOMAIN}`)) {
    const sub = hostname.slice(0, -(PRODUCTION_DOMAIN.length + 1));
    if (!sub || sub === "www") return null;
    return sub;
  }

  if (hostname.endsWith(`.${LOCAL_DOMAIN}`)) {
    const sub = hostname.slice(0, -(LOCAL_DOMAIN.length + 1));
    if (!sub || sub === "www") return null;
    return sub;
  }

  return null;
}

export function getRouteForSubdomain(subdomain: string): string | null {
  const app = getAppBySubdomain(subdomain);
  if (!app) return null;
  return `/${app.routeGroup}`;
}
