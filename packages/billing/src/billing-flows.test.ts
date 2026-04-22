import { describe, it, expect, vi, beforeEach } from "vitest";

// ——— System boundary mocks ———

const mockConstructEvent = vi.fn();
vi.mock("./stripe-client", () => ({
  getStripe: () => ({
    webhooks: { constructEvent: mockConstructEvent },
  }),
}));

const mockUpsertSubscription = vi.fn();
const mockGetSubscription = vi.fn();
vi.mock("./subscriptions", () => ({
  upsertSubscription: (...args: unknown[]) => mockUpsertSubscription(...args),
  getSubscription: (...args: unknown[]) => mockGetSubscription(...args),
}));

const mockEq = vi.fn(() => Promise.resolve({ data: null }));
const mockUpdate = vi.fn(() => ({ eq: mockEq }));
const mockMaybeSingle = vi.fn();
const mockInsert = vi.fn();
const mockIdempotencyEq = vi.fn(() => ({ maybeSingle: mockMaybeSingle }));
const mockSelect = vi.fn(() => ({ eq: mockIdempotencyEq }));
const mockSubLookupMaybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
const mockSubLookupEq = vi.fn(() => ({ maybeSingle: mockSubLookupMaybeSingle }));
const mockSubLookupSelect = vi.fn(() => ({ eq: mockSubLookupEq }));
const mockFrom = vi.fn((table: string) => {
  if (table === "processed_webhook_events") {
    return { select: mockSelect, insert: mockInsert };
  }
  return { update: mockUpdate, select: mockSubLookupSelect };
});
vi.mock("@repo/db/service-role", () => ({
  createServiceRoleClient: () => ({ from: mockFrom }),
}));

import { handleStripeWebhook } from "./webhook-handler";
import { hasFeatureAccess } from "./has-feature-access";

describe("Billing flow integration tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("STRIPE_WEBHOOK_SECRET", "whsec_test");
    mockUpsertSubscription.mockResolvedValue(undefined);
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });
    mockInsert.mockResolvedValue({ error: null });
  });

  describe("Webhook event handling", () => {
    it("handles customer.subscription.created", async () => {
      const subscription = {
        id: "sub_123",
        customer: "cus_456",
        status: "active",
        items: { data: [{ price: { metadata: { tier: "pro" } } }] },
        current_period_start: 1700000000,
        current_period_end: 1702592000,
      };
      mockConstructEvent.mockReturnValue({
        type: "customer.subscription.created",
        data: { object: subscription },
      });

      const result = await handleStripeWebhook("body", "sig");

      expect(result).toEqual({ received: true });
      expect(mockUpsertSubscription).toHaveBeenCalledWith(subscription);
    });

    it("handles customer.subscription.updated", async () => {
      const subscription = {
        id: "sub_123",
        customer: "cus_456",
        status: "active",
        items: { data: [{ price: { metadata: { tier: "pro" } } }] },
        current_period_start: 1700000000,
        current_period_end: 1702592000,
      };
      mockConstructEvent.mockReturnValue({
        type: "customer.subscription.updated",
        data: { object: subscription },
      });

      const result = await handleStripeWebhook("body", "sig");

      expect(result).toEqual({ received: true });
      expect(mockUpsertSubscription).toHaveBeenCalledWith(subscription);
    });

    it("handles customer.subscription.deleted", async () => {
      const subscription = { id: "sub_789", customer: "cus_456" };
      mockConstructEvent.mockReturnValue({
        type: "customer.subscription.deleted",
        data: { object: subscription },
      });

      const result = await handleStripeWebhook("body", "sig");

      expect(result).toEqual({ received: true });
      expect(mockUpsertSubscription).not.toHaveBeenCalled();
      expect(mockFrom).toHaveBeenCalledWith("subscriptions");
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ status: "canceled" }),
      );
    });
  });

  describe("Subscription lifecycle: create → active → cancel", () => {
    it("processes full subscription lifecycle in order", async () => {
      const baseSubscription = {
        id: "sub_lifecycle",
        customer: "cus_lifecycle",
        current_period_start: 1700000000,
        current_period_end: 1702592000,
        items: { data: [{ price: { metadata: { tier: "pro" } } }] },
      };

      mockConstructEvent
        .mockReturnValueOnce({
          type: "customer.subscription.created",
          data: { object: { ...baseSubscription, status: "trialing" } },
        })
        .mockReturnValueOnce({
          type: "customer.subscription.updated",
          data: { object: { ...baseSubscription, status: "active" } },
        })
        .mockReturnValueOnce({
          type: "customer.subscription.deleted",
          data: { object: { id: "sub_lifecycle", customer: "cus_lifecycle" } },
        });

      await handleStripeWebhook("body1", "sig1");
      expect(mockUpsertSubscription).toHaveBeenCalledTimes(1);
      expect(mockUpsertSubscription).toHaveBeenCalledWith(
        expect.objectContaining({ status: "trialing" }),
      );

      await handleStripeWebhook("body2", "sig2");
      expect(mockUpsertSubscription).toHaveBeenCalledTimes(2);
      expect(mockUpsertSubscription).toHaveBeenCalledWith(
        expect.objectContaining({ status: "active" }),
      );

      await handleStripeWebhook("body3", "sig3");
      expect(mockUpsertSubscription).toHaveBeenCalledTimes(2);
      expect(mockFrom).toHaveBeenCalledWith("subscriptions");
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ status: "canceled" }),
      );
    });
  });

  describe("hasFeatureAccess with subscription status", () => {
    it("returns true for active pro user accessing pro feature", async () => {
      mockGetSubscription.mockResolvedValue({ tier: "pro", status: "active" });
      expect(await hasFeatureAccess("user-1", "advanced")).toBe(true);
    });

    it("returns false for free user accessing pro feature", async () => {
      mockGetSubscription.mockResolvedValue({ tier: "free", status: "active" });
      expect(await hasFeatureAccess("user-1", "advanced")).toBe(false);
    });

    it("returns true for trialing subscription", async () => {
      mockGetSubscription.mockResolvedValue({ tier: "pro", status: "trialing" });
      expect(await hasFeatureAccess("user-1", "advanced")).toBe(true);
    });

    it("returns false for past_due subscription", async () => {
      mockGetSubscription.mockResolvedValue({ tier: "pro", status: "past_due" });
      expect(await hasFeatureAccess("user-1", "advanced")).toBe(false);
    });
  });
});
