import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  appSlugFromReturnTo,
  isSelfEnrollAllowedForSlug,
  setSelfEnrollTierResolver,
} from "../self-enroll";

describe("appSlugFromReturnTo", () => {
  it("extracts slug from /apps/foo", () => {
    expect(appSlugFromReturnTo("/apps/foo")).toBe("foo");
  });

  it("extracts slug from /apps/foo/", () => {
    expect(appSlugFromReturnTo("/apps/foo/")).toBe("foo");
  });

  it("extracts slug from /apps/foo/bar subpath", () => {
    expect(appSlugFromReturnTo("/apps/foo/bar")).toBe("foo");
  });

  it("extracts slug from full URL with /apps/ path", () => {
    expect(appSlugFromReturnTo("http://localhost:3000/apps/sentiment")).toBe(
      "sentiment",
    );
  });

  it("extracts slug from production subdomain URL", () => {
    expect(
      appSlugFromReturnTo("https://command-center.apps.lastrev.com/"),
    ).toBe("command-center");
  });

  it("extracts slug from subdomain URL with path", () => {
    expect(
      appSlugFromReturnTo("https://sentiment.apps.lastrev.com/dashboard"),
    ).toBe("sentiment");
  });

  it("extracts slug from local subdomain URL", () => {
    expect(
      appSlugFromReturnTo("http://sentiment.apps.lastrev.localhost:3000/"),
    ).toBe("sentiment");
  });

  it("returns null for undefined", () => {
    expect(appSlugFromReturnTo(undefined)).toBeNull();
  });

  it("returns null for /my-apps", () => {
    expect(appSlugFromReturnTo("/my-apps")).toBeNull();
  });

  it("returns null for root path", () => {
    expect(appSlugFromReturnTo("/")).toBeNull();
  });

  it("extracts slug from external URL path (validation is separate)", () => {
    // appSlugFromReturnTo only extracts — isSafeReturnTo validates the domain
    expect(appSlugFromReturnTo("https://evil.com/apps/foo")).toBe("foo");
  });

  it("returns null for external URL without /apps/ path", () => {
    expect(appSlugFromReturnTo("https://evil.com/other")).toBeNull();
  });

  it("returns null for invalid URL", () => {
    expect(appSlugFromReturnTo("not-a-url")).toBeNull();
  });

  it("strips query params from path-based returnTo", () => {
    expect(appSlugFromReturnTo("/apps/foo?bar=1")).toBe("foo");
  });

  it("resolves subdomain to canonical slug when they differ", () => {
    expect(
      appSlugFromReturnTo("https://meetings.apps.lastrev.com/"),
    ).toBe("meeting-summaries");
    expect(
      appSlugFromReturnTo("https://sprint.apps.lastrev.com/dashboard"),
    ).toBe("sprint-planning");
    expect(
      appSlugFromReturnTo("https://updates.apps.lastrev.com/"),
    ).toBe("daily-updates");
    expect(
      appSlugFromReturnTo("https://slang.apps.lastrev.com/"),
    ).toBe("slang-translator");
    expect(
      appSlugFromReturnTo("https://calculator.apps.lastrev.com/"),
    ).toBe("ai-calculator");
  });

  it("passes through subdomain unchanged when it matches its slug", () => {
    expect(
      appSlugFromReturnTo("https://sentiment.apps.lastrev.com/"),
    ).toBe("sentiment");
    expect(
      appSlugFromReturnTo("https://lighthouse.apps.lastrev.com/"),
    ).toBe("lighthouse");
  });
});

describe("isSelfEnrollAllowedForSlug", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    setSelfEnrollTierResolver(null);
  });

  afterEach(() => {
    setSelfEnrollTierResolver(null);
  });

  it("returns false for invalid slug format", () => {
    expect(isSelfEnrollAllowedForSlug("../etc")).toBe(false);
    expect(isSelfEnrollAllowedForSlug("")).toBe(false);
  });

  it("returns true when slug is in APP_SELF_ENROLL_SLUGS", () => {
    vi.stubEnv("APP_SELF_ENROLL_SLUGS", "foo,bar,baz");
    expect(isSelfEnrollAllowedForSlug("bar")).toBe(true);
  });

  it("returns false when slug is NOT in APP_SELF_ENROLL_SLUGS", () => {
    vi.stubEnv("APP_SELF_ENROLL_SLUGS", "foo,bar");
    expect(isSelfEnrollAllowedForSlug("baz")).toBe(false);
  });

  it("allows any slug in development when env var is unset", () => {
    vi.stubEnv("APP_SELF_ENROLL_SLUGS", "");
    vi.stubEnv("NODE_ENV", "development");
    expect(isSelfEnrollAllowedForSlug("anything")).toBe(true);
  });

  it("denies in production when env var is unset", () => {
    vi.stubEnv("APP_SELF_ENROLL_SLUGS", "");
    vi.stubEnv("NODE_ENV", "production");
    expect(isSelfEnrollAllowedForSlug("anything")).toBe(false);
  });

  describe("with tier resolver", () => {
    it("allows free-tier slugs in production with no env var", () => {
      vi.stubEnv("APP_SELF_ENROLL_SLUGS", "");
      vi.stubEnv("NODE_ENV", "production");
      setSelfEnrollTierResolver((slug) =>
        slug === "lighthouse" ? "free" : undefined,
      );
      expect(isSelfEnrollAllowedForSlug("lighthouse")).toBe(true);
    });

    it("denies pro-tier slugs in production unless explicitly allowlisted", () => {
      vi.stubEnv("APP_SELF_ENROLL_SLUGS", "");
      vi.stubEnv("NODE_ENV", "production");
      setSelfEnrollTierResolver((slug) =>
        slug === "sentiment" ? "pro" : undefined,
      );
      expect(isSelfEnrollAllowedForSlug("sentiment")).toBe(false);
    });

    it("denies enterprise-tier slugs in production", () => {
      vi.stubEnv("APP_SELF_ENROLL_SLUGS", "");
      vi.stubEnv("NODE_ENV", "production");
      setSelfEnrollTierResolver((slug) =>
        slug === "command-center" ? "enterprise" : undefined,
      );
      expect(isSelfEnrollAllowedForSlug("command-center")).toBe(false);
    });

    it("env-var override still allows non-free apps when listed", () => {
      vi.stubEnv("APP_SELF_ENROLL_SLUGS", "sentiment");
      vi.stubEnv("NODE_ENV", "production");
      setSelfEnrollTierResolver((slug) =>
        slug === "sentiment" ? "pro" : undefined,
      );
      expect(isSelfEnrollAllowedForSlug("sentiment")).toBe(true);
    });

    it("env-var allowlist does not block free-tier apps not in the list", () => {
      vi.stubEnv("APP_SELF_ENROLL_SLUGS", "sentiment");
      vi.stubEnv("NODE_ENV", "production");
      setSelfEnrollTierResolver((slug) =>
        slug === "lighthouse" ? "free" : undefined,
      );
      expect(isSelfEnrollAllowedForSlug("lighthouse")).toBe(true);
    });

    it("resolver returning undefined falls through to env/dev rules", () => {
      vi.stubEnv("APP_SELF_ENROLL_SLUGS", "");
      vi.stubEnv("NODE_ENV", "production");
      setSelfEnrollTierResolver(() => undefined);
      expect(isSelfEnrollAllowedForSlug("unknown-app")).toBe(false);
    });
  });
});
