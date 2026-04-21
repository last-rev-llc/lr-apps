import { describe, it, expect, vi, beforeEach } from "vitest";

const mockConstructEvent = vi.fn();
vi.mock("./stripe-client", () => ({
  getStripe: () => ({
    webhooks: { constructEvent: mockConstructEvent },
  }),
}));

const mockUpsertSubscription = vi.fn();
vi.mock("./subscriptions", () => ({
  upsertSubscription: (...args: unknown[]) => mockUpsertSubscription(...args),
}));

const mockUpdate = vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ error: null }) }));
const mockFrom = vi.fn(() => ({ update: mockUpdate }));
vi.mock("@repo/db/service-role", () => ({
  createServiceRoleClient: () => ({ from: mockFrom }),
}));

import { handleStripeWebhook } from "./webhook-handler";

describe("handleStripeWebhook edge cases", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("STRIPE_WEBHOOK_SECRET", "whsec_test");
  });

  describe("signature verification failures", () => {
    it("throws without writing to Supabase when signature is invalid", async () => {
      mockConstructEvent.mockImplementation(() => {
        throw new Error("Webhook signature verification failed");
      });

      await expect(handleStripeWebhook("body", "sig-bad")).rejects.toThrow(
        /signature verification/i,
      );
      expect(mockUpsertSubscription).not.toHaveBeenCalled();
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it("throws when the signature header is empty", async () => {
      mockConstructEvent.mockImplementation((_body, sig) => {
        if (!sig) throw new Error("No stripe-signature header value was provided");
        return { type: "customer.subscription.created", data: { object: {} } };
      });

      await expect(handleStripeWebhook("body", "")).rejects.toThrow(
        /stripe-signature/i,
      );
      expect(mockFrom).not.toHaveBeenCalled();
    });
  });

  describe("malformed / unknown payloads", () => {
    it("returns received:true for unknown event types without writing", async () => {
      mockConstructEvent.mockReturnValue({
        type: "invoice.upcoming",
        data: { object: { id: "inv_1" } },
      });

      const result = await handleStripeWebhook("body", "sig");
      expect(result).toEqual({ received: true });
      expect(mockUpsertSubscription).not.toHaveBeenCalled();
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it("passes whatever subscription object Stripe provides through to upsertSubscription", async () => {
      // Even minimal payload reaches the upsert — validation lives in upsertSubscription.
      const partial = { id: "sub_minimal" };
      mockConstructEvent.mockReturnValue({
        type: "customer.subscription.created",
        data: { object: partial },
      });

      await handleStripeWebhook("body", "sig");
      expect(mockUpsertSubscription).toHaveBeenCalledWith(partial);
    });
  });

  describe("missing STRIPE_WEBHOOK_SECRET", () => {
    it("throws before calling Stripe SDK when secret is unset", async () => {
      vi.stubEnv("STRIPE_WEBHOOK_SECRET", "");

      await expect(handleStripeWebhook("body", "sig")).rejects.toThrow(
        /STRIPE_WEBHOOK_SECRET/,
      );
      expect(mockConstructEvent).not.toHaveBeenCalled();
      expect(mockUpsertSubscription).not.toHaveBeenCalled();
      expect(mockFrom).not.toHaveBeenCalled();
    });
  });
});
