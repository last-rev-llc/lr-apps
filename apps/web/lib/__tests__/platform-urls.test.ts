import { describe, it, expect } from "vitest";
import {
  getAppLaunchUrl,
  getAppLaunchUrlLabel,
  getAppsCatalogUrl,
  getPlatformBaseUrl,
} from "../platform-urls";

describe("platform-urls", () => {
  describe("getPlatformBaseUrl", () => {
    it("uses localhost with port for dev", () => {
      expect(getPlatformBaseUrl("localhost:3000")).toBe("http://localhost:3000");
    });

    it("defaults localhost port to 3000", () => {
      expect(getPlatformBaseUrl("localhost")).toBe("http://localhost:3000");
    });

    it("uses current host for Vercel previews", () => {
      expect(getPlatformBaseUrl("lr-apps-abc.vercel.app")).toBe(
        "https://lr-apps-abc.vercel.app",
      );
    });

    it("maps app subdomain to auth hub (production apps cluster)", () => {
      expect(getPlatformBaseUrl("accounts.apps.lastrev.com")).toBe(
        "https://auth.apps.lastrev.com",
      );
    });

    it("maps app subdomain to auth hub (local apps cluster)", () => {
      expect(
        getPlatformBaseUrl("accounts.apps.lastrev.localhost:3000"),
      ).toBe("http://auth.apps.lastrev.localhost:3000");
    });

    it("stays on auth host when already on auth subdomain", () => {
      expect(getPlatformBaseUrl("auth.apps.lastrev.com")).toBe(
        "https://auth.apps.lastrev.com",
      );
    });

    it("maps legacy app host to auth.lastrev.com", () => {
      expect(getPlatformBaseUrl("sentiment.lastrev.com")).toBe(
        "https://auth.lastrev.com",
      );
    });

    it("stays on legacy auth host when already on auth.lastrev.com", () => {
      expect(getPlatformBaseUrl("auth.lastrev.com")).toBe(
        "https://auth.lastrev.com",
      );
    });

    it("maps local apps app subdomain to local apps auth hub", () => {
      expect(
        getPlatformBaseUrl("sentiment.apps.lastrev.localhost:3000"),
      ).toBe("http://auth.apps.lastrev.localhost:3000");
    });

    it("maps legacy local app subdomain to legacy local auth hub", () => {
      expect(getPlatformBaseUrl("sentiment.lastrev.localhost:3000")).toBe(
        "http://auth.lastrev.localhost:3000",
      );
    });
  });

  describe("getAppsCatalogUrl", () => {
    it("uses apps apex for apps cluster", () => {
      expect(getAppsCatalogUrl("accounts.apps.lastrev.com")).toBe(
        "https://apps.lastrev.com",
      );
    });

    it("uses localhost for dev", () => {
      expect(getAppsCatalogUrl("localhost:3000")).toBe("http://localhost:3000");
    });

    it("uses lastrev.com apex for legacy subdomains", () => {
      expect(getAppsCatalogUrl("uptime.lastrev.com")).toBe(
        "https://lastrev.com",
      );
    });

    it("uses apps apex for the auth hub on the apps cluster", () => {
      expect(getAppsCatalogUrl("auth.apps.lastrev.com")).toBe(
        "https://apps.lastrev.com",
      );
    });

    it("uses legacy apex for the legacy auth hub", () => {
      expect(getAppsCatalogUrl("auth.lastrev.com")).toBe(
        "https://lastrev.com",
      );
    });
  });

  describe("getAppLaunchUrl", () => {
    it("uses ?app= on localhost", () => {
      expect(getAppLaunchUrl("calculator", "localhost:3000")).toBe(
        "http://localhost:3000?app=calculator",
      );
    });

    it("defaults localhost port to 3000", () => {
      expect(getAppLaunchUrl("calculator", "localhost")).toBe(
        "http://localhost:3000?app=calculator",
      );
    });

    it("uses ?app= on Vercel preview host", () => {
      expect(getAppLaunchUrl("calculator", "lr-apps-abc.vercel.app")).toBe(
        "https://lr-apps-abc.vercel.app?app=calculator",
      );
    });

    it("uses subdomain URL on production apps cluster", () => {
      expect(
        getAppLaunchUrl("calculator", "auth.apps.lastrev.com"),
      ).toBe("https://calculator.apps.lastrev.com");
    });

    it("uses legacy subdomain URL when called from a legacy host", () => {
      expect(
        getAppLaunchUrl("calculator", "auth.lastrev.com"),
      ).toBe("https://calculator.lastrev.com");
    });

    it("uses local apps subdomain URL on local apps cluster", () => {
      expect(
        getAppLaunchUrl("calculator", "auth.apps.lastrev.localhost:3000"),
      ).toBe("http://calculator.apps.lastrev.localhost:3000");
    });
  });

  describe("getAppLaunchUrlLabel", () => {
    it("describes localhost ?app= links", () => {
      expect(getAppLaunchUrlLabel("calculator", "localhost:3000")).toBe(
        "localhost · ?app=calculator",
      );
    });

    it("describes production subdomain", () => {
      expect(getAppLaunchUrlLabel("calculator", "auth.apps.lastrev.com")).toBe(
        "calculator.apps.lastrev.com",
      );
    });

    it("describes legacy production subdomain when called from legacy host", () => {
      expect(getAppLaunchUrlLabel("calculator", "auth.lastrev.com")).toBe(
        "calculator.lastrev.com",
      );
    });
  });
});
