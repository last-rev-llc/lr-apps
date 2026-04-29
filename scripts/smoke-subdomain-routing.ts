#!/usr/bin/env node
// End-to-end smoke test for the *.apps.lastrev.com subdomain routing cutover.
//
// Walks a list of representative apps (free, pro, and auth-required) and asserts
// that each one:
//   - serves a 2xx response, OR redirects (3xx) to the auth hub on the same cluster
//   - emits a Content-Security-Policy header
//   - issues a CSRF cookie (csrf_token=…)
//   - returns rate-limit headers (X-RateLimit-Limit / Remaining / Reset) on /auth/*
//
// Defaults to the production apps cluster `apps.lastrev.com`. Override for
// staging or preview via `SMOKE_BASE_DOMAIN` (or `--base-domain=`).
//
// Usage:
//   pnpm tsx scripts/smoke-subdomain-routing.ts
//   SMOKE_BASE_DOMAIN=apps-staging.lastrev.com pnpm tsx scripts/smoke-subdomain-routing.ts
//   pnpm tsx scripts/smoke-subdomain-routing.ts --apps=accounts,command-center,uptime
//   pnpm tsx scripts/smoke-subdomain-routing.ts --legacy   # against legacy *.lastrev.com
//
// Exit code: 0 if every check passes, 1 otherwise.

interface CheckResult {
  ok: boolean;
  detail?: string;
}

interface AppRow {
  slug: string;
  url: string;
  status: number | "ERR";
  root: CheckResult;
  csp: CheckResult;
  csrf: CheckResult;
  rateLimit: CheckResult;
  authHub: CheckResult;
}

interface RawResponse {
  status: number;
  url: string;
  headers: Headers;
  setCookies: string[];
}

const DEFAULT_BASE_DOMAIN = "apps.lastrev.com";
const DEFAULT_LEGACY_BASE_DOMAIN = "lastrev.com";
const DEFAULT_APPS = ["accounts", "command-center", "uptime"];

