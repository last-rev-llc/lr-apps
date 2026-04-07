/** Production apps live under this DNS name (sub-subdomain per app). */
export const APPS_ROOT_DOMAIN = "apps.lastrev.com";

/** Local dev mirror: map e.g. `command-center.apps.lastrev.localhost` in /etc/hosts. */
export const APPS_ROOT_DOMAIN_LOCAL = "apps.lastrev.localhost";

/**
 * Public origin for an app by registry subdomain key, e.g. `command-center` →
 * `https://command-center.apps.lastrev.com` (no trailing slash).
 */
export function productionAppOrigin(subdomainKey: string): string {
  return `https://${subdomainKey}.${APPS_ROOT_DOMAIN}`;
}
