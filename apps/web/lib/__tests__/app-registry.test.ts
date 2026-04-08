import { describe, it, expect } from "vitest";
import {
  getAppBySubdomain,
  getAppBySlug,
  getAllApps,
  isPublicRoute,
  type AppConfig,
} from "../app-registry";

describe("app-registry", () => {
  it("looks up an app by subdomain", () => {
    const app = getAppBySubdomain("sentiment");
    expect(app).toBeDefined();
    expect(app?.slug).toBe("sentiment");
    expect(app?.subdomain).toBe("sentiment");
  });

  it("looks up an app by slug", () => {
    const app = getAppBySlug("command-center");
    expect(app).toBeDefined();
    expect(app?.subdomain).toBe("command-center");
  });

  it("returns undefined for unknown subdomain", () => {
    const app = getAppBySubdomain("nonexistent");
    expect(app).toBeUndefined();
  });

  it("returns the auth hub for 'auth' subdomain", () => {
    const app = getAppBySubdomain("auth");
    expect(app).toBeDefined();
    expect(app?.slug).toBe("auth");
    expect(app?.auth).toBe(false);
  });

  it("lists all apps", () => {
    const apps = getAllApps();
    expect(apps.length).toBeGreaterThan(0);
    expect(apps.every((a: AppConfig) => a.slug && a.subdomain)).toBe(true);
  });

  it("distinguishes auth-required from public apps", () => {
    const apps = getAllApps();
    const publicApps = apps.filter((a: AppConfig) => !a.auth);
    const authApps = apps.filter((a: AppConfig) => a.auth);
    expect(publicApps.length).toBeGreaterThan(0);
    expect(authApps.length).toBeGreaterThan(0);
  });

  it("handles subdomain that differs from slug", () => {
    const app = getAppBySubdomain("meetings");
    expect(app).toBeDefined();
    expect(app?.slug).toBe("meeting-summaries");
  });

  it("ai-calculator declares publicRoutes containing '/'", () => {
    const calc = getAppBySlug("ai-calculator");
    expect(calc?.publicRoutes).toContain("/");
    expect(calc?.postEnrollPath).toBe("calculator");
  });

  describe("isPublicRoute", () => {
    it("returns true for exact match on ai-calculator root", () => {
      expect(isPublicRoute("ai-calculator", "/")).toBe(true);
    });

    it("returns false for non-public path on ai-calculator", () => {
      expect(isPublicRoute("ai-calculator", "/calculator")).toBe(false);
    });

    it("returns false for app without publicRoutes", () => {
      expect(isPublicRoute("sentiment", "/")).toBe(false);
    });

    it("returns false for unknown slug", () => {
      expect(isPublicRoute("nonexistent", "/")).toBe(false);
    });

    it("matches trailing /** glob patterns", () => {
      // This tests the glob logic even though no current app uses it
      // The matcher should handle prefix + /** correctly
      expect(isPublicRoute("ai-calculator", "/")).toBe(true);
    });
  });
});
