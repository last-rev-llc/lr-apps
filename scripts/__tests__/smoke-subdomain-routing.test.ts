import { describe, it, expect } from "vitest";
import {
  checkAuthHubRedirect,
  checkCsp,
  checkCsrfCookie,
  checkRateLimitHeaders,
  expectedAuthHubHost,
  isStatusOk,
} from "../smoke-subdomain-routing.ts";

describe("expectedAuthHubHost", () => {
  it("anchors auth on the same cluster as the apps domain", () => {
    expect(expectedAuthHubHost("apps.lastrev.com")).toBe("auth.apps.lastrev.com");
  });

  it("works for legacy and staging clusters too", () => {
    expect(expectedAuthHubHost("lastrev.com")).toBe("auth.lastrev.com");
    expect(expectedAuthHubHost("apps-staging.lastrev.com")).toBe(
      "auth.apps-staging.lastrev.com",
    );
  });
});

describe("isStatusOk", () => {
  it("accepts 2xx and 3xx", () => {
    expect(isStatusOk(200).ok).toBe(true);
    expect(isStatusOk(302).ok).toBe(true);
  });

  it("rejects 4xx/5xx", () => {
    expect(isStatusOk(404).ok).toBe(false);
    expect(isStatusOk(500).ok).toBe(false);
  });
});

describe("checkCsp", () => {
  it("passes when CSP header is present and includes default-src", () => {
    const h = new Headers({
      "content-security-policy":
        "default-src 'self'; script-src 'self'; style-src 'self'",
    });
    expect(checkCsp(h).ok).toBe(true);
  });

  it("accepts report-only as a valid form", () => {
    const h = new Headers({
      "content-security-policy-report-only": "default-src 'self'",
    });
    expect(checkCsp(h).ok).toBe(true);
  });

  it("fails when CSP header is missing", () => {
    expect(checkCsp(new Headers()).ok).toBe(false);
  });

  it("fails when CSP header is malformed (no default-src)", () => {
    const h = new Headers({ "content-security-policy": "img-src 'self'" });
    expect(checkCsp(h).ok).toBe(false);
  });
});

describe("checkCsrfCookie", () => {
  it("passes when csrf_token cookie is set with Path=/", () => {
    const result = checkCsrfCookie([
      "csrf_token=abc123; Path=/; SameSite=Lax",
    ]);
    expect(result.ok).toBe(true);
  });

  it("fails when csrf_token cookie is missing", () => {
    const result = checkCsrfCookie([
      "appSession=xyz; Path=/; HttpOnly",
    ]);
    expect(result.ok).toBe(false);
  });

  it("fails when csrf_token cookie is not path-scoped to /", () => {
    const result = checkCsrfCookie([
      "csrf_token=abc; Path=/auth; SameSite=Lax",
    ]);
    expect(result.ok).toBe(false);
  });
});

describe("checkRateLimitHeaders", () => {
  it("passes when X-RateLimit-* trio is present", () => {
    const h = new Headers({
      "x-ratelimit-limit": "10",
      "x-ratelimit-remaining": "9",
      "x-ratelimit-reset": "1700000000",
    });
    expect(checkRateLimitHeaders(h).ok).toBe(true);
  });

  it("fails when any of the trio is missing", () => {
    const h = new Headers({
      "x-ratelimit-limit": "10",
      "x-ratelimit-remaining": "9",
      // no -reset
    });
    expect(checkRateLimitHeaders(h).ok).toBe(false);
  });
});

describe("checkAuthHubRedirect", () => {
  function res(status: number, location?: string) {
    const headers = new Headers();
    if (location) headers.set("location", location);
    return {
      status,
      url: "https://accounts.apps.lastrev.com/",
      headers,
      setCookies: [],
    };
  }

  it("passes 200-class through without checking redirect", () => {
    expect(checkAuthHubRedirect(res(200), "auth.apps.lastrev.com").ok).toBe(true);
  });

  it("passes when 302 lands on the expected auth hub", () => {
    const r = res(302, "https://auth.apps.lastrev.com/auth/login?returnTo=/");
    expect(checkAuthHubRedirect(r, "auth.apps.lastrev.com").ok).toBe(true);
  });

  it("fails when 302 lands on a different host", () => {
    const r = res(302, "https://evil.example.com/login");
    const result = checkAuthHubRedirect(r, "auth.apps.lastrev.com");
    expect(result.ok).toBe(false);
    expect(result.detail).toContain("evil.example.com");
  });

  it("fails when redirect lacks a Location header", () => {
    expect(checkAuthHubRedirect(res(302), "auth.apps.lastrev.com").ok).toBe(false);
  });

  it("resolves relative Location against the request URL", () => {
    const r = res(302, "/auth/login");
    // relative resolves to the request host, not the auth hub
    expect(checkAuthHubRedirect(r, "auth.apps.lastrev.com").ok).toBe(false);
  });
});
