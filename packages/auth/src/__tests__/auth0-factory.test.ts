import { describe, it, expect, vi, beforeEach } from "vitest";

const { Auth0ClientMock } = vi.hoisted(() => ({
  Auth0ClientMock: vi.fn().mockImplementation(() => ({ __mocked: true })),
}));

vi.mock("@auth0/nextjs-auth0/server", () => ({
  Auth0Client: Auth0ClientMock,
}));

vi.mock("next/server", () => ({
  NextResponse: { redirect: vi.fn() },
}));

vi.mock("../self-enroll", () => ({
  maybeSelfEnrollAfterLogin: vi.fn(),
}));

import {
  getAuth0ClientForHost,
  getHostFromRequestHeaders,
  isSafeReturnTo,
} from "../auth0-factory";

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
    Auth0ClientMock.mockClear();
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

  describe("appBaseUrl derivation", () => {
    // Use a unique clientId per test so the module-level clientCache (keyed
    // by `${clientId}|${host}`) cannot leak entries between tests.
    let clientIdCounter = 0;
    const uniqueClientId = () => `test-client-derive-${++clientIdCounter}`;

    beforeEach(() => {
      vi.stubEnv("AUTH0_CLIENT_ID", uniqueClientId());
      vi.stubEnv("AUTH0_CLIENT_SECRET", "test-secret");
      vi.stubEnv("AUTH0_DOMAIN", "test.auth0.com");
      vi.stubEnv("AUTH0_SECRET", "very-long-secret-derive");
      vi.stubEnv("AUTH0_PRODUCTS_JSON", "");
    });

    it("includes the request's own origin so /auth/login validates", () => {
      vi.stubEnv("AUTH0_ALLOWED_BASE_URLS", "");
      vi.stubEnv("APP_BASE_URL", "https://apps.lastrev.com");

      getAuth0ClientForHost("auth.apps.lastrev.com");

      const opts = Auth0ClientMock.mock.calls.at(-1)?.[0];
      expect(opts.appBaseUrl).toContain("https://auth.apps.lastrev.com");
    });

    it("includes the auth hub for the cluster (post-redirect /auth/* calls)", () => {
      vi.stubEnv("AUTH0_ALLOWED_BASE_URLS", "");
      vi.stubEnv("APP_BASE_URL", "https://apps.lastrev.com");

      getAuth0ClientForHost("lighthouse.apps.lastrev.com");

      const opts = Auth0ClientMock.mock.calls.at(-1)?.[0];
      expect(opts.appBaseUrl).toEqual(
        expect.arrayContaining([
          "https://lighthouse.apps.lastrev.com",
          "https://auth.apps.lastrev.com",
        ]),
      );
    });

    it("unions env-var entries with derived origins, deduped", () => {
      vi.stubEnv(
        "AUTH0_ALLOWED_BASE_URLS",
        "https://apps.lastrev.com,https://auth.apps.lastrev.com,https://staging.apps.lastrev.com",
      );

      getAuth0ClientForHost("auth.apps.lastrev.com");

      const opts = Auth0ClientMock.mock.calls.at(-1)?.[0];
      const seen = new Set(opts.appBaseUrl);
      expect(seen.size).toBe(opts.appBaseUrl.length);
      expect(seen).toContain("https://apps.lastrev.com");
      expect(seen).toContain("https://auth.apps.lastrev.com");
      expect(seen).toContain("https://staging.apps.lastrev.com");
    });

    it("caches per (clientId, host) so each subdomain gets its own appBaseUrl", () => {
      vi.stubEnv("AUTH0_ALLOWED_BASE_URLS", "");
      // Counter from beforeEach already moved this test to a fresh clientId,
      // so the cache starts empty for this clientId.
      const callsBefore = Auth0ClientMock.mock.calls.length;

      getAuth0ClientForHost("lighthouse.apps.lastrev.com");
      getAuth0ClientForHost("generations.apps.lastrev.com");
      // Same host hits the cache and does not reconstruct.
      getAuth0ClientForHost("lighthouse.apps.lastrev.com");

      const callsAfter = Auth0ClientMock.mock.calls.length;
      expect(callsAfter - callsBefore).toBe(2);
    });
  });
});

describe("isSafeReturnTo", () => {
  it("allows relative paths", () => {
    expect(isSafeReturnTo("/my-apps")).toBe(true);
    expect(isSafeReturnTo("/apps/sentiment")).toBe(true);
    expect(isSafeReturnTo("/")).toBe(true);
  });

  it("allows known app subdomain URLs", () => {
    expect(
      isSafeReturnTo("https://sentiment.apps.lastrev.com/"),
    ).toBe(true);
    expect(
      isSafeReturnTo("https://command-center.apps.lastrev.com/dashboard"),
    ).toBe(true);
  });

  it("allows local app subdomain URLs", () => {
    expect(
      isSafeReturnTo("http://sentiment.apps.lastrev.localhost:3000/"),
    ).toBe(true);
  });

  it("allows the bare domain itself", () => {
    expect(isSafeReturnTo("https://apps.lastrev.com/")).toBe(true);
  });

  it("rejects external URLs", () => {
    expect(isSafeReturnTo("https://evil.com/apps/sentiment")).toBe(false);
    expect(isSafeReturnTo("https://evil.apps.lastrev.com.attacker.com/")).toBe(
      false,
    );
  });

  it("rejects javascript: protocol", () => {
    expect(isSafeReturnTo("javascript:alert(1)")).toBe(false);
  });

  it("rejects data: protocol", () => {
    expect(isSafeReturnTo("data:text/html,<h1>hi</h1>")).toBe(false);
  });

  it("rejects empty string", () => {
    expect(isSafeReturnTo("")).toBe(false);
  });

  it("rejects protocol-relative URLs (open redirect vector)", () => {
    expect(isSafeReturnTo("//evil.com")).toBe(false);
    expect(isSafeReturnTo("//evil.com/apps/sentiment")).toBe(false);
  });
});
