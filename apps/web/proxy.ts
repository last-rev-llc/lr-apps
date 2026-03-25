import { type NextRequest, NextResponse } from "next/server";
import { createMiddlewareClient } from "@repo/db/middleware";
import { resolveSubdomain, getRouteForSubdomain } from "./lib/proxy-utils";

export async function proxy(request: NextRequest) {
  // Refresh Supabase session on every request.
  const { response } = await createMiddlewareClient(request);

  // Dev mode: support ?app=<subdomain> query param for local testing
  if (process.env.NODE_ENV === "development") {
    const appParam = request.nextUrl.searchParams.get("app");
    if (appParam) {
      const routePath = getRouteForSubdomain(appParam);
      if (routePath) {
        const url = request.nextUrl.clone();
        url.searchParams.delete("app");
        url.pathname = `${routePath}${url.pathname}`;
        const rewrite = NextResponse.rewrite(url, { request });
        response.cookies.getAll().forEach((cookie) => {
          rewrite.cookies.set(cookie.name, cookie.value);
        });
        return rewrite;
      }
    }
  }

  const host = request.headers.get("host") ?? "";
  const subdomain = resolveSubdomain(host);

  if (!subdomain) {
    return response;
  }

  const routePath = getRouteForSubdomain(subdomain);

  if (!routePath) {
    return NextResponse.redirect(new URL("https://auth.lastrev.com"));
  }

  const url = request.nextUrl.clone();
  url.pathname = `${routePath}${url.pathname}`;
  const rewrite = NextResponse.rewrite(url, { request });
  response.cookies.getAll().forEach((cookie) => {
    rewrite.cookies.set(cookie.name, cookie.value);
  });
  return rewrite;
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
  ],
};
