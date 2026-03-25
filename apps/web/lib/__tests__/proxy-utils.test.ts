import { describe, it, expect } from "vitest";
import { resolveSubdomain, getRouteForSubdomain } from "../proxy-utils";

describe("proxy-utils", () => {
  describe("resolveSubdomain", () => {
    it("extracts subdomain from production host", () => {
      expect(resolveSubdomain("sentiment.lastrev.com")).toBe("sentiment");
    });

    it("extracts subdomain from localhost with port", () => {
      expect(resolveSubdomain("sentiment.lastrev.localhost:3000")).toBe("sentiment");
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

    it("handles hyphenated subdomains", () => {
      expect(resolveSubdomain("command-center.lastrev.com")).toBe("command-center");
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
      expect(getRouteForSubdomain("command-center")).toBe("/apps/command-center");
    });

    it("returns null for unknown subdomain", () => {
      expect(getRouteForSubdomain("nonexistent")).toBeNull();
    });

    it("maps aliased subdomain (meetings → meeting-summaries)", () => {
      expect(getRouteForSubdomain("meetings")).toBe("/apps/meeting-summaries");
    });
  });
});
