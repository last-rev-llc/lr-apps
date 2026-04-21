import { describe, it, expect } from "vitest";
import { envSchema, parseEnv } from "../env";

const minimum = {
  NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
  AUTH0_DOMAIN: "tenant.auth0.com",
  AUTH0_SECRET: "x".repeat(32),
  APP_BASE_URL: "http://localhost:3000",
};

describe("env schema", () => {
  it("accepts a minimum-valid local env and defaults DEPLOYMENT_ENV to local", () => {
    const parsed = parseEnv(minimum);
    expect(parsed.DEPLOYMENT_ENV).toBe("local");
  });

  it("accepts DEPLOYMENT_ENV=staging", () => {
    const parsed = parseEnv({
      ...minimum,
      DEPLOYMENT_ENV: "staging",
    });
    expect(parsed.DEPLOYMENT_ENV).toBe("staging");
  });

  it("accepts DEPLOYMENT_ENV=production", () => {
    const parsed = parseEnv({
      ...minimum,
      DEPLOYMENT_ENV: "production",
    });
    expect(parsed.DEPLOYMENT_ENV).toBe("production");
  });

  it("rejects invalid DEPLOYMENT_ENV values", () => {
    expect(() =>
      parseEnv({
        ...minimum,
        DEPLOYMENT_ENV: "qa",
      }),
    ).toThrow(/DEPLOYMENT_ENV/);
  });

  it("rejects when a required var is missing", () => {
    const { AUTH0_SECRET: _omit, ...partial } = minimum;
    void _omit;
    expect(() => parseEnv(partial)).toThrow(/AUTH0_SECRET/);
  });

  it("schema enumerates only the three known deployment environments", () => {
    const inner = envSchema.shape.DEPLOYMENT_ENV.removeDefault();
    expect(inner.options).toEqual(["local", "staging", "production"]);
  });
});
