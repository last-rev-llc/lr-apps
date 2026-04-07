import { describe, it, expect } from "vitest";
import {
  getRouteForSubdomain,
  hrefWithinDeployedApp,
  resolveSubdomain,
} from "../proxy-utils";

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
  });

  describe("getRouteForSubdomain", () => {
    it("maps known subdomain to route group", () => {
      expect(getRouteForSubdomain("sentiment")).toBe("/apps/sentiment");
    });

    it("maps auth subdomain to auth route group", () => {
      expect(getRouteForSubdomain("auth")).toBe("/(auth)");
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
  });
});
