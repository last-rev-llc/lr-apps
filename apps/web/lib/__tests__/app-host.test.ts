import { describe, it, expect } from "vitest";
import {
  appHost,
  appOrigin,
  appsCatalogOrigin,
  authHubOrigin,
  isAppsClusterHost,
  isLegacyClusterHost,
  productionAppOrigin,
} from "../app-host";

const calc = { subdomain: "calculator" };
const ch = { subdomain: "client-health" };

describe("app-host", () => {
  describe("appHost", () => {
    it("returns *.apps.lastrev.com on the apps prod cluster", () => {
      expect(appHost(ch, "auth.apps.lastrev.com")).toBe(
        "client-health.apps.lastrev.com",
      );
      expect(appHost(calc, "sentiment.apps.lastrev.com")).toBe(
        "calculator.apps.lastrev.com",
      );
    });

    it("returns *.apps.lastrev.localhost with port on the apps local cluster", () => {
      expect(appHost(calc, "auth.apps.lastrev.localhost:3000")).toBe(
        "calculator.apps.lastrev.localhost:3000",
      );
    });

    it("returns *.lastrev.com on the legacy prod cluster", () => {
      expect(appHost(calc, "auth.lastrev.com")).toBe("calculator.lastrev.com");
    });

    it("returns *.lastrev.localhost on the legacy local cluster", () => {
      expect(appHost(calc, "auth.lastrev.localhost:3000")).toBe(
        "calculator.lastrev.localhost:3000",
      );
    });

    it("echoes localhost so caller falls back to ?app=", () => {
      expect(appHost(calc, "localhost:3000")).toBe("localhost:3000");
      expect(appHost(calc, "localhost")).toBe("localhost:3000");
    });

    it("echoes Vercel preview hosts so caller falls back to ?app=", () => {
      expect(appHost(calc, "lr-apps-abc.vercel.app")).toBe(
        "lr-apps-abc.vercel.app",
      );
    });
  });

  describe("appOrigin", () => {
    it("uses https on production clusters", () => {
      expect(appOrigin(calc, "auth.apps.lastrev.com")).toBe(
        "https://calculator.apps.lastrev.com",
      );
      expect(appOrigin(calc, "auth.lastrev.com")).toBe(
        "https://calculator.lastrev.com",
      );
    });

    it("uses http on localhost-style hosts", () => {
      expect(appOrigin(calc, "auth.apps.lastrev.localhost:3000")).toBe(
        "http://calculator.apps.lastrev.localhost:3000",
      );
      expect(appOrigin(calc, "auth.lastrev.localhost:3000")).toBe(
        "http://calculator.lastrev.localhost:3000",
      );
      expect(appOrigin(calc, "localhost:3000")).toBe("http://localhost:3000");
    });
  });

  describe("authHubOrigin", () => {
    it("returns the apps-cluster auth hub for apps prod", () => {
      expect(authHubOrigin("anything.apps.lastrev.com")).toBe(
        "https://auth.apps.lastrev.com",
      );
      expect(authHubOrigin("apps.lastrev.com")).toBe(
        "https://auth.apps.lastrev.com",
      );
    });

    it("returns the legacy auth hub for legacy hosts", () => {
      expect(authHubOrigin("anything.lastrev.com")).toBe(
        "https://auth.lastrev.com",
      );
    });

    it("returns the local apps-cluster auth hub for apps local", () => {
      expect(authHubOrigin("anything.apps.lastrev.localhost:3000")).toBe(
        "http://auth.apps.lastrev.localhost:3000",
      );
    });

    it("returns the local legacy auth hub for legacy local", () => {
      expect(authHubOrigin("anything.lastrev.localhost:3000")).toBe(
        "http://auth.lastrev.localhost:3000",
      );
    });
  });

  describe("appsCatalogOrigin", () => {
    it("returns the apps apex on the apps cluster", () => {
      expect(appsCatalogOrigin("calculator.apps.lastrev.com")).toBe(
        "https://apps.lastrev.com",
      );
    });

    it("returns the legacy apex on the legacy cluster", () => {
      expect(appsCatalogOrigin("uptime.lastrev.com")).toBe(
        "https://lastrev.com",
      );
    });

    it("returns localhost on bare localhost", () => {
      expect(appsCatalogOrigin("localhost:3000")).toBe("http://localhost:3000");
    });

    it("returns the raw preview host on Vercel previews", () => {
      expect(appsCatalogOrigin("lr-apps-abc.vercel.app")).toBe(
        "https://lr-apps-abc.vercel.app",
      );
    });
  });

  describe("cluster predicates", () => {
    it("isAppsClusterHost matches *.apps.lastrev.com (and local)", () => {
      expect(isAppsClusterHost("sentiment.apps.lastrev.com")).toBe(true);
      expect(isAppsClusterHost("apps.lastrev.com")).toBe(true);
      expect(isAppsClusterHost("sentiment.apps.lastrev.localhost:3000")).toBe(
        true,
      );
      expect(isAppsClusterHost("sentiment.lastrev.com")).toBe(false);
      expect(isAppsClusterHost("localhost:3000")).toBe(false);
    });

    it("isLegacyClusterHost matches *.lastrev.com but not the apps cluster", () => {
      expect(isLegacyClusterHost("sentiment.lastrev.com")).toBe(true);
      expect(isLegacyClusterHost("sentiment.lastrev.localhost:3000")).toBe(true);
      expect(isLegacyClusterHost("sentiment.apps.lastrev.com")).toBe(false);
      expect(isLegacyClusterHost("localhost:3000")).toBe(false);
    });
  });

  describe("productionAppOrigin", () => {
    it("returns the hardcoded apps prod origin for a subdomain key", () => {
      expect(productionAppOrigin("client-health")).toBe(
        "https://client-health.apps.lastrev.com",
      );
    });
  });
});
