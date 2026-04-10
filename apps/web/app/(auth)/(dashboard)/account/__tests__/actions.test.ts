import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock next/headers ─────────────────────────────────────────────────────────
vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}));

// ── Mock @repo/auth/auth0-factory ─────────────────────────────────────────────
const mockGetSession = vi.fn();
vi.mock("@repo/auth/auth0-factory", () => ({
  getHostFromRequestHeaders: vi.fn().mockReturnValue("localhost:3000"),
  getAuth0ClientForHost: vi.fn().mockReturnValue({
    getSession: mockGetSession,
  }),
}));

// ── Mock @repo/billing ────────────────────────────────────────────────────────
const mockGetSubscription = vi.fn();
const mockCreatePortalSession = vi.fn();
vi.mock("@repo/billing", () => ({
  getSubscription: mockGetSubscription,
  createPortalSession: mockCreatePortalSession,
}));

beforeEach(() => {
  vi.clearAllMocks();
  process.env.APP_BASE_URL = "http://localhost:3000";
});

describe("createPortalSessionAction", () => {
  it("throws Unauthorized when no session", async () => {
    mockGetSession.mockResolvedValue(null);
    const { createPortalSessionAction } = await import("../actions");

    await expect(createPortalSessionAction()).rejects.toThrow("Unauthorized");
  });

  it("throws when user has no subscription", async () => {
    mockGetSession.mockResolvedValue({ user: { sub: "user_1" } });
    mockGetSubscription.mockResolvedValue(null);
    const { createPortalSessionAction } = await import("../actions");

    await expect(createPortalSessionAction()).rejects.toThrow(
      "No active subscription",
    );
  });

  it("throws when subscription has no stripe_customer_id", async () => {
    mockGetSession.mockResolvedValue({ user: { sub: "user_1" } });
    mockGetSubscription.mockResolvedValue({
      stripe_customer_id: null,
      tier: "free",
      status: "active",
    });
    const { createPortalSessionAction } = await import("../actions");

    await expect(createPortalSessionAction()).rejects.toThrow(
      "No active subscription",
    );
  });

  it("returns portal URL when subscription has a customer ID", async () => {
    mockGetSession.mockResolvedValue({ user: { sub: "user_1" } });
    mockGetSubscription.mockResolvedValue({
      stripe_customer_id: "cus_abc123",
      tier: "pro",
      status: "active",
    });
    mockCreatePortalSession.mockResolvedValue(
      "https://billing.stripe.com/session/test",
    );
    const { createPortalSessionAction } = await import("../actions");

    const url = await createPortalSessionAction();

    expect(url).toBe("https://billing.stripe.com/session/test");
    expect(mockCreatePortalSession).toHaveBeenCalledWith(
      "cus_abc123",
      "http://localhost:3000/account",
    );
  });

  it("uses APP_BASE_URL for the return URL", async () => {
    process.env.APP_BASE_URL = "https://app.example.com";
    mockGetSession.mockResolvedValue({ user: { sub: "user_1" } });
    mockGetSubscription.mockResolvedValue({
      stripe_customer_id: "cus_abc123",
      tier: "pro",
      status: "active",
    });
    mockCreatePortalSession.mockResolvedValue("https://billing.stripe.com/s/x");
    const { createPortalSessionAction } = await import("../actions");

    await createPortalSessionAction();

    expect(mockCreatePortalSession).toHaveBeenCalledWith(
      "cus_abc123",
      "https://app.example.com/account",
    );
  });
});
