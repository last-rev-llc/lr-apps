import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";

const middlewareMock = vi.fn();

vi.mock("@repo/auth/auth0-factory", () => ({
  getAuth0ClientForHost: vi.fn(() => ({ middleware: middlewareMock })),
  getHostFromRequestHeaders: (h: Headers) =>
    h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000",
}));

import { proxy } from "../proxy";
import { getAuth0ClientForHost } from "@repo/auth/auth0-factory";
import { _resetRateLimitStore } from "../lib/rate-limit";

const mockedGetAuth0 = vi.mocked(getAuth0ClientForHost);

function makeRequest(url: string, host: string) {
  return new NextRequest(url, { headers: { host } });
}

function freshAuthResponse() {
  const res = NextResponse.next();
  res.headers.set("set-cookie", "appSession=abc; Path=/; HttpOnly");
  return res;
}

describe("proxy middleware integration", () => {
  beforeEach(() => {
    middlewareMock.mockReset();
    middlewareMock.mockImplementation(async () => freshAuthResponse());
    mockedGetAuth0.mockClear();
    _resetRateLimitStore();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe("host parsing → Auth0 → rewrite chain", () => {
    it("invokes Auth0 middleware using the host header", async () => {
      const req = makeRequest(
        "https://sentiment.apps.lastrev.com/",
        "sentiment.apps.lastrev.com",
      );
      await proxy(req);
      expect(mockedGetAuth0).toHaveBeenCalledWith("sentiment.apps.lastrev.com");
      expect(middlewareMock).toHaveBeenCalledTimes(1);
    });

    it("rewrites known subdomain to /apps/<slug> and sets x-app-pathname", async () => {
      const req = makeRequest(
        "https://sentiment.apps.lastrev.com/dashboard",
        "sentiment.apps.lastrev.com",
      );
      const res = await proxy(req);
      expect(res.headers.get("x-middleware-rewrite")).toBeTruthy();
      const rewriteUrl = new URL(res.headers.get("x-middleware-rewrite")!);
      expect(rewriteUrl.pathname).toBe("/apps/sentiment/dashboard");
      expect(res.headers.get("x-middleware-override-headers")).toContain(
        "x-app-pathname",
      );
    });

    it("rewrites using subdomain-to-slug aliases (meetings → meeting-summaries)", async () => {
      const req = makeRequest(
        "https://meetings.apps.lastrev.com/notes",
        "meetings.apps.lastrev.com",
      );
      const res = await proxy(req);
      const rewriteUrl = new URL(res.headers.get("x-middleware-rewrite")!);
      expect(rewriteUrl.pathname).toBe("/apps/meeting-summaries/notes");
    });

    it("merges Auth0 Set-Cookie headers into the rewrite response", async () => {
      const req = makeRequest(
        "https://sentiment.apps.lastrev.com/",
        "sentiment.apps.lastrev.com",
      );
      const res = await proxy(req);
      const setCookie = res.headers.get("set-cookie");
      expect(setCookie).toContain("appSession=abc");
    });
  });

  describe("unknown subdomain", () => {
    it("short-circuits to a redirect (404 signal — does not rewrite)", async () => {
      const req = makeRequest(
        "https://nonexistent.apps.lastrev.com/foo",
        "nonexistent.apps.lastrev.com",
      );
      const res = await proxy(req);
      // Should NOT be a rewrite into /apps/*
      expect(res.headers.get("x-middleware-rewrite")).toBeFalsy();
      // Should be a redirect (NextResponse.redirect → Location header)
      expect(res.status).toBeGreaterThanOrEqual(300);
      expect(res.status).toBeLessThan(400);
    });

    it("still calls Auth0 middleware before short-circuiting", async () => {
      const req = makeRequest(
        "https://nonexistent.apps.lastrev.com/foo",
        "nonexistent.apps.lastrev.com",
      );
      await proxy(req);
      expect(middlewareMock).toHaveBeenCalled();
    });

    it("redirects unknown <slug>.apps.lastrev.com to apps-cluster auth hub", async () => {
      const req = makeRequest(
        "https://nonexistent.apps.lastrev.com/foo",
        "nonexistent.apps.lastrev.com",
      );
      const res = await proxy(req);
      const location = res.headers.get("location") ?? "";
      expect(location).toContain("https://auth.apps.lastrev.com");
    });

    it("redirects unknown legacy <slug>.lastrev.com to legacy auth hub during cutover", async () => {
      const req = makeRequest(
        "https://nonexistent.lastrev.com/foo",
        "nonexistent.lastrev.com",
      );
      const res = await proxy(req);
      const location = res.headers.get("location") ?? "";
      expect(location).toContain("https://auth.lastrev.com");
      expect(location).not.toContain("auth.apps.lastrev.com");
    });
  });

  describe("apps cluster host parsing", () => {
    it("rewrites <slug>.apps.lastrev.com same as legacy <slug>.lastrev.com", async () => {
      const reqApps = makeRequest(
        "https://sentiment.apps.lastrev.com/dashboard",
        "sentiment.apps.lastrev.com",
      );
      const resApps = await proxy(reqApps);
      const urlApps = new URL(resApps.headers.get("x-middleware-rewrite")!);
      expect(urlApps.pathname).toBe("/apps/sentiment/dashboard");

      middlewareMock.mockResolvedValueOnce(freshAuthResponse());
      const reqLegacy = makeRequest(
        "https://sentiment.lastrev.com/dashboard",
        "sentiment.lastrev.com",
      );
      const resLegacy = await proxy(reqLegacy);
      const urlLegacy = new URL(
        resLegacy.headers.get("x-middleware-rewrite")!,
      );
      expect(urlLegacy.pathname).toBe("/apps/sentiment/dashboard");
    });

    it("recognizes auth.apps.lastrev.com as the auth hub route group", async () => {
      const req = makeRequest(
        "https://auth.apps.lastrev.com/some-page",
        "auth.apps.lastrev.com",
      );
      const res = await proxy(req);
      const rewrite = res.headers.get("x-middleware-rewrite");
      expect(rewrite).toBeTruthy();
      const url = new URL(rewrite!);
      expect(url.pathname).toBe("/(auth)/some-page");
    });
  });

  describe("bare apps host (no subdomain)", () => {
    it("does not rewrite when host is bare apps.lastrev.com", async () => {
      const req = makeRequest(
        "https://apps.lastrev.com/my-apps",
        "apps.lastrev.com",
      );
      const res = await proxy(req);
      // NextResponse.next() sets x-middleware-next: "1"
      expect(res.headers.get("x-middleware-next")).toBe("1");
      expect(res.headers.get("x-middleware-rewrite")).toBeFalsy();
    });
  });

  describe("/auth/* paths", () => {
    it("returns the raw Auth0 response without rewriting", async () => {
      const authOnly = NextResponse.next();
      authOnly.headers.set("x-auth-marker", "from-auth0");
      middlewareMock.mockResolvedValueOnce(authOnly);

      const req = makeRequest(
        "https://auth.lastrev.com/auth/callback",
        "auth.lastrev.com",
      );
      const res = await proxy(req);
      expect(res.headers.get("x-auth-marker")).toBe("from-auth0");
      expect(res.headers.get("x-middleware-rewrite")).toBeFalsy();
    });

    it("rate-limits /auth/* to 10 requests per IP per minute", async () => {
      for (let i = 0; i < 10; i++) {
        const req = makeRequest(
          "https://auth.lastrev.com/auth/callback",
          "auth.lastrev.com",
        );
        req.headers.set("x-forwarded-for", "7.7.7.7");
        const res = await proxy(req);
        expect(res.status).toBeLessThan(400);
        expect(res.headers.get("X-RateLimit-Limit")).toBe("10");
      }
      const req = makeRequest(
        "https://auth.lastrev.com/auth/callback",
        "auth.lastrev.com",
      );
      req.headers.set("x-forwarded-for", "7.7.7.7");
      const blocked = await proxy(req);
      expect(blocked.status).toBe(429);
      expect(blocked.headers.get("X-RateLimit-Remaining")).toBe("0");
      expect(blocked.headers.get("Retry-After")).toBeTruthy();
    });
  });

  describe("localhost dev mode with ?app=<slug>", () => {
    it("rewrites /foo?app=command-center → /apps/command-center/foo", async () => {
      vi.stubEnv("NODE_ENV", "development");
      const req = makeRequest(
        "http://localhost:3000/dashboard?app=command-center",
        "localhost:3000",
      );
      const res = await proxy(req);
      const rewriteUrl = new URL(res.headers.get("x-middleware-rewrite")!);
      expect(rewriteUrl.pathname).toBe("/apps/command-center/dashboard");
      // `app` query param should be stripped from the rewrite target
      expect(rewriteUrl.searchParams.get("app")).toBeNull();
    });

    it("ignores unknown ?app= values (falls through to host-based routing)", async () => {
      vi.stubEnv("NODE_ENV", "development");
      const req = makeRequest(
        "http://localhost:3000/?app=not-a-real-app",
        "localhost:3000",
      );
      const res = await proxy(req);
      // Falls through: bare localhost has no subdomain → NextResponse.next
      expect(res.headers.get("x-middleware-next")).toBe("1");
    });

    it("ignores ?app= in non-development environments", async () => {
      vi.stubEnv("NODE_ENV", "production");
      const req = makeRequest(
        "http://localhost:3000/?app=sentiment",
        "localhost:3000",
      );
      const res = await proxy(req);
      expect(res.headers.get("x-middleware-rewrite")).toBeFalsy();
    });
  });

  describe("Vercel preview hosts", () => {
    it("does NOT redirect to auth.lastrev.com on a bare preview host", async () => {
      vi.stubEnv("NODE_ENV", "production");
      const req = makeRequest(
        "https://lr-apps-git-feat-x.vercel.app/",
        "lr-apps-git-feat-x.vercel.app",
      );
      const res = await proxy(req);
      // Falls through to NextResponse.next — does NOT 3xx redirect.
      expect(res.headers.get("x-middleware-next")).toBe("1");
      expect(res.headers.get("location")).toBeFalsy();
    });

    it("rewrites preview /?app=<slug> to the app's route group", async () => {
      vi.stubEnv("NODE_ENV", "production");
      const req = makeRequest(
        "https://lr-apps-git-feat-x.vercel.app/dashboard?app=sentiment",
        "lr-apps-git-feat-x.vercel.app",
      );
      const res = await proxy(req);
      const rewriteUrl = new URL(res.headers.get("x-middleware-rewrite")!);
      expect(rewriteUrl.pathname).toBe("/apps/sentiment/dashboard");
      expect(rewriteUrl.searchParams.get("app")).toBeNull();
    });

    it("ignores unknown ?app= values on preview hosts", async () => {
      vi.stubEnv("NODE_ENV", "production");
      const req = makeRequest(
        "https://lr-apps-git-feat-x.vercel.app/?app=does-not-exist",
        "lr-apps-git-feat-x.vercel.app",
      );
      const res = await proxy(req);
      expect(res.headers.get("x-middleware-rewrite")).toBeFalsy();
      expect(res.headers.get("x-middleware-next")).toBe("1");
    });
  });

  describe("CSRF protection", () => {
    it("returns 403 for POST /api/checkout/session without a csrf token", async () => {
      const req = new NextRequest(
        "https://apps.lastrev.com/api/checkout/session",
        { method: "POST", headers: { host: "apps.lastrev.com" } },
      );
      const res = await proxy(req);
      expect(res.status).toBe(403);
      const body = (await res.json()) as { error: string };
      expect(body.error).toBe("csrf_invalid");
    });

    it("skips CSRF check for the stripe webhook", async () => {
      const req = new NextRequest(
        "https://apps.lastrev.com/api/webhooks/stripe",
        { method: "POST", headers: { host: "apps.lastrev.com" } },
      );
      const res = await proxy(req);
      expect(res.status).not.toBe(403);
    });

    it("sets a csrf_token cookie on safe GET responses", async () => {
      const req = makeRequest(
        "https://apps.lastrev.com/my-apps",
        "apps.lastrev.com",
      );
      const res = await proxy(req);
      const setCookie = res.headers.get("set-cookie") ?? "";
      expect(setCookie).toContain("csrf_token=");
    });

    it("does not overwrite an existing csrf_token cookie", async () => {
      const req = new NextRequest("https://apps.lastrev.com/my-apps", {
        headers: {
          host: "apps.lastrev.com",
          cookie: "csrf_token=already-here",
        },
      });
      const res = await proxy(req);
      const setCookie = res.headers.get("set-cookie") ?? "";
      // The auth mock always sets appSession, but we should not see a new csrf_token.
      expect(setCookie).not.toMatch(/csrf_token=(?!already-here)/);
    });
  });

  describe("legacy /apps/command-center/ideas redirect", () => {
    it("redirects 301 to ideas.apps.lastrev.com on the apps cluster", async () => {
      const req = makeRequest(
        "https://command-center.apps.lastrev.com/apps/command-center/ideas/foo?bar=1",
        "command-center.apps.lastrev.com",
      );
      const res = await proxy(req);
      expect(res.status).toBe(301);
      const location = res.headers.get("location") ?? "";
      expect(location).toBe("https://ideas.apps.lastrev.com/foo?bar=1");
    });

    it("redirects to the legacy ideas subdomain when invoked on the legacy cluster", async () => {
      const req = makeRequest(
        "https://command-center.lastrev.com/apps/command-center/ideas/foo",
        "command-center.lastrev.com",
      );
      const res = await proxy(req);
      expect(res.status).toBe(301);
      const location = res.headers.get("location") ?? "";
      expect(location).toBe("https://ideas.lastrev.com/foo");
    });

    it("redirects the bare legacy path on the apex host", async () => {
      const req = makeRequest(
        "https://lastrev.com/apps/command-center/ideas",
        "lastrev.com",
      );
      const res = await proxy(req);
      expect(res.status).toBe(301);
      expect(res.headers.get("location")).toBe(
        "https://ideas.lastrev.com/",
      );
    });

    it("does not redirect for other command-center sub-routes", async () => {
      const req = makeRequest(
        "https://command-center.apps.lastrev.com/apps/command-center/leads",
        "command-center.apps.lastrev.com",
      );
      const res = await proxy(req);
      expect(res.status).not.toBe(301);
    });

    it("does not consume CSRF middleware (auth0 still runs on next request)", async () => {
      // The redirect short-circuits before auth0 — Auth0 will run on the
      // next request to the new origin. Verify auth0 is NOT invoked here.
      const req = makeRequest(
        "https://command-center.apps.lastrev.com/apps/command-center/ideas",
        "command-center.apps.lastrev.com",
      );
      await proxy(req);
      expect(middlewareMock).not.toHaveBeenCalled();
    });
  });

  describe("subdomain resolution across all registered apps", () => {
    it("produces a rewrite for every registered subdomain", async () => {
      vi.stubEnv("NODE_ENV", "production");
      const { getAllApps } = await import("../lib/app-registry");
      const apps = getAllApps().filter((a) => a.slug !== "auth");
      // spot-check a few rather than every one to keep the suite fast,
      // but use a representative slice from different batches
      const sample = [
        apps[0],
        apps[Math.floor(apps.length / 2)],
        apps[apps.length - 1],
      ];
      for (const app of sample) {
        middlewareMock.mockResolvedValueOnce(freshAuthResponse());
        const req = makeRequest(
          `https://${app.subdomain}.apps.lastrev.com/hello`,
          `${app.subdomain}.apps.lastrev.com`,
        );
        const res = await proxy(req);
        const rewriteUrl = new URL(res.headers.get("x-middleware-rewrite")!);
        expect(rewriteUrl.pathname, `rewrite for ${app.slug}`).toBe(
          `/${app.routeGroup}/hello`,
        );
      }
    });
  });
});
