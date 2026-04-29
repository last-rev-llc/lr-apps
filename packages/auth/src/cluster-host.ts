/**
 * Auth-hub origin resolution for the Last Rev apps cluster.
 *
 * `/login`, `/signup`, `/unauthorized` only have a real page on the auth hub
 * (e.g. `auth.apps.lastrev.com`). On any other subdomain the proxy rewrites
 * those paths into the app's route group, where the layout's `requireAccess`
 * fires and redirects again — a relative redirect to `/login` would loop.
 *
 * Mirrors the cluster classifier in `apps/web/lib/app-host.ts`. Duplicated
 * here so `packages/auth` can stay free of an `apps/web` dependency.
 */

const APPS_ROOT_DOMAIN = "apps.lastrev.com";
const APPS_ROOT_DOMAIN_LOCAL = "apps.lastrev.localhost";
const LEGACY_ROOT_DOMAIN = "lastrev.com";
const LEGACY_ROOT_DOMAIN_LOCAL = "lastrev.localhost";

function portSuffix(hostHeader: string): string {
  const i = hostHeader.indexOf(":");
  return i === -1 ? "" : hostHeader.slice(i);
}

/**
 * Origin (`scheme://host[:port]`) of the auth hub for the cluster of `host`.
 * - `*.apps.lastrev.com` → `https://auth.apps.lastrev.com`
 * - `*.apps.lastrev.localhost:3000` → `http://auth.apps.lastrev.localhost:3000`
 * - legacy `*.lastrev.com` → `https://auth.lastrev.com`
 * - legacy `*.lastrev.localhost:3000` → `http://auth.lastrev.localhost:3000`
 * - bare `localhost` / `127.0.0.1` → `http://localhost[:port]` (login lives on the same origin in dev)
 * - `*.vercel.app` → `https://<host>` (preview hosts; login lives on the same origin)
 * - anything else → `https://<host>` (treat as same-origin)
 */
export function authHubOriginForHost(host: string): string {
  const raw = host.trim();
  const hostname = raw.split(":")[0].toLowerCase();
  const port = portSuffix(raw);

  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return `http://localhost${port || ":3000"}`;
  }
  if (hostname.endsWith(".vercel.app")) {
    return `https://${raw}`;
  }
  if (hostname === APPS_ROOT_DOMAIN || hostname.endsWith(`.${APPS_ROOT_DOMAIN}`)) {
    return `https://auth.${APPS_ROOT_DOMAIN}`;
  }
  if (
    hostname === APPS_ROOT_DOMAIN_LOCAL ||
    hostname.endsWith(`.${APPS_ROOT_DOMAIN_LOCAL}`)
  ) {
    return `http://auth.${APPS_ROOT_DOMAIN_LOCAL}${port || ":3000"}`;
  }
  if (
    hostname === LEGACY_ROOT_DOMAIN ||
    hostname.endsWith(`.${LEGACY_ROOT_DOMAIN}`)
  ) {
    return `https://auth.${LEGACY_ROOT_DOMAIN}`;
  }
  if (
    hostname === LEGACY_ROOT_DOMAIN_LOCAL ||
    hostname.endsWith(`.${LEGACY_ROOT_DOMAIN_LOCAL}`)
  ) {
    return `http://auth.${LEGACY_ROOT_DOMAIN_LOCAL}${port || ":3000"}`;
  }
  return `https://${raw}`;
}

/**
 * True when `/login`, `/signup`, `/unauthorized` resolve to a real page on the
 * current origin. False on app subdomains (`generations.apps.lastrev.com`),
 * where those paths get rewritten into the app's route group and would loop.
 */
export function isAuthHubOrigin(host: string): boolean {
  const hostname = host.trim().split(":")[0].toLowerCase();
  if (hostname === "localhost" || hostname === "127.0.0.1") return true;
  if (hostname.endsWith(".vercel.app")) return true;
  if (hostname === `auth.${APPS_ROOT_DOMAIN}`) return true;
  if (hostname === `auth.${APPS_ROOT_DOMAIN_LOCAL}`) return true;
  if (hostname === `auth.${LEGACY_ROOT_DOMAIN}`) return true;
  if (hostname === `auth.${LEGACY_ROOT_DOMAIN_LOCAL}`) return true;
  return false;
}

/**
 * Build a same-cluster URL for an auth-hub-only path (`/login`, `/signup`,
 * `/unauthorized`, `/my-apps`). Stays relative when the current origin already
 * is the auth hub (so existing tests and dev flows are unchanged).
 */
export function authHubUrl(host: string, pathAndQuery: string): string {
  if (isAuthHubOrigin(host)) return pathAndQuery;
  return `${authHubOriginForHost(host)}${pathAndQuery}`;
}
