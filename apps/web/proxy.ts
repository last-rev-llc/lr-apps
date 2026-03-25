import { NextRequest, NextResponse } from "next/server";
import { resolveSubdomain, getRouteForSubdomain } from "./lib/proxy-utils";

export function proxy(request: NextRequest) {
  // Dev mode: support ?app=<slug> query param for local testing
  if (process.env.NODE_ENV === "development") {
    const appParam = request.nextUrl.searchParams.get("app");
    if (appParam) {
      const routePath = getRouteForSubdomain(appParam);
      if (routePath) {
        const url = request.nextUrl.clone();
        url.searchParams.delete("app");
        url.pathname = `${routePath}${url.pathname}`;
        return NextResponse.rewrite(url);
      }
    }
  }

  const host = request.headers.get("host") ?? "";
  const subdomain = resolveSubdomain(host);

  if (!subdomain) {
    return NextResponse.next();
  }

  const routePath = getRouteForSubdomain(subdomain);

  if (!routePath) {
    return NextResponse.redirect(new URL("https://auth.lastrev.com"));
  }

  const url = request.nextUrl.clone();
  url.pathname = `${routePath}${url.pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
  ],
};
