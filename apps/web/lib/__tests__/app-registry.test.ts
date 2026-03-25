import { describe, it, expect } from "vitest";
import {
  getAppBySubdomain,
  getAppBySlug,
  getAllApps,
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
});
