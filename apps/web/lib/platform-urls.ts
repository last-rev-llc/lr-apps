import {
  appOrigin,
  appsCatalogOrigin,
  authHubOrigin,
} from "./app-host";
import { resolveSubdomain } from "./proxy-utils";

function portSuffix(hostHeader: string): string {
  const i = hostHeader.indexOf(":");
  return i === -1 ? "" : hostHeader.slice(i);
}

function isLocalhostBare(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1";
}

function isVercelPreview(hostname: string): boolean {
  return hostname.endsWith(".vercel.app");
}

/**
 * Origin for shared routes (`/my-apps`, `/auth/*`) so links work from any app
 * subdomain (e.g. accounts.apps → auth.apps). Stays on the current origin
 * when already on the auth hub or an apex host.
 */
export function getPlatformBaseUrl(hostHeader: string): string {
  const raw = hostHeader.trim();
  const hostname = raw.split(":")[0].toLowerCase();
  const ps = portSuffix(raw);

  if (isLocalhostBare(hostname)) {
    return `http://localhost${ps || ":3000"}`;
  }

  if (isVercelPreview(hostname)) {
    return `https://${raw}`;
  }

  const sub = resolveSubdomain(raw);
  if (sub && sub !== "auth") {
    return authHubOrigin(raw);
  }

  // Already on the auth hub or an apex/unknown host — keep the current origin.
  const scheme = raw.includes("localhost") ? "http" : "https";
  return `${scheme}://${raw}`;
}

/** Public app directory (home grid), for the wordmark when not on that host. */
export function getAppsCatalogUrl(hostHeader: string): string {
  return appsCatalogOrigin(hostHeader);
}

/**
 * URL to open an app from the catalog or /my-apps, matching how the home page
 * resolves hosts: `?app=` on localhost and Vercel previews, subdomain URL in production.
 */
export function getAppLaunchUrl(subdomain: string, hostHeader: string): string {
  const raw = hostHeader.trim();
  const hostname = raw.split(":")[0].toLowerCase();

  if (isLocalhostBare(hostname)) {
    const port = raw.split(":")[1] ?? "3000";
    return `http://localhost:${port}?app=${subdomain}`;
  }

  if (isVercelPreview(hostname)) {
    return `https://${raw}?app=${subdomain}`;
  }

  return appOrigin({ subdomain }, raw);
}

/** Short label for app cards (matches {@link getAppLaunchUrl} behavior). */
export function getAppLaunchUrlLabel(
  subdomain: string,
  hostHeader: string,
): string {
  const raw = hostHeader.trim();
  const hostname = raw.split(":")[0].toLowerCase();

  if (isLocalhostBare(hostname)) {
    return `localhost · ?app=${subdomain}`;
  }

  if (isVercelPreview(hostname)) {
    return `preview · ?app=${subdomain}`;
  }

  // Strip port for the human-readable label.
  return appOrigin({ subdomain }, raw)
    .replace(/^https?:\/\//, "")
    .replace(/:\d+$/, "");
}
