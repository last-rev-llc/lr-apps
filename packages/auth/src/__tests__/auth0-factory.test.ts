import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@auth0/nextjs-auth0/server", () => ({
  Auth0Client: vi.fn().mockImplementation(() => ({ __mocked: true })),
}));

vi.mock("next/server", () => ({
  NextResponse: { redirect: vi.fn() },
}));

vi.mock("../self-enroll", () => ({
  maybeSelfEnrollAfterLogin: vi.fn(),
}));

import { getAuth0ClientForHost, getHostFromRequestHeaders } from "../auth0-factory";

describe("getHostFromRequestHeaders", () => {
  it("returns x-forwarded-host when present", () => {
    const h = new Headers({ "x-forwarded-host": "accounts.example.com" });
    expect(getHostFromRequestHeaders(h)).toBe("accounts.example.com");
  });

  it("returns first entry when x-forwarded-host has multiple values", () => {
    const h = new Headers({ "x-forwarded-host": "accounts.example.com, proxy.internal" });
    expect(getHostFromRequestHeaders(h)).toBe("accounts.example.com");
  });

  it("falls back to host header when x-forwarded-host is absent", () => {
    const h = new Headers({ host: "localhost:3000" });
    expect(getHostFromRequestHeaders(h)).toBe("localhost:3000");
  });

  it("returns localhost:3000 when neither header is present", () => {
    const h = new Headers();
    expect(getHostFromRequestHeaders(h)).toBe("localhost:3000");
  });

  it("trims whitespace from x-forwarded-host", () => {
    const h = new Headers({ "x-forwarded-host": "  app.example.com  " });
    expect(getHostFromRequestHeaders(h)).toBe("app.example.com");
  });
});

describe("getAuth0ClientForHost", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns a client when AUTH0_CLIENT_ID and AUTH0_CLIENT_SECRET are set", () => {
    vi.stubEnv("AUTH0_CLIENT_ID", "test-client-env-001");
    vi.stubEnv("AUTH0_CLIENT_SECRET", "test-secret");
    vi.stubEnv("AUTH0_DOMAIN", "test.auth0.com");
    vi.stubEnv("AUTH0_SECRET", "very-long-secret-value-here");
    vi.stubEnv("AUTH0_PRODUCTS_JSON", "");

    const client = getAuth0ClientForHost("env-host-001.example.com");
    expect(client).toBeDefined();
  });

  it("throws when AUTH0_CLIENT_ID and AUTH0_CLIENT_SECRET are missing and no map", () => {
    vi.stubEnv("AUTH0_CLIENT_ID", "");
    vi.stubEnv("AUTH0_CLIENT_SECRET", "");
    vi.stubEnv("AUTH0_PRODUCTS_JSON", "");

    expect(() => getAuth0ClientForHost("no-creds-host.example.com")).toThrow(
      "Auth0 is not configured",
    );
  });

  it("throws when AUTH0_PRODUCTS_JSON contains invalid JSON", () => {
    vi.stubEnv("AUTH0_PRODUCTS_JSON", "{ invalid json }");

    expect(() => getAuth0ClientForHost("any-host.example.com")).toThrow(
      "AUTH0_PRODUCTS_JSON is not valid JSON",
    );
  });

  it("uses per-host config from AUTH0_PRODUCTS_JSON map", () => {
    const map = {
      "map-host.example.com": {
        clientId: "client-from-map-unique-999",
        clientSecret: "secret-from-map",
      },
    };
    vi.stubEnv("AUTH0_PRODUCTS_JSON", JSON.stringify(map));
    vi.stubEnv("AUTH0_DOMAIN", "test.auth0.com");
    vi.stubEnv("AUTH0_SECRET", "very-long-secret");

    const client = getAuth0ClientForHost("map-host.example.com");
    expect(client).toBeDefined();
  });

  it("falls back to env vars when host is not in AUTH0_PRODUCTS_JSON map", () => {
    const map = {
      "known-host.example.com": { clientId: "known-client", clientSecret: "known-secret" },
    };
    vi.stubEnv("AUTH0_PRODUCTS_JSON", JSON.stringify(map));
    vi.stubEnv("AUTH0_CLIENT_ID", "fallback-client-env-unique-888");
    vi.stubEnv("AUTH0_CLIENT_SECRET", "fallback-secret");
    vi.stubEnv("AUTH0_DOMAIN", "test.auth0.com");
    vi.stubEnv("AUTH0_SECRET", "very-long-secret");

    const client = getAuth0ClientForHost("unknown-host-unique-888.example.com");
    expect(client).toBeDefined();
  });

  it("uses default key from map when present", () => {
    const map = {
      default: { clientId: "default-client-unique-777", clientSecret: "default-secret" },
    };
    vi.stubEnv("AUTH0_PRODUCTS_JSON", JSON.stringify(map));
    vi.stubEnv("AUTH0_DOMAIN", "test.auth0.com");
    vi.stubEnv("AUTH0_SECRET", "very-long-secret");

    const client = getAuth0ClientForHost("any-host-unique-777.example.com");
    expect(client).toBeDefined();
  });
});
