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
