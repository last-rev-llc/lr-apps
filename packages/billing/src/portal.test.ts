import { describe, it, expect, vi, beforeEach } from "vitest";

const mockPortalSessionsCreate = vi.hoisted(() => vi.fn());

vi.mock("./stripe-client", () => ({
  getStripe: vi.fn().mockReturnValue({
    billingPortal: {
      sessions: {
        create: mockPortalSessionsCreate,
      },
    },
  }),
}));

import { createPortalSession } from "./portal";

describe("createPortalSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls stripe billingPortal.sessions.create with correct params", async () => {
    mockPortalSessionsCreate.mockResolvedValue({
      url: "https://billing.stripe.com/session/test_abc",
    });

    await createPortalSession("cus_test123", "https://app.example.com/account");

    expect(mockPortalSessionsCreate).toHaveBeenCalledWith({
      customer: "cus_test123",
      return_url: "https://app.example.com/account",
    });
  });

  it("returns the session URL", async () => {
    const expectedUrl = "https://billing.stripe.com/session/test_abc";
    mockPortalSessionsCreate.mockResolvedValue({ url: expectedUrl });

    const result = await createPortalSession(
      "cus_test123",
      "https://app.example.com/account",
    );

    expect(result).toBe(expectedUrl);
  });

  it("propagates Stripe errors", async () => {
    mockPortalSessionsCreate.mockRejectedValue(
      new Error("No such customer: cus_invalid"),
    );

    await expect(
      createPortalSession("cus_invalid", "https://app.example.com/account"),
    ).rejects.toThrow("No such customer: cus_invalid");
  });
});
