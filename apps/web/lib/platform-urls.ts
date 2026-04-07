import {
  APPS_ROOT_DOMAIN,
  APPS_ROOT_DOMAIN_LOCAL,
} from "./app-host";
import { resolveSubdomain } from "./proxy-utils";

const PRODUCTION_DOMAIN = "lastrev.com";
const LOCAL_DOMAIN = "lastrev.localhost";

function portSuffix(hostHeader: string): string {
  const i = hostHeader.indexOf(":");
  return i === -1 ? "" : hostHeader.slice(i);
}

/**
 * Origin for shared routes (`/my-apps`, `/auth/*`) so links work from any app
 * subdomain (e.g. accounts.apps → auth.apps).
 */
export function getPlatformBaseUrl(hostHeader: string): string {
  const raw = hostHeader.trim();
  const hostname = raw.split(":")[0].toLowerCase();
  const ps = portSuffix(raw);

  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return `http://localhost${ps || ":3000"}`;
  }

  if (hostname.endsWith(".vercel.app")) {
    return `https://${raw}`;
  }

  const sub = resolveSubdomain(raw);

  if (hostname.endsWith(`.${APPS_ROOT_DOMAIN}`)) {
    if (sub && sub !== "auth") {
      return `https://auth.${APPS_ROOT_DOMAIN}`;
    }
    return `https://${hostname}${ps}`;
  }

  if (hostname.endsWith(`.${APPS_ROOT_DOMAIN_LOCAL}`)) {
    if (sub && sub !== "auth") {
      return `http://auth.${APPS_ROOT_DOMAIN_LOCAL}${ps || ":3000"}`;
    }
    return `http://${hostname}${ps}`;
  }

  if (hostname.endsWith(`.${PRODUCTION_DOMAIN}`)) {
    if (sub && sub !== "auth") {
      return "https://auth.lastrev.com";
    }
    return `https://${hostname}${ps}`;
  }

  if (hostname.endsWith(`.${LOCAL_DOMAIN}`)) {
    if (sub && sub !== "auth") {
      return `http://auth.${LOCAL_DOMAIN}${ps || ":3000"}`;
    }
    return `http://${hostname}${ps}`;
  }

  return `https://${raw}`;
}

/** Public app directory (home grid), for the wordmark when not on that host. */
export function getAppsCatalogUrl(hostHeader: string): string {
  const raw = hostHeader.trim();
  const hostname = raw.split(":")[0].toLowerCase();
  const ps = portSuffix(raw);

  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return `http://localhost${ps || ":3000"}`;
  }

  if (hostname.endsWith(".vercel.app")) {
    return `https://${raw}`;
  }

  if (hostname.endsWith(`.${APPS_ROOT_DOMAIN}`)) {
    return `https://${APPS_ROOT_DOMAIN}`;
  }

  if (hostname.endsWith(`.${APPS_ROOT_DOMAIN_LOCAL}`)) {
    return `http://${APPS_ROOT_DOMAIN_LOCAL}${ps || ":3000"}`;
  }

  const sub = resolveSubdomain(raw);
  if (hostname.endsWith(`.${PRODUCTION_DOMAIN}`) && sub) {
    return "https://lastrev.com";
  }

  if (hostname.endsWith(`.${LOCAL_DOMAIN}`) && sub) {
    return `http://${LOCAL_DOMAIN}${ps || ":3000"}`;
  }

  return getPlatformBaseUrl(hostHeader);
}

/**
 * URL to open an app from the catalog or /my-apps, matching how the home page
 * resolves hosts: `?app=` on localhost and Vercel previews, subdomain URL in production.
 */
export function getAppLaunchUrl(subdomain: string, hostHeader: string): string {
  const host = hostHeader.trim();

  if (host.includes("localhost") || host.includes("127.0.0.1")) {
    const port = host.split(":")[1] ?? "3000";
    return `http://localhost:${port}?app=${subdomain}`;
  }

  if (host.includes("vercel.app")) {
    return `https://${host}?app=${subdomain}`;
  }

  const baseDomain = host.replace(/^[^.]+\./, "");
  return `https://${subdomain}.${baseDomain}`;
}

/** Short label for app cards (matches {@link getAppLaunchUrl} behavior). */
export function getAppLaunchUrlLabel(subdomain: string, hostHeader: string): string {
  const host = hostHeader.trim().toLowerCase();

  if (host.includes("localhost") || host.includes("127.0.0.1")) {
    return `localhost · ?app=${subdomain}`;
  }

  if (host.includes("vercel.app")) {
    return `preview · ?app=${subdomain}`;
  }

  const baseDomain = host.replace(/^[^.]+\./, "").replace(/:\d+$/, "");
  return `${subdomain}.${baseDomain}`;
}
