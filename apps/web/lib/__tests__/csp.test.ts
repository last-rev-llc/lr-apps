import { describe, it, expect, afterEach, vi } from "vitest";
import { NextResponse } from "next/server";
import {
  buildCspHeader,
  applyCspHeader,
  cspHeaderName,
  isReportOnly,
} from "../csp";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("buildCspHeader", () => {
  it("includes the standard directives", () => {
    const header = buildCspHeader();
    expect(header).toContain("default-src 'self'");
    expect(header).toContain("frame-ancestors 'none'");
    expect(header).toContain("base-uri 'self'");
    expect(header).toContain("form-action 'self'");
    expect(header).toContain("img-src 'self' data: blob:");
  });

  it("blocks 'unsafe-inline' for script-src in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    const header = buildCspHeader();
    const scriptSrc = header.split(";").find((d) => d.trim().startsWith("script-src"));
    expect(scriptSrc).toBeDefined();
    expect(scriptSrc).not.toContain("'unsafe-inline'");
    expect(scriptSrc).toContain("'self'");
  });

  it("allows 'unsafe-inline' for script-src outside production", () => {
    vi.stubEnv("NODE_ENV", "development");
    const header = buildCspHeader();
    const scriptSrc = header.split(";").find((d) => d.trim().startsWith("script-src"));
    expect(scriptSrc).toContain("'unsafe-inline'");
  });

  it("merges connect-src hosts from .csp-defaults.json", () => {
    const header = buildCspHeader();
    expect(header).toContain("https://fzmhqcgzvgtvkswpwruc.supabase.co");
    expect(header).toContain("https://lregiwsovpmljxjvrrsc.supabase.co");
    expect(header).toContain("https://*.auth0.com");
  });
});

describe("cspHeaderName / isReportOnly", () => {
  it("uses Content-Security-Policy by default", () => {
    expect(cspHeaderName(false)).toBe("Content-Security-Policy");
  });

  it("switches to report-only when CSP_REPORT_ONLY=true", () => {
    vi.stubEnv("CSP_REPORT_ONLY", "true");
    expect(isReportOnly()).toBe(true);
    expect(cspHeaderName()).toBe("Content-Security-Policy-Report-Only");
  });

  it("treats CSP_REPORT_ONLY=1 as truthy", () => {
    vi.stubEnv("CSP_REPORT_ONLY", "1");
    expect(isReportOnly()).toBe(true);
  });
});

describe("applyCspHeader", () => {
  it("sets the CSP header on the response", () => {
    const res = NextResponse.next();
    applyCspHeader(res);
    expect(res.headers.get("Content-Security-Policy")).toBeTruthy();
  });

  it("uses the report-only header name when configured", () => {
    vi.stubEnv("CSP_REPORT_ONLY", "true");
    const res = NextResponse.next();
    applyCspHeader(res);
    expect(res.headers.get("Content-Security-Policy")).toBeNull();
    expect(res.headers.get("Content-Security-Policy-Report-Only")).toBeTruthy();
  });
});
