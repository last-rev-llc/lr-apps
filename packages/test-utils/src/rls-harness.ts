import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SignJWT } from "jose";

// Default JWT secret for `supabase start` local instances. Override via
// SUPABASE_TEST_JWT_SECRET if your local instance uses a different secret.
const DEFAULT_LOCAL_JWT_SECRET =
  "super-secret-jwt-token-with-at-least-32-characters-long";

export interface RlsHarnessConfig {
  url: string;
  anonKey: string;
  jwtSecret: string;
}

export function getRlsHarnessConfig(): RlsHarnessConfig | null {
  const url = process.env["SUPABASE_TEST_URL"];
  const anonKey = process.env["SUPABASE_TEST_ANON_KEY"];
  if (!url || !anonKey) return null;
  const jwtSecret =
    process.env["SUPABASE_TEST_JWT_SECRET"] ?? DEFAULT_LOCAL_JWT_SECRET;
  return { url, anonKey, jwtSecret };
}

async function signAuthenticatedJwt(
  userId: string,
  jwtSecret: string,
): Promise<string> {
  const secret = new TextEncoder().encode(jwtSecret);
  return await new SignJWT({ sub: userId, role: "authenticated" })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(secret);
}

/**
 * Run a function against a Supabase client whose requests carry an
 * `authenticated` JWT for the given user id, so PostgREST applies RLS as that
 * user. PostgREST sets `request.jwt.claims` and `role = authenticated` from
 * the bearer token on each request — the equivalent of running
 * `SET LOCAL role = 'authenticated'` and
 * `SET LOCAL request.jwt.claims = '{"sub": ...}'` for every query inside `fn`.
 *
 * Requires `SUPABASE_TEST_URL` and `SUPABASE_TEST_ANON_KEY` env vars (typical
 * local-Supabase values from `supabase status`). Throws if those are unset so
 * callers can `skip` their suite using `getRlsHarnessConfig() === null`.
 */
export async function withAuthContext<T>(
  userId: string,
  fn: (client: SupabaseClient) => Promise<T>,
): Promise<T> {
  const config = getRlsHarnessConfig();
  if (!config) {
    throw new Error(
      "withAuthContext requires SUPABASE_TEST_URL and SUPABASE_TEST_ANON_KEY env vars",
    );
  }

  const token = await signAuthenticatedJwt(userId, config.jwtSecret);

  const client = createClient(config.url, config.anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  return fn(client);
}
