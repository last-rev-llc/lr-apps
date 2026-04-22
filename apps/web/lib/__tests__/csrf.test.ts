import { describe, it, expect } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import {
  CSRF_COOKIE,
  CSRF_HEADER,
  ensureCsrfCookie,
  generateCsrfToken,
  shouldValidateCsrf,
  validateCsrf,
} from "../csrf";

function buildNextRequest(
  url: string,
  init: { method?: string; cookies?: Record<string, string>; headers?: Record<string, string> } = {},
): NextRequest {
  const headers = new Headers(init.headers);
  if (init.cookies) {
    const serialized = Object.entries(init.cookies)
      .map(([k, v]) => `${k}=${v}`)
      .join("; ");
    headers.set("cookie", serialized);
  }
  return new NextRequest(url, { method: init.method ?? "GET", headers });
}

describe("generateCsrfToken", () => {
  it("produces unique tokens of at least 32 chars", () => {
    const a = generateCsrfToken();
    const b = generateCsrfToken();
    expect(a).not.toBe(b);
    expect(a.length).toBeGreaterThanOrEqual(32);
    expect(b.length).toBeGreaterThanOrEqual(32);
  });

  it("produces url-safe base64 characters only", () => {
    const token = generateCsrfToken();
    expect(/^[A-Za-z0-9_-]+$/.test(token)).toBe(true);
  });
});

describe("validateCsrf", () => {
  it("allows safe methods without token", () => {
    const req = buildNextRequest("https://host.test/api/x", { method: "GET" });
    expect(validateCsrf(req)).toEqual({ ok: true });
  });

  it("rejects POST with no cookie", () => {
    const req = buildNextRequest("https://host.test/api/x", {
      method: "POST",
      headers: { [CSRF_HEADER]: "tok" },
    });
    expect(validateCsrf(req)).toEqual({ ok: false, reason: "missing_cookie" });
  });

  it("rejects POST with cookie but no header", () => {
    const req = buildNextRequest("https://host.test/api/x", {
      method: "POST",
      cookies: { [CSRF_COOKIE]: "tok" },
    });
    expect(validateCsrf(req)).toEqual({ ok: false, reason: "missing_header" });
  });

  it("rejects mismatched token", () => {
    const req = buildNextRequest("https://host.test/api/x", {
      method: "POST",
      cookies: { [CSRF_COOKIE]: "tok" },
      headers: { [CSRF_HEADER]: "different" },
    });
    expect(validateCsrf(req)).toEqual({ ok: false, reason: "mismatch" });
  });

  it("accepts matching cookie + header", () => {
    const token = "abc123";
    const req = buildNextRequest("https://host.test/api/x", {
      method: "POST",
      cookies: { [CSRF_COOKIE]: token },
      headers: { [CSRF_HEADER]: token },
    });
    expect(validateCsrf(req)).toEqual({ ok: true });
  });
});

describe("shouldValidateCsrf", () => {
  it("skips GET requests", () => {
    const req = buildNextRequest("https://host.test/api/checkout/session", {
      method: "GET",
    });
    expect(shouldValidateCsrf(req)).toBe(false);
  });

  it("skips non-API paths", () => {
    const req = buildNextRequest("https://host.test/dashboard", {
      method: "POST",
    });
    expect(shouldValidateCsrf(req)).toBe(false);
  });

  it("skips the stripe webhook (signature-verified instead)", () => {
    const req = buildNextRequest("https://host.test/api/webhooks/stripe", {
      method: "POST",
    });
    expect(shouldValidateCsrf(req)).toBe(false);
  });

  it("validates POST to /api/checkout/session", () => {
    const req = buildNextRequest("https://host.test/api/checkout/session", {
      method: "POST",
    });
    expect(shouldValidateCsrf(req)).toBe(true);
  });
});

describe("ensureCsrfCookie", () => {
  it("sets a csrf_token cookie on the response when none exists", () => {
    const req = buildNextRequest("https://host.test/");
    const res = NextResponse.next();
    ensureCsrfCookie(res, req);
    const setCookie = res.headers.get("set-cookie") ?? "";
    expect(setCookie).toMatch(new RegExp(`${CSRF_COOKIE}=`));
    expect(setCookie).toContain("Path=/");
    expect(setCookie).toContain("SameSite=Lax");
  });

  it("does not set a new cookie when the request already has one", () => {
    const req = buildNextRequest("https://host.test/", {
      cookies: { [CSRF_COOKIE]: "already-set" },
    });
    const res = NextResponse.next();
    ensureCsrfCookie(res, req);
    const setCookie = res.headers.get("set-cookie") ?? "";
    expect(setCookie).not.toMatch(new RegExp(`${CSRF_COOKIE}=`));
  });
});
