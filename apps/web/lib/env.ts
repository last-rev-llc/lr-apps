import { z } from "zod";

const optional = z.string().min(1).optional();
const required = z.string().min(1);

export const envSchema = z.object({
  DEPLOYMENT_ENV: z.enum(["local", "staging", "production"]).default("local"),

  NEXT_PUBLIC_SUPABASE_URL: required,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: required,
  SUPABASE_SERVICE_ROLE_KEY: optional,
  SUPABASE_PROJECT_ID: optional,
  SUPABASE_PUBLISHABLE_KEY: optional,
  SUPABASE_SECRET_KEY: optional,

  AUTH0_DOMAIN: required,
  AUTH0_CLIENT_ID: optional,
  AUTH0_CLIENT_SECRET: optional,
  AUTH0_SECRET: required,
  AUTH0_PRODUCTS_JSON: optional,
  AUTH0_ALLOWED_BASE_URLS: optional,
  APP_BASE_URL: required,

  NEXT_PUBLIC_AUTH_URL: optional,
  APP_SELF_ENROLL_SLUGS: optional,

  STRIPE_SECRET_KEY: optional,
  STRIPE_WEBHOOK_SECRET: optional,
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: optional,
  STRIPE_PRICE_ID_PRO: optional,
  STRIPE_PRICE_ID_ENTERPRISE: optional,

  CRON_SECRET: optional,
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
