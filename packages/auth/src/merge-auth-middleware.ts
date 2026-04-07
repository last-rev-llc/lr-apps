import { NextResponse } from "next/server";

/**
 * Overlay rolling-session / cookie headers from Auth0 onto another middleware response.
 * @see https://github.com/auth0/nextjs-auth0/blob/main/EXAMPLES.md#combining-middleware
 */
export function mergeAuthMiddlewareResponse(
  authResponse: NextResponse,
  inner: NextResponse,
): NextResponse {
  const shouldProceed = inner.headers.get("x-middleware-next");

  for (const [key, value] of authResponse.headers.entries()) {
    const k = key.toLowerCase();
    if (k === "x-middleware-next" && !shouldProceed) {
      continue;
    }
    if (k === "set-cookie") {
      inner.headers.append(key, value);
    } else {
      inner.headers.set(key, value);
    }
  }

  return inner;
}
