// Runs once on server boot. Validates the runtime env via apps/web/lib/env.ts
// so a missing required var fails fast (Vercel surfaces it as a build/runtime
// error) instead of silently producing a broken request later. Documented in
// docs/ops/environments.md.
//
// Also initializes Sentry for the matching server runtime so errors are captured
// from the very first request — including instrumentation hooks below.
import * as Sentry from "@sentry/nextjs";

export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { env } = await import("./lib/env");
    env();
    await import("./sentry.server.config");
    const { startOtelSdk } = await import("./lib/otel-sdk");
    await startOtelSdk();
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

export const onRequestError = Sentry.captureRequestError;
