import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mockCaptureServer = vi.fn();

vi.mock("./active-backend", () => ({
  backend: {
    trackClient: vi.fn(),
    captureServer: (
      userId: string,
      event: string,
      props?: Record<string, unknown>,
    ) => mockCaptureServer(userId, event, props),
  },
}));

import { capture, hashUserId } from "./server";

describe("capture (server)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("no-ops when NODE_ENV=test (default vitest env)", async () => {
    await capture("user-1", "app_opened", { slug: "leads" });
    expect(mockCaptureServer).not.toHaveBeenCalled();
  });

  it("no-ops when ANALYTICS_DISABLED=true", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("ANALYTICS_DISABLED", "true");
    await capture("user-1", "app_opened", { slug: "leads" });
    expect(mockCaptureServer).not.toHaveBeenCalled();
  });

  it("forwards userId, event, and props to backend when enabled", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("ANALYTICS_DISABLED", "false");
    await capture("user-1", "app_opened", { slug: "leads" });
    expect(mockCaptureServer).toHaveBeenCalledTimes(1);
    expect(mockCaptureServer).toHaveBeenCalledWith("user-1", "app_opened", {
      slug: "leads",
    });
  });
});

describe("hashUserId", () => {
  it("returns deterministic SHA-256 hex", () => {
    const a = hashUserId("auth0|123");
    const b = hashUserId("auth0|123");
    expect(a).toBe(b);
    expect(a).toMatch(/^[a-f0-9]{64}$/);
  });

  it("returns different hashes for different inputs", () => {
    expect(hashUserId("a")).not.toBe(hashUserId("b"));
  });
});
