import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mockTrackClient = vi.fn();

vi.mock("./active-backend", () => ({
  backend: {
    trackClient: (event: string, props?: Record<string, unknown>) =>
      mockTrackClient(event, props),
    captureServer: vi.fn(),
  },
}));

import { track } from "./client";

describe("track (client)", () => {
  const origNavigator = globalThis.navigator;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    Object.defineProperty(globalThis, "navigator", {
      value: origNavigator,
      configurable: true,
    });
    vi.unstubAllEnvs();
  });

  it("no-ops when NODE_ENV=test (default vitest env)", () => {
    track("login", { method: "email" });
    expect(mockTrackClient).not.toHaveBeenCalled();
  });

  it("no-ops when ANALYTICS_DISABLED=true", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("ANALYTICS_DISABLED", "true");
    track("login", { method: "email" });
    expect(mockTrackClient).not.toHaveBeenCalled();
  });

  it("no-ops when navigator.doNotTrack === '1'", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("ANALYTICS_DISABLED", "false");
    Object.defineProperty(globalThis, "navigator", {
      value: { doNotTrack: "1" },
      configurable: true,
    });
    track("login", { method: "email" });
    expect(mockTrackClient).not.toHaveBeenCalled();
  });

  it("forwards event and props to backend when enabled", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("ANALYTICS_DISABLED", "false");
    Object.defineProperty(globalThis, "navigator", {
      value: { doNotTrack: "0" },
      configurable: true,
    });
    track("login", { method: "email" });
    expect(mockTrackClient).toHaveBeenCalledTimes(1);
    expect(mockTrackClient).toHaveBeenCalledWith("login", { method: "email" });
  });
});
