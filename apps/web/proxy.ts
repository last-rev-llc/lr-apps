import { type NextRequest, NextResponse } from "next/server";
import {
  getAuth0ClientForHost,
  getHostFromRequestHeaders,
} from "@repo/auth/auth0-factory";
import { mergeAuthMiddlewareResponse } from "@repo/auth/merge-auth-middleware";
import { resolveSubdomain, getRouteForSubdomain } from "./lib/proxy-utils";

export async function proxy(request: NextRequest) {
  const host = getHostFromRequestHeaders(request.headers);
  const auth0 = getAuth0ClientForHost(host);
  const authResponse = await auth0.middleware(request);

  if (request.nextUrl.pathname.startsWith("/auth")) {
    return authResponse;
  }

  const withAuth = (inner: NextResponse) =>
    mergeAuthMiddlewareResponse(authResponse, inner);

  if (process.env.NODE_ENV === "development") {
    const appParam = request.nextUrl.searchParams.get("app");
    if (appParam) {
      const routePath = getRouteForSubdomain(appParam);
      if (routePath) {
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

  const hostHeader = request.headers.get("host") ?? "";
  const subdomain = resolveSubdomain(hostHeader);

  if (!subdomain) {
    return withAuth(NextResponse.next({ request }));
  }

  const routePath = getRouteForSubdomain(subdomain);

  if (!routePath) {
    return mergeAuthMiddlewareResponse(
      authResponse,
      NextResponse.redirect(new URL("https://auth.lastrev.com")),
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
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
  ],
};
