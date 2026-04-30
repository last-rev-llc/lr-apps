import { z } from "zod";

// Note on Auth0 naming:
// Issue #204 lists AUTH0_BASE_URL and AUTH0_ISSUER_BASE_URL as the expected
// vars, but this codebase uses APP_BASE_URL (the canonical platform URL,
// shared across @repo/auth and the proxy) and AUTH0_DOMAIN (the tenant
// hostname consumed by getAuth0ClientForHost). We keep the codebase names
// to avoid a refactor that would touch every Auth0 helper, and document the
// mapping here so reviewers can correlate the issue text with reality.

const optional = z.string().min(1).optional();
const required = z.string().min(1);

export const envSchema = z.object({
  DEPLOYMENT_ENV: z.enum(["local", "staging", "production"]).default("local"),

  NEXT_PUBLIC_SUPABASE_URL: required,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: required,
  SUPABASE_SERVICE_ROLE_KEY: required,
  SUPABASE_PROJECT_ID: optional,
  SUPABASE_PUBLISHABLE_KEY: optional,
  SUPABASE_SECRET_KEY: optional,

  AUTH0_DOMAIN: required,
  AUTH0_CLIENT_ID: required,
  AUTH0_CLIENT_SECRET: required,
  AUTH0_SECRET: required,
  AUTH0_PRODUCTS_JSON: optional,
  AUTH0_ALLOWED_BASE_URLS: optional,
  APP_BASE_URL: required,

  NEXT_PUBLIC_AUTH_URL: optional,
  APP_SELF_ENROLL_SLUGS: optional,

  STRIPE_SECRET_KEY: required,
  STRIPE_WEBHOOK_SECRET: required,
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: optional,
  STRIPE_PRICE_ID_PRO: optional,
  STRIPE_PRICE_ID_ENTERPRISE: optional,

  CRON_SECRET: optional,

  // Anthropic API key for the ideas AI planning action.
  // Optional because local dev / unset deployments fall back gracefully.
  ANTHROPIC_API_KEY: optional,
});

export type Env = z.infer<typeof envSchema>;

function formatIssues(issues: z.ZodIssue[]): string {
  return issues
    .map((i) => `  - ${i.path.join(".") || "(root)"}: ${i.message}`)
    .join("\n");
}

export function parseEnv(
  source: Record<string, string | undefined> = process.env,
): Env {
  const result = envSchema.safeParse(source);
  if (!result.success) {
    throw new Error(
      `Invalid environment configuration:\n${formatIssues(result.error.issues)}`,
    );
  }
  return result.data;
}

let cached: Env | null = null;

export function env(): Env {
  if (cached) return cached;
  cached = parseEnv();
  return cached;
}

export function resetEnvForTesting(): void {
  cached = null;
}