function parseArgs(argv: string[]): {
  baseDomain: string;
  apps: string[];
  scheme: "https" | "http";
  legacy: boolean;
} {
  const arg = (k: string): string | undefined =>
    argv.find((a) => a.startsWith(`${k}=`))?.slice(k.length + 1);

  const legacy = argv.includes("--legacy");
  const fallbackBase = legacy ? DEFAULT_LEGACY_BASE_DOMAIN : DEFAULT_BASE_DOMAIN;
  const baseDomain =
    arg("--base-domain") ?? process.env.SMOKE_BASE_DOMAIN ?? fallbackBase;
  const apps = (arg("--apps") ?? process.env.SMOKE_APPS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const scheme: "https" | "http" =
    (arg("--scheme") as "https" | "http" | undefined) ??
    (baseDomain.endsWith(".localhost") ||
    baseDomain === "localhost" ||
    baseDomain.endsWith(":3000")
      ? "http"
      : "https");

  return {
    baseDomain,
    apps: apps.length ? apps : DEFAULT_APPS,
    scheme,
    legacy,
  };
}

async function fetchRaw(url: string): Promise<RawResponse | null> {
  try {
    const res = await fetch(url, { redirect: "manual" });
    const setCookies = collectSetCookies(res.headers);
    return { status: res.status, url, headers: res.headers, setCookies };
  } catch {
    return null;
  }
}

function collectSetCookies(headers: Headers): string[] {
  const getSetCookie = (
    headers as Headers & { getSetCookie?: () => string[] }
  ).getSetCookie;
  if (typeof getSetCookie === "function") {
    return getSetCookie.call(headers);
  }
  const single = headers.get("set-cookie");
  return single ? [single] : [];
}

export function expectedAuthHubHost(baseDomain: string): string {
  return `auth.${baseDomain}`;
}

export function isStatusOk(status: number): CheckResult {
  if (status >= 200 && status < 400) return { ok: true };
  return { ok: false, detail: `unexpected status ${status}` };
}

export function checkCsp(headers: Headers): CheckResult {
  const csp =
    headers.get("content-security-policy") ??
    headers.get("content-security-policy-report-only");
  if (!csp) return { ok: false, detail: "missing CSP header" };
  if (!csp.includes("default-src")) {
    return { ok: false, detail: "CSP present but missing default-src" };
  }
  return { ok: true };
}

export function checkCsrfCookie(setCookies: string[]): CheckResult {
  const match = setCookies.find((c) => c.split("=")[0]?.trim() === "csrf_token");
  if (!match) return { ok: false, detail: "csrf_token cookie not set" };
  if (!/(?:^|;\s*)path=\/(?:$|;)/i.test(match)) {
    return { ok: false, detail: "csrf_token cookie not path-scoped to /" };
  }
  return { ok: true };
}

export function checkRateLimitHeaders(headers: Headers): CheckResult {
  const limit = headers.get("x-ratelimit-limit");
  const remaining = headers.get("x-ratelimit-remaining");
  const reset = headers.get("x-ratelimit-reset");
  if (!limit || !remaining || !reset) {
    return {
      ok: false,
      detail: `missing rate-limit header(s) (limit=${limit ?? "—"}, remaining=${
        remaining ?? "—"
      }, reset=${reset ?? "—"})`,
    };
  }
  return { ok: true };
}

export function checkAuthHubRedirect(
  res: RawResponse,
  expectedHubHost: string,
): CheckResult {
  if (res.status < 300 || res.status >= 400) {
    return { ok: true, detail: "no redirect (200-class)" };
  }
  const location = res.headers.get("location");
  if (!location) {
    return { ok: false, detail: "redirect without Location header" };
  }
  try {
    const target = new URL(location, res.url);
    if (target.host === expectedHubHost) return { ok: true };
    return {
      ok: false,
      detail: `redirected to ${target.host}, expected ${expectedHubHost}`,
    };
  } catch (e) {
    return { ok: false, detail: `invalid Location: ${String(e)}` };
  }
}

async function checkApp(
  slug: string,
  baseDomain: string,
  scheme: string,
): Promise<AppRow> {
  const url = `${scheme}://${slug}.${baseDomain}/`;
  const authUrl = `${scheme}://${slug}.${baseDomain}/auth/login`;
  const expectedHub = expectedAuthHubHost(baseDomain);

  const root = await fetchRaw(url);
  const auth = await fetchRaw(authUrl);

  if (!root) {
    return {
      slug,
      url,
      status: "ERR",
      root: { ok: false, detail: "fetch failed (DNS / TLS / network)" },
      csp: { ok: false, detail: "no response" },
      csrf: { ok: false, detail: "no response" },
      rateLimit: { ok: false, detail: "no response" },
      authHub: { ok: false, detail: "no response" },
    };
  }

  return {
    slug,
    url,
    status: root.status,
    root: isStatusOk(root.status),
    csp: checkCsp(root.headers),
    csrf: checkCsrfCookie(root.setCookies),
    rateLimit: auth
      ? checkRateLimitHeaders(auth.headers)
      : { ok: false, detail: "auth probe failed" },
    authHub: checkAuthHubRedirect(root, expectedHub),
  };
}

function fmt(check: CheckResult): string {
  return check.ok ? "✓" : `✗ (${check.detail ?? "fail"})`;
}

function printTable(rows: AppRow[]): void {
  const header = ["app", "status", "root", "CSP", "CSRF", "rate-limit", "authHub"];
  const data = rows.map((r) => [
    r.slug,
    String(r.status),
    fmt(r.root),
    fmt(r.csp),
    fmt(r.csrf),
    fmt(r.rateLimit),
    fmt(r.authHub),
  ]);

  const widths = header.map((h, i) =>
    Math.max(h.length, ...data.map((row) => row[i].length)),
  );

  const pad = (cells: string[]): string =>
    cells.map((c, i) => c.padEnd(widths[i])).join("  ");

  console.log(pad(header));
  console.log(pad(widths.map((w) => "-".repeat(w))));
  for (const row of data) console.log(pad(row));
}

async function main(): Promise<void> {
  // Skip when invoked as `node --experimental-strip-types script.ts --check-only`
  // (used by tests to verify the script parses without side effects).
  if (process.argv.includes("--check-only")) {
    console.log("smoke-subdomain-routing: --check-only OK");
    return;
  }

  const { baseDomain, apps, scheme, legacy } = parseArgs(process.argv.slice(2));

  console.log(
    `Smoke-testing ${apps.length} apps against ${scheme}://*.${baseDomain}` +
      (legacy ? " (legacy cluster)" : "") +
      "\n",
  );

  const rows: AppRow[] = [];
  for (const slug of apps) {
    rows.push(await checkApp(slug, baseDomain, scheme));
  }

  printTable(rows);

  const allOk = rows.every(
    (r) => r.root.ok && r.csp.ok && r.csrf.ok && r.rateLimit.ok && r.authHub.ok,
  );
  console.log("");
  console.log(allOk ? "PASS — all checks green" : "FAIL — see ✗ rows above");
  process.exit(allOk ? 0 : 1);
}

const isMain = import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  void main();
}
