import { describe, it, expect } from "vitest";
import {
  getRouteForSubdomain,
  hrefWithinDeployedApp,
  isVercelPreviewHost,
  resolveSubdomain,
} from "../proxy-utils";
import { getAllApps } from "../app-registry";

describe("proxy-utils", () => {
  describe("resolveSubdomain", () => {
    it("extracts app slug from *.apps.lastrev.com", () => {
      expect(resolveSubdomain("command-center.apps.lastrev.com")).toBe(
        "command-center",
      );
      expect(resolveSubdomain("sentiment.apps.lastrev.com")).toBe("sentiment");
    });

    it("extracts app slug from *.apps.lastrev.localhost with port", () => {
      expect(
        resolveSubdomain("sentiment.apps.lastrev.localhost:3000"),
      ).toBe("sentiment");
    });

    it("returns null for bare apps.lastrev.com", () => {
      expect(resolveSubdomain("apps.lastrev.com")).toBeNull();
    });

    it("returns null for bare apps.lastrev.localhost", () => {
      expect(resolveSubdomain("apps.lastrev.localhost")).toBeNull();
    });

    it("still supports legacy single-level *.lastrev.com", () => {
      expect(resolveSubdomain("sentiment.lastrev.com")).toBe("sentiment");
      expect(resolveSubdomain("command-center.lastrev.com")).toBe(
        "command-center",
      );
    });

    it("extracts subdomain from legacy localhost with port", () => {
      expect(resolveSubdomain("sentiment.lastrev.localhost:3000")).toBe(
        "sentiment",
      );
    });

    it("returns null for bare domain", () => {
      expect(resolveSubdomain("lastrev.com")).toBeNull();
    });

    it("returns null for www", () => {
      expect(resolveSubdomain("www.lastrev.com")).toBeNull();
    });

    it("handles localhost without subdomain", () => {
      expect(resolveSubdomain("localhost:3000")).toBeNull();
    });

    it("extracts auth from both host shapes", () => {
      expect(resolveSubdomain("auth.apps.lastrev.com")).toBe("auth");
      expect(resolveSubdomain("auth.lastrev.com")).toBe("auth");
      expect(resolveSubdomain("auth.apps.lastrev.localhost:3000")).toBe(
        "auth",
      );
      expect(resolveSubdomain("auth.lastrev.localhost:3000")).toBe("auth");
    });
  });

  describe("isVercelPreviewHost", () => {
    it("returns true for *.vercel.app hosts", () => {
      expect(
        isVercelPreviewHost("lr-apps-git-feat-x.vercel.app"),
      ).toBe(true);
      expect(
        isVercelPreviewHost("apps-abc123-last-rev.vercel.app"),
      ).toBe(true);
    });

    it("returns true even when host carries a port", () => {
      expect(
        isVercelPreviewHost("lr-apps-git-feat-x.vercel.app:443"),
      ).toBe(true);
    });

    it("returns false for production-style apps hosts", () => {
      expect(isVercelPreviewHost("sentiment.apps.lastrev.com")).toBe(false);
      expect(isVercelPreviewHost("apps.lastrev.com")).toBe(false);
    });

    it("returns false for localhost", () => {
      expect(isVercelPreviewHost("localhost:3000")).toBe(false);
    });
  });

  describe("getRouteForSubdomain", () => {
    it("maps known subdomain to route group", () => {
      expect(getRouteForSubdomain("sentiment")).toBe("/apps/sentiment");
    });

    it("maps auth subdomain to an empty URL prefix (route group lives on disk only)", () => {
      // `(auth)` is a Next.js route group — invisible in URLs, so we strip it.
      // The proxy leaves `/login` as `/login` so it resolves to
      // `app/(auth)/(forms)/login/page.tsx` instead of 404'ing on `/(auth)/login`.
      expect(getRouteForSubdomain("auth")).toBe("");
    });

    it("maps command-center subdomain", () => {
      expect(getRouteForSubdomain("command-center")).toBe(
        "/apps/command-center",
      );
    });

    it("returns null for unknown subdomain", () => {
      expect(getRouteForSubdomain("nonexistent")).toBeNull();
    });

    it("maps aliased subdomain (meetings → meeting-summaries)", () => {
      expect(getRouteForSubdomain("meetings")).toBe(
        "/apps/meeting-summaries",
      );
    });
  });

  describe("hrefWithinDeployedApp", () => {
    const calc = { subdomain: "calculator", routeGroup: "apps/ai-calculator" };

    it("uses full app path on localhost", () => {
      expect(hrefWithinDeployedApp("localhost:3000", calc, "calculator")).toBe(
        "/apps/ai-calculator/calculator",
      );
    });

    it("uses app-root-relative path on app subdomain", () => {
      expect(
        hrefWithinDeployedApp("calculator.apps.lastrev.com", calc, "calculator"),
      ).toBe("/calculator");
    });

    it("uses app-root-relative path on local apps cluster host", () => {
      expect(
        hrefWithinDeployedApp(
          "calculator.apps.lastrev.localhost:3000",
          calc,
          "/calculator",
        ),
      ).toBe("/calculator");
    });

    it("prepends '/' when pathInApp lacks leading slash", () => {
      expect(
        hrefWithinDeployedApp("localhost:3000", calc, "settings"),
      ).toBe("/apps/ai-calculator/settings");
    });

    it("uses app-root path when host subdomain belongs to a different app", () => {
      expect(
        hrefWithinDeployedApp(
          "sentiment.apps.lastrev.com",
          calc,
          "/calculator",
        ),
      ).toBe("/apps/ai-calculator/calculator");
    });
  });

  describe("full-registry coverage", () => {
    it("every registered subdomain resolves to a non-null route", () => {
      for (const app of getAllApps()) {
        const route = getRouteForSubdomain(app.subdomain);
        expect(route, `subdomain ${app.subdomain} must resolve`).not.toBeNull();
        if (app.slug === "auth") {
          // `(auth)` is a route group; URL prefix is empty.
          expect(route).toBe("");
        } else {
          expect(route).toBe(`/apps/${app.slug}`);
        }
      }
    });

    it("every registered subdomain is extractable from a *.apps.lastrev.com host", () => {
      for (const app of getAllApps()) {
        const host = `${app.subdomain}.apps.lastrev.com`;
        expect(resolveSubdomain(host)).toBe(app.subdomain);
      }
    });

    it("returns null for unknown subdomains (404 signal)", () => {
      expect(getRouteForSubdomain("does-not-exist")).toBeNull();
      expect(getRouteForSubdomain("not-a-real-app")).toBeNull();
    });

    it("resolveSubdomain returns the raw label for unregistered hosts (rejection handled by getRouteForSubdomain)", () => {
      expect(resolveSubdomain("mystery.apps.lastrev.com")).toBe("mystery");
      expect(getRouteForSubdomain("mystery")).toBeNull();
    });
  });
});
