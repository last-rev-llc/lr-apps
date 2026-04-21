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

import { getAuth0ClientForHost } from "../auth0-factory";

describe("auth0-factory env-var startup assertions", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  describe("AUTH0_CLIENT_ID / AUTH0_CLIENT_SECRET", () => {
    it("throws when AUTH0_CLIENT_ID is missing", () => {
      vi.stubEnv("AUTH0_CLIENT_ID", "");
      vi.stubEnv("AUTH0_CLIENT_SECRET", "present");
      vi.stubEnv("AUTH0_PRODUCTS_JSON", "");

      expect(() =>
        getAuth0ClientForHost("missing-id-host.example.com"),
      ).toThrow("Auth0 is not configured");
    });

    it("throws when AUTH0_CLIENT_SECRET is missing", () => {
      vi.stubEnv("AUTH0_CLIENT_ID", "present");
      vi.stubEnv("AUTH0_CLIENT_SECRET", "");
      vi.stubEnv("AUTH0_PRODUCTS_JSON", "");

      expect(() =>
        getAuth0ClientForHost("missing-secret-host.example.com"),
      ).toThrow("Auth0 is not configured");
    });

    it("error message guides the operator to the two valid configurations", () => {
      vi.stubEnv("AUTH0_CLIENT_ID", "");
      vi.stubEnv("AUTH0_CLIENT_SECRET", "");
      vi.stubEnv("AUTH0_PRODUCTS_JSON", "");

      expect(() => getAuth0ClientForHost("any-host.example.com")).toThrow(
        /AUTH0_CLIENT_ID.*AUTH0_CLIENT_SECRET.*AUTH0_PRODUCTS_JSON/s,
      );
    });
  });

  describe("AUTH0_PRODUCTS_JSON malformed", () => {
    it("throws when AUTH0_PRODUCTS_JSON contains invalid JSON", () => {
      vi.stubEnv("AUTH0_PRODUCTS_JSON", "{ not: json }");

      expect(() =>
        getAuth0ClientForHost("malformed-host.example.com"),
      ).toThrow("AUTH0_PRODUCTS_JSON is not valid JSON");
    });

    it("throws when AUTH0_PRODUCTS_JSON is a string literal", () => {
      vi.stubEnv("AUTH0_PRODUCTS_JSON", '"not-an-object"');
      vi.stubEnv("AUTH0_CLIENT_ID", "");
      vi.stubEnv("AUTH0_CLIENT_SECRET", "");

      // Parses as a string, then falls through to env-var lookup which fails.
      expect(() => getAuth0ClientForHost("string-map-host.example.com")).toThrow(
        "Auth0 is not configured",
      );
    });
  });
});
