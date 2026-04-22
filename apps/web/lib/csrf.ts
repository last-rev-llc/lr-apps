import { NextResponse, type NextRequest } from "next/server";

export const CSRF_COOKIE = "csrf_token";
export const CSRF_HEADER = "x-csrf-token";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export type CsrfValidation =
  | { ok: true }
  | { ok: false; reason: "missing_cookie" | "missing_header" | "mismatch" };

export function generateCsrfToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export function ensureCsrfCookie(
  response: NextResponse,
  request?: NextRequest,
): NextResponse {
  const existing = request?.cookies.get(CSRF_COOKIE)?.value
    ?? response.cookies.get(CSRF_COOKIE)?.value;
  if (existing) return response;

  const token = generateCsrfToken();
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  // Append directly to avoid ResponseCookies re-serializing and clobbering
  // other Set-Cookie headers (e.g. Auth0's session cookie) that were added
  // via Headers.set / append rather than through the .cookies API.
  response.headers.append(
    "set-cookie",
    `${CSRF_COOKIE}=${token}; Path=/; SameSite=Lax${secure}`,
  );
  return response;
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export function validateCsrf(request: NextRequest | Request): CsrfValidation {
  const method = request.method.toUpperCase();
  if (SAFE_METHODS.has(method)) return { ok: true };

  const cookieHeader = request.headers.get("cookie") ?? "";
  const cookieToken = parseCookieValue(cookieHeader, CSRF_COOKIE);
  if (!cookieToken) return { ok: false, reason: "missing_cookie" };

  const headerToken = request.headers.get(CSRF_HEADER);
  if (!headerToken) return { ok: false, reason: "missing_header" };

  return constantTimeEqual(cookieToken, headerToken)
    ? { ok: true }
    : { ok: false, reason: "mismatch" };
}

function parseCookieValue(cookieHeader: string, name: string): string | null {
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(";");
  for (const part of parts) {
    const [rawKey, ...rawVal] = part.trim().split("=");
    if (rawKey === name) {
      const value = rawVal.join("=");
      try {
        return decodeURIComponent(value);
      } catch {
        return value;
      }
    }
  }
  return null;
}

export function csrfFailureResponse(reason: string): Response {
  return Response.json(
    { error: "csrf_invalid", reason },
    { status: 403 },
  );
}

export function csrfFailureNextResponse(reason: string): NextResponse {
  return NextResponse.json(
    { error: "csrf_invalid", reason },
    { status: 403 },
  );
}

const CSRF_API_PREFIXES = ["/api/"];
const CSRF_SKIP_PATHS = ["/api/webhooks/stripe", "/api/cron/", "/api/health", "/api/vitals"];

export function shouldValidateCsrf(request: NextRequest): boolean {
  const method = request.method.toUpperCase();
  if (SAFE_METHODS.has(method)) return false;

  const pathname = request.nextUrl.pathname;
  if (!CSRF_API_PREFIXES.some((p) => pathname.startsWith(p))) return false;
  if (CSRF_SKIP_PATHS.some((p) => pathname.startsWith(p))) return false;
  return true;
}
