import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
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
      expect(isPublicRoute("ai-calculator", "/")).toBe(true);
    });
  });

  it("every app has a valid tier value", () => {
    const apps = getAllApps();
    const validTiers = ["free", "pro", "enterprise"];
    for (const app of apps) {
      expect(validTiers).toContain(app.tier);
    }
  });

  it("every app has a features object", () => {
    const apps = getAllApps();
    for (const app of apps) {
      expect(typeof app.features).toBe("object");
      expect(app.features).not.toBeNull();
    }
  });

  describe("registry integrity", () => {
    it("no duplicate slugs", () => {
      const apps = getAllApps();
      const slugs = apps.map((a) => a.slug);
      expect(new Set(slugs).size).toBe(slugs.length);
    });

    it("no duplicate subdomains", () => {
      const apps = getAllApps();
      const subdomains = apps.map((a) => a.subdomain);
      expect(new Set(subdomains).size).toBe(subdomains.length);
    });

    it("every routeGroup maps to an existing directory", () => {
      const apps = getAllApps();
      for (const app of apps) {
        const dir = path.resolve(__dirname, "../../app", app.routeGroup);
        expect(fs.existsSync(dir), `Missing directory for ${app.slug}: ${dir}`).toBe(true);
      }
    });

    it("every auth-gated app has a layout calling requireAppLayoutAccess", () => {
      const apps = getAllApps();
      for (const app of apps.filter((a) => a.auth)) {
        const layoutPath = path.resolve(__dirname, "../../app", app.routeGroup, "layout.tsx");
        expect(fs.existsSync(layoutPath), `Missing layout for ${app.slug}: ${layoutPath}`).toBe(true);
        const contents = fs.readFileSync(layoutPath, "utf-8");
        expect(contents, `${app.slug} layout missing requireAppLayoutAccess`).toContain("requireAppLayoutAccess");
      }
    });
  });
});
