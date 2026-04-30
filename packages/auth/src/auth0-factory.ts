import { Auth0Client } from "@auth0/nextjs-auth0/server";
import { NextResponse } from "next/server";
import { log } from "@repo/logger";
import { logAuditEvent } from "@repo/db/audit";
import { createServiceRoleClient } from "@repo/db/service-role";
import { capture } from "@repo/analytics/server";
import { maybeSelfEnrollAfterLogin, appSlugFromReturnTo } from "./self-enroll";
import { appBaseUrlsForHost, sessionCookieDomainForHost } from "./cluster-host";

const ALLOWED_RETURN_HOSTS = [
  "apps.lastrev.com",
  "apps.lastrev.localhost",
];

/**
 * Validates that returnTo is a safe redirect target:
 * - Relative paths (starting with `/`) are always allowed
 * - Absolute URLs must be under a known app domain
 * - Everything else is rejected (returns false)
 */
export function isSafeReturnTo(returnTo: string): boolean {
  if (!returnTo) return false;
  // Reject protocol-relative URLs like "//evil.com" which resolve to external domains
  if (returnTo.startsWith("//")) return false;
  if (returnTo.startsWith("/")) return true;
  try {
    const url = new URL(returnTo);
    return ALLOWED_RETURN_HOSTS.some(
      (d) => url.hostname === d || url.hostname.endsWith(`.${d}`),
    );
  } catch {
    return false;
  }
}

export type ProductAuth0Config = {
  clientId: string;
  clientSecret: string;
};

function parseProductsMap(): Record<string, ProductAuth0Config> | null {
  const raw = process.env.AUTH0_PRODUCTS_JSON?.trim();
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Record<string, ProductAuth0Config>;
  } catch {
    throw new Error("AUTH0_PRODUCTS_JSON is not valid JSON");
  }
}

function parseAllowList(): string[] {
  const combined =
    process.env.AUTH0_ALLOWED_BASE_URLS?.trim() ||
    process.env.APP_BASE_URL?.trim();
  if (!combined) return [];
  return combined
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function resolveProductConfig(host: string): ProductAuth0Config {
  const map = parseProductsMap();
  const h = host.toLowerCase();
  const hostNoPort = h.split(":")[0] ?? h;

  if (map) {
    const fromMap =
      map[h] ?? map[hostNoPort] ?? map.default ?? map["*"];
    if (fromMap?.clientId && fromMap?.clientSecret) {
      return fromMap;
    }
  }

  const clientId = process.env.AUTH0_CLIENT_ID;
  const clientSecret = process.env.AUTH0_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error(
      "Auth0 is not configured: set AUTH0_CLIENT_ID and AUTH0_CLIENT_SECRET, or AUTH0_PRODUCTS_JSON",
    );
  }
  return { clientId, clientSecret };
}

const clientCache = new Map<string, Auth0Client>();

/**
 * Host header value (may include port), e.g. `accounts.apps.lastrev.com` or `localhost:3000`.
 *
 * `Auth0Client` validates that every incoming request's origin is present in
 * its `appBaseUrl` array — otherwise `/auth/login` throws `InvalidConfigurationError`.
 * Static env-var lists fall out of date as new subdomains land, so we always
 * union the per-host derived origins (current host + cluster auth hub) into
 * whatever `AUTH0_ALLOWED_BASE_URLS` / `APP_BASE_URL` provides. The cache is
 * keyed by `clientId|host` because the client's `appBaseUrl` is fixed at
 * construction; each host needs its own cached client.
 *
 * Also sets `session.cookie.domain` to the cluster's parent domain so the
 * `__session` cookie set by `/auth/callback` on the auth hub is visible on
 * every app subdomain in the cluster — without this, the cross-host redirect
 * after login lands on a host that doesn't carry the session and bounces
 * straight back to `/login`.
 *
 * Use one Auth0 tenant; use AUTH0_PRODUCTS_JSON for per-host client ID/secret
 * (separate Auth0 applications per product).
 */
export function getAuth0ClientForHost(host: string): Auth0Client {
  const cfg = resolveProductConfig(host);
  const cacheKey = `${cfg.clientId}|${host.toLowerCase()}`;
  const existing = clientCache.get(cacheKey);
  if (existing) return existing;

  const envEntries = parseAllowList();
  const derived = appBaseUrlsForHost(host);
  const appBaseUrl = [...new Set([...derived, ...envEntries])];
  const cookieDomain = sessionCookieDomainForHost(host);

  const client = new Auth0Client({
    domain: process.env.AUTH0_DOMAIN,
    clientId: cfg.clientId,
    clientSecret: cfg.clientSecret,
    secret: process.env.AUTH0_SECRET,
    appBaseUrl,
    session: {
      cookie: { domain: cookieDomain },
    },
    async onCallback(error, ctx, session) {
      const appBaseUrl =
        ctx.appBaseUrl ??
        process.env.APP_BASE_URL?.split(",")[0]?.trim() ??
        "http://localhost:3000";

      if (error) {
        await logAuditEvent(createServiceRoleClient(), {
          action: "auth.login.failed",
          metadata: { reason: error.message, returnTo: ctx.returnTo ?? null },
        });
        const u = new URL("/login", appBaseUrl);
        u.searchParams.set("error", error.message);
        // Preserve the redirect param so the user can retry without losing their destination
        const slug = appSlugFromReturnTo(ctx.returnTo);
        if (slug) {
          u.searchParams.set("redirect", slug);
        }
        return NextResponse.redirect(u);
      }

      // Handle expired/invalid session: redirect to login with session_expired error
      if (!session?.user?.sub) {
        await logAuditEvent(createServiceRoleClient(), {
          action: "auth.login.failed",
          metadata: { reason: "session_expired", returnTo: ctx.returnTo ?? null },
        });
        const u = new URL("/login", appBaseUrl);
        u.searchParams.set("error", "session_expired");
        const slug = appSlugFromReturnTo(ctx.returnTo);
        if (slug) {
          u.searchParams.set("redirect", slug);
        }
        return NextResponse.redirect(u);
      }

      try {
        await maybeSelfEnrollAfterLogin(session.user.sub, ctx.returnTo);
      } catch (e) {
        log.error("auth self-enroll skipped", {
          err: e,
          userId: session.user.sub,
          returnTo: ctx.returnTo,
        });
      }

      await logAuditEvent(createServiceRoleClient(), {
        userId: session.user.sub,
        action: "auth.login.succeeded",
        metadata: { returnTo: ctx.returnTo ?? null },
      });

      await capture(session.user.sub, "login", { method: "email" });

      // Validate returnTo to prevent open-redirect
      const rawTarget = ctx.returnTo || "/my-apps";
      const target = isSafeReturnTo(rawTarget) ? rawTarget : "/my-apps";
      if (target !== rawTarget) {
        log.warn("auth rejected unsafe returnTo", { rawTarget });
      }
      return NextResponse.redirect(new URL(target, appBaseUrl));
    },
  });

  clientCache.set(cacheKey, client);
  return client;
}

export function getHostFromRequestHeaders(headers: Headers): string {
  const xf = headers.get("x-forwarded-host");
  if (xf) {
    return xf.split(",")[0]?.trim() ?? "localhost:3000";
  }
  return headers.get("host") ?? "localhost:3000";
}
