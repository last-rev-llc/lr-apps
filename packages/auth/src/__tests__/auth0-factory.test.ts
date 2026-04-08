import { describe, it, expect } from "vitest";
import { isSafeReturnTo } from "../auth0-factory";

describe("isSafeReturnTo", () => {
  it("allows relative paths", () => {
    expect(isSafeReturnTo("/my-apps")).toBe(true);
    expect(isSafeReturnTo("/apps/sentiment")).toBe(true);
    expect(isSafeReturnTo("/")).toBe(true);
  });

  it("allows known app subdomain URLs", () => {
    expect(
      isSafeReturnTo("https://sentiment.apps.lastrev.com/"),
    ).toBe(true);
    expect(
      isSafeReturnTo("https://command-center.apps.lastrev.com/dashboard"),
    ).toBe(true);
  });

  it("allows local app subdomain URLs", () => {
    expect(
      isSafeReturnTo("http://sentiment.apps.lastrev.localhost:3000/"),
    ).toBe(true);
  });

  it("allows the bare domain itself", () => {
    expect(isSafeReturnTo("https://apps.lastrev.com/")).toBe(true);
  });

  it("rejects external URLs", () => {
    expect(isSafeReturnTo("https://evil.com/apps/sentiment")).toBe(false);
    expect(isSafeReturnTo("https://evil.apps.lastrev.com.attacker.com/")).toBe(
      false,
    );
  });

  it("rejects javascript: protocol", () => {
    expect(isSafeReturnTo("javascript:alert(1)")).toBe(false);
  });

  it("rejects data: protocol", () => {
    expect(isSafeReturnTo("data:text/html,<h1>hi</h1>")).toBe(false);
  });

  it("rejects empty string", () => {
    expect(isSafeReturnTo("")).toBe(false);
  });

  it("rejects protocol-relative URLs (open redirect vector)", () => {
    expect(isSafeReturnTo("//evil.com")).toBe(false);
    expect(isSafeReturnTo("//evil.com/apps/sentiment")).toBe(false);
  });
});
