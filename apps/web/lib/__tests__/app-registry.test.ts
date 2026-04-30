import { describe, it, expect, vi } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import {
  getAppBySubdomain,
  getAppBySlug,
  getAllApps,
  isPublicRoute,
  type AppConfig,
} from "../app-registry";
import { isSelfEnrollAllowedForSlug } from "@repo/auth/self-enroll";

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
    it("registers at least 27 apps", () => {
      expect(getAllApps().length).toBeGreaterThanOrEqual(27);
    });

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

    it("every subdomain is a single DNS label (no dots) — host built by lib/app-host.ts", () => {
      for (const app of getAllApps()) {
        expect(
          app.subdomain.includes("."),
          `${app.slug}.subdomain must be a leftmost DNS label, not a full host`,
        ).toBe(false);
        expect(app.subdomain.length).toBeGreaterThan(0);
      }
    });

    it("every app's subdomain resolves back to the same app", () => {
      for (const app of getAllApps()) {
        const resolved = getAppBySubdomain(app.subdomain);
        expect(resolved, `subdomain ${app.subdomain} must resolve`).toBeDefined();
        expect(resolved?.slug).toBe(app.slug);
      }
    });

    it("every app's slug resolves back to the same app", () => {
      for (const app of getAllApps()) {
        const resolved = getAppBySlug(app.slug);
        expect(resolved, `slug ${app.slug} must resolve`).toBeDefined();
        expect(resolved?.subdomain).toBe(app.subdomain);
      }
    });

    it("every app's routeGroup matches the expected shape", () => {
      for (const app of getAllApps()) {
        if (app.slug === "auth") {
          expect(app.routeGroup).toBe("(auth)");
        } else {
          expect(app.routeGroup).toBe(`apps/${app.slug}`);
        }
      }
    });

    it("every routeGroup maps to an existing directory", () => {
      const apps = getAllApps();
      for (const app of apps) {
        const dir = path.resolve(__dirname, "../../app", app.routeGroup);
        expect(fs.existsSync(dir), `Missing directory for ${app.slug}: ${dir}`).toBe(true);
      }
    });

    it("registers the tier resolver with @repo/auth at import time", () => {
      vi.stubEnv("APP_SELF_ENROLL_SLUGS", "");
      vi.stubEnv("NODE_ENV", "production");
      try {
        for (const app of getAllApps().filter((a) => a.tier === "free")) {
          expect(
            isSelfEnrollAllowedForSlug(app.slug),
            `free-tier ${app.slug} must self-enroll without env-var override`,
          ).toBe(true);
        }
        for (const app of getAllApps().filter((a) => a.tier !== "free")) {
          expect(
            isSelfEnrollAllowedForSlug(app.slug),
            `${app.tier}-tier ${app.slug} must NOT self-enroll without override`,
          ).toBe(false);
        }
      } finally {
        vi.unstubAllEnvs();
      }
    });

    it("every auth-gated app has a layout that gates access", () => {
      const apps = getAllApps();
      for (const app of apps.filter((a) => a.auth)) {
        const layoutPath = path.resolve(__dirname, "../../app", app.routeGroup, "layout.tsx");
        expect(fs.existsSync(layoutPath), `Missing layout for ${app.slug}: ${layoutPath}`).toBe(true);
        const contents = fs.readFileSync(layoutPath, "utf-8");
        const hasGate =
          contents.includes("requireAppLayoutAccess") || contents.includes("requireAccess");
        expect(hasGate, `${app.slug} layout missing requireAppLayoutAccess or requireAccess`).toBe(true);
      }
    });
  });
});
