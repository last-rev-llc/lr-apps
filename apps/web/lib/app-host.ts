import type { AppConfig } from "./app-registry";

/** Production apps live under this DNS name (sub-subdomain per app). */
export const APPS_ROOT_DOMAIN = "apps.lastrev.com";

/** Local dev mirror: map e.g. `command-center.apps.lastrev.localhost` in /etc/hosts. */
export const APPS_ROOT_DOMAIN_LOCAL = "apps.lastrev.localhost";

/** Legacy root domain still in use during the *.apps.lastrev.com cutover. */
export const LEGACY_ROOT_DOMAIN = "lastrev.com";
export const LEGACY_ROOT_DOMAIN_LOCAL = "lastrev.localhost";

const VERCEL_PREVIEW_SUFFIX = ".vercel.app";

function portSuffix(hostHeader: string): string {
  const i = hostHeader.indexOf(":");
  return i === -1 ? "" : hostHeader.slice(i);
}

interface ParsedHost {
  hostname: string;
  port: string;
  raw: string;
}

function parseHost(hostHeader: string): ParsedHost {
  const raw = hostHeader.trim();
  const hostname = raw.split(":")[0].toLowerCase();
  return { hostname, port: portSuffix(raw), raw };
}

type Cluster =
  | { kind: "apps-prod" }
  | { kind: "apps-local"; port: string }
  | { kind: "legacy-prod" }
  | { kind: "legacy-local"; port: string }
  | { kind: "vercel-preview"; raw: string }
  | { kind: "localhost"; port: string }
  | { kind: "unknown"; raw: string };

function classify(hostHeader: string): Cluster {
  const { hostname, port, raw } = parseHost(hostHeader);

  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return { kind: "localhost", port: port || ":3000" };
  }
  if (hostname.endsWith(VERCEL_PREVIEW_SUFFIX)) {
    return { kind: "vercel-preview", raw };
  }
  if (hostname === APPS_ROOT_DOMAIN || hostname.endsWith(`.${APPS_ROOT_DOMAIN}`)) {
    return { kind: "apps-prod" };
  }
  if (
    hostname === APPS_ROOT_DOMAIN_LOCAL ||
    hostname.endsWith(`.${APPS_ROOT_DOMAIN_LOCAL}`)
  ) {
    return { kind: "apps-local", port: port || ":3000" };
  }
  if (hostname === LEGACY_ROOT_DOMAIN || hostname.endsWith(`.${LEGACY_ROOT_DOMAIN}`)) {
    return { kind: "legacy-prod" };
  }
  if (
    hostname === LEGACY_ROOT_DOMAIN_LOCAL ||
    hostname.endsWith(`.${LEGACY_ROOT_DOMAIN_LOCAL}`)
  ) {
    return { kind: "legacy-local", port: port || ":3000" };
  }
  return { kind: "unknown", raw };
}

/** True when `hostHeader` is on the new `*.apps.lastrev.com` cluster (or local mirror). */
export function isAppsClusterHost(hostHeader: string): boolean {
  const c = classify(hostHeader);
  return c.kind === "apps-prod" || c.kind === "apps-local";
}

/** True when `hostHeader` is on the legacy `*.lastrev.com` cluster. */
export function isLegacyClusterHost(hostHeader: string): boolean {
  const c = classify(hostHeader);
  return c.kind === "legacy-prod" || c.kind === "legacy-local";
}

/**
 * Canonical host for `app` under the same cluster as `hostHeader`.
 * Examples:
 * - on `*.apps.lastrev.com` → `<sub>.apps.lastrev.com`
 * - on `*.apps.lastrev.localhost:3000` → `<sub>.apps.lastrev.localhost:3000`
 * - on legacy `*.lastrev.com` → `<sub>.lastrev.com`
 * - on bare `localhost` or Vercel preview → returns the original host (caller should use `?app=`).
 */
export function appHost(
  app: Pick<AppConfig, "subdomain">,
  hostHeader: string,
): string {
  const c = classify(hostHeader);
  switch (c.kind) {
    case "apps-prod":
      return `${app.subdomain}.${APPS_ROOT_DOMAIN}`;
    case "apps-local":
      return `${app.subdomain}.${APPS_ROOT_DOMAIN_LOCAL}${c.port}`;
    case "legacy-prod":
      return `${app.subdomain}.${LEGACY_ROOT_DOMAIN}`;
    case "legacy-local":
      return `${app.subdomain}.${LEGACY_ROOT_DOMAIN_LOCAL}${c.port}`;
    case "localhost":
      return `localhost${c.port}`;
    case "vercel-preview":
      return c.raw;
    case "unknown":
      return c.raw;
  }
}

/**
 * Origin (`scheme://host[:port]`) for `app` under the same cluster as `hostHeader`.
 * `https` for production hosts, `http` for localhost-style dev hosts.
 */
export function appOrigin(
  app: Pick<AppConfig, "subdomain">,
  hostHeader: string,
): string {
  const c = classify(hostHeader);
  const scheme =
    c.kind === "apps-local" ||
    c.kind === "legacy-local" ||
    c.kind === "localhost"
      ? "http"
      : "https";
  return `${scheme}://${appHost(app, hostHeader)}`;
}

/**
 * Auth hub origin for the cluster of `hostHeader`.
 * - apps cluster → `https://auth.apps.lastrev.com`
 * - legacy cluster → `https://auth.lastrev.com`
 * - local apps cluster → `http://auth.apps.lastrev.localhost:3000`
 * - local legacy cluster → `http://auth.lastrev.localhost:3000`
 * - bare localhost → `http://localhost:3000`
 * - Vercel preview / unknown → echoes the raw host (callers handle previews separately).
 */
export function authHubOrigin(hostHeader: string): string {
  return appOrigin({ subdomain: "auth" }, hostHeader);
}

/**
 * Apex origin for the apps catalog (the home grid wordmark links here).
 * - apps cluster → `https://apps.lastrev.com`
 * - legacy cluster → `https://lastrev.com`
 * - local apps cluster → `http://apps.lastrev.localhost:3000`
 * - local legacy cluster → `http://lastrev.localhost:3000`
 * - bare localhost → `http://localhost:3000`
 * - Vercel preview → echoes the raw host.
 */
export function appsCatalogOrigin(hostHeader: string): string {
  const c = classify(hostHeader);
  switch (c.kind) {
    case "apps-prod":
      return `https://${APPS_ROOT_DOMAIN}`;
    case "apps-local":
      return `http://${APPS_ROOT_DOMAIN_LOCAL}${c.port}`;
    case "legacy-prod":
      return `https://${LEGACY_ROOT_DOMAIN}`;
    case "legacy-local":
      return `http://${LEGACY_ROOT_DOMAIN_LOCAL}${c.port}`;
    case "localhost":
      return `http://localhost${c.port}`;
    case "vercel-preview":
      return `https://${c.raw}`;
    case "unknown":
      return `https://${c.raw}`;
  }
}

/**
 * Public origin for an app by registry subdomain key, e.g. `command-center` →
 * `https://command-center.apps.lastrev.com` (no trailing slash). Hardcoded to
 * the production apps cluster — used by login redirects when no host context
 * is available.
 */
export function productionAppOrigin(subdomainKey: string): string {
  return `https://${subdomainKey}.${APPS_ROOT_DOMAIN}`;
}
