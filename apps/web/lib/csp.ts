import type { NextResponse } from "next/server";
import cspDefaults from "../../.csp-defaults.json";

type CspDefaults = {
  csp?: {
    connectSrc?: string[];
  };
};

const CSP_HEADER = "Content-Security-Policy";
const CSP_REPORT_ONLY_HEADER = "Content-Security-Policy-Report-Only";

export type BuildCspOptions = {
  reportOnly?: boolean;
  nonce?: string;
};

export function buildCspHeader(opts: BuildCspOptions = {}): string {
  const defaults = cspDefaults as CspDefaults;
  const extraConnect = defaults.csp?.connectSrc ?? [];
  const connectSrc = ["'self'", ...extraConnect];

  const isProd = process.env.NODE_ENV === "production";
  const scriptSrc: string[] = ["'self'"];
  if (opts.nonce) {
    scriptSrc.push(`'nonce-${opts.nonce}'`, "'strict-dynamic'");
  } else if (!isProd) {
    scriptSrc.push("'unsafe-inline'");
  }

  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    "script-src": scriptSrc,
    "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
    "font-src": ["'self'", "https://fonts.gstatic.com"],
    "img-src": ["'self'", "data:", "blob:"],
    "connect-src": connectSrc,
    "frame-ancestors": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
  };

  void opts.reportOnly;

  return Object.entries(directives)
    .map(([name, values]) => `${name} ${values.join(" ")}`)
    .join("; ");
}

export function cspHeaderName(reportOnly = isReportOnly()): string {
  return reportOnly ? CSP_REPORT_ONLY_HEADER : CSP_HEADER;
}

export function isReportOnly(): boolean {
  return process.env.CSP_REPORT_ONLY === "true" || process.env.CSP_REPORT_ONLY === "1";
}

export function applyCspHeader<T extends NextResponse | Response>(
  response: T,
  opts: { nonce?: string } = {},
): T {
  const reportOnly = isReportOnly();
  response.headers.set(
    cspHeaderName(reportOnly),
    buildCspHeader({ reportOnly, nonce: opts.nonce }),
  );
  return response;
}
