import { type NextRequest, NextResponse } from "next/server";
import {
  getAuth0ClientForHost,
  getHostFromRequestHeaders,
} from "@repo/auth/auth0-factory";
import { mergeAuthMiddlewareResponse } from "@repo/auth/merge-auth-middleware";
import {
  resolveSubdomain,
  getRouteForSubdomain,
  isVercelPreviewHost,
} from "./lib/proxy-utils";
import { appOrigin, authHubOrigin } from "./lib/app-host";
import { applyCspHeader } from "./lib/csp";
import {
  applyRateLimitHeaders,
  getClientIp,
  rateLimit,
  rateLimitNextResponse,
} from "./lib/rate-limit";
import {
  csrfFailureNextResponse,
  ensureCsrfCookie,
  shouldValidateCsrf,
  validateCsrf,
} from "./lib/csrf";
import { withSpan } from "./lib/otel";

const AUTH_RATE_LIMIT = 10;
const AUTH_RATE_WINDOW_MS = 60_000;

export async function proxy(request: NextRequest): Promise<NextResponse> {
  return withSpan(
    "proxy.auth",
    { "request.pathname": request.nextUrl.pathname },
    () => proxyImpl(request),
  );
}

const LEGACY_IDEAS_PATH = "/apps/command-center/ideas";

async function proxyImpl(request: NextRequest): Promise<NextResponse> {
  if (shouldValidateCsrf(request)) {
    const csrf = validateCsrf(request);
    if (!csrf.ok) {
      return applyCspHeader(csrfFailureNextResponse(csrf.reason));
    }
  }

  const hostHeaderForRedirect = request.headers.get("host") ?? "";
  const pathname = request.nextUrl.pathname;
  if (
    pathname === LEGACY_IDEAS_PATH ||
    pathname.startsWith(`${LEGACY_IDEAS_PATH}/`)
  ) {
    const tail = pathname.slice(LEGACY_IDEAS_PATH.length) || "/";
    const target = new URL(
      `${appOrigin({ subdomain: "ideas" }, hostHeaderForRedirect)}${tail}${request.nextUrl.search}`,
    );
    return applyCspHeader(NextResponse.redirect(target, 301));
  }

  const host = getHostFromRequestHeaders(request.headers);
  const auth0 = getAuth0ClientForHost(host);

  if (request.nextUrl.pathname.startsWith("/auth")) {
    const ip = getClientIp(request.headers);
    const result = rateLimit(
      `auth:${ip}`,
      AUTH_RATE_LIMIT,
      AUTH_RATE_WINDOW_MS,
    );
    if (!result.allowed) {
      return applyCspHeader(rateLimitNextResponse(result));
    }
    const authResponse = await withSpan("auth.session_check", {}, () =>
      auth0.middleware(request),
    );
    applyRateLimitHeaders(authResponse, result);
    return applyCspHeader(authResponse);
  }

  const authResponse = await withSpan("auth.session_check", {}, () =>
    auth0.middleware(request),
  );

  const withAuth = (inner: NextResponse) =>
    applyCspHeader(
      ensureCsrfCookie(
        mergeAuthMiddlewareResponse(authResponse, inner),
        request,
      ),
    );

  const hostHeader = request.headers.get("host") ?? "";
  const isPreview = isVercelPreviewHost(hostHeader);

  // Honor `?app=<slug>` in development OR on Vercel preview hosts.
  // Preview hosts share a single domain per branch, so subdomain routing
  // cannot work — callers append `?app=<slug>` to choose an app.
  if (process.env.NODE_ENV === "development" || isPreview) {
    const appParam = request.nextUrl.searchParams.get("app");
    if (appParam) {
      const routePath = getRouteForSubdomain(appParam);
      if (routePath !== null) {
        const devPathname = request.nextUrl.pathname;
        const url = request.nextUrl.clone();
        url.searchParams.delete("app");
        url.pathname = `${routePath}${url.pathname}`;
        const devHeaders = new Headers(request.headers);
        devHeaders.set("x-app-pathname", devPathname);
        const rewrite = NextResponse.rewrite(url, {
          request: { headers: devHeaders },
        });
        return withAuth(rewrite);
      }
    }
  }

  // Preview hosts without an explicit ?app=<slug> render the root and
  // must NOT redirect to the auth hub (auth.lastrev.com), which is the
  // production behavior for unknown subdomains.
  if (isPreview) {
    return withAuth(NextResponse.next({ request }));
  }

  return withSpan(
    "proxy.redirect_decision",
    { "request.host": hostHeader },
    async () => {
      const subdomain = resolveSubdomain(hostHeader);

      if (!subdomain) {
        return withAuth(NextResponse.next({ request }));
      }

      const routePath = getRouteForSubdomain(subdomain);

      if (routePath === null) {
        return applyCspHeader(
          mergeAuthMiddlewareResponse(
            authResponse,
            NextResponse.redirect(new URL(authHubOrigin(hostHeader))),
          ),
        );
      }

      const originalPathname = request.nextUrl.pathname;
      const url = request.nextUrl.clone();
      url.pathname = `${routePath}${url.pathname}`;
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set("x-app-pathname", originalPathname);
      const rewrite = NextResponse.rewrite(url, {
        request: { headers: requestHeaders },
      });
      return withAuth(rewrite);
    },
  );
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
  ],
};
