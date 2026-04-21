import { describe, it, expect, vi } from "vitest";
import { buildAuthLoginHref } from "../auth-login-redirect";

describe("buildAuthLoginHref", () => {
  it("returns /my-apps returnTo when no redirectSlug", () => {
    const href = buildAuthLoginHref({ host: "localhost:3000" });
    expect(href).toContain("returnTo=%2Fmy-apps");
  });

  it("uses path-based returnTo on localhost", () => {
    const href = buildAuthLoginHref({
      host: "localhost:3000",
      redirectSlug: "sentiment",
    });
    expect(href).toContain("returnTo=%2Fapps%2Fsentiment");
  });

  it("uses subdomain returnTo in production", () => {
    const href = buildAuthLoginHref({
      host: "auth.apps.lastrev.com",
      redirectSlug: "sentiment",
    });
    expect(href).toContain(
      "returnTo=https%3A%2F%2Fsentiment.apps.lastrev.com%2F",
    );
  });

  it("falls back to /my-apps for unknown slug", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const href = buildAuthLoginHref({
      host: "localhost:3000",
      redirectSlug: "nonexistent-app",
    });
    expect(href).toContain("returnTo=%2Fmy-apps");
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("unknown app slug"),
    );
    warnSpy.mockRestore();
  });

  it("adds screen_hint=signup when specified", () => {
    const href = buildAuthLoginHref({
      host: "localhost:3000",
      screenHint: "signup",
    });
    expect(href).toContain("screen_hint=signup");
  });

  it("uses custom defaultReturnTo when specified", () => {
    const href = buildAuthLoginHref({
      host: "localhost:3000",
      defaultReturnTo: "/dashboard",
    });
    expect(href).toContain("returnTo=%2Fdashboard");
  });

  it("uses path-based returnTo on vercel.app previews", () => {
    const href = buildAuthLoginHref({
      host: "lr-apps-abc123.vercel.app",
      redirectSlug: "command-center",
    });
    expect(href).toContain("returnTo=%2Fapps%2Fcommand-center");
  });
});
