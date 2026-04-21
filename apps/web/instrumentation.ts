// Runs once on server boot. Validates the runtime env via apps/web/lib/env.ts
// so a missing required var fails fast (Vercel surfaces it as a build/runtime
// error) instead of silently producing a broken request later. Documented in
// docs/ops/environments.md.

export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { env } = await import("./lib/env");
  env();
}
