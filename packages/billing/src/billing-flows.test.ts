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

// Subscriptions table spies. The real upsertSubscription first calls
// from('subscriptions').select('user_id').eq('stripe_customer_id', x).single()
// to look up the existing row, then calls from('subscriptions').upsert(payload).
const mockSubscriptionsUpsert = vi.fn(() => Promise.resolve({ error: null }));
const mockSubscriptionsSingle = vi.fn();
const mockSubscriptionsLookupEq = vi.fn(() => ({
  single: mockSubscriptionsSingle,
}));
const mockSubscriptionsSelect = vi.fn(() => ({
  eq: mockSubscriptionsLookupEq,
}));
const mockFrom = vi.fn((table: string) => {
  if (table === "processed_webhook_events") {
    return { select: mockSelect, insert: mockInsert };
  }
  if (table === "subscriptions") {
    return {
      update: mockUpdate,
      select: mockSubscriptionsSelect,
      upsert: mockSubscriptionsUpsert,
    };
  }
  return { update: mockUpdate };
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

  describe("End-to-end DB row write via real upsertSubscription", () => {
    // These tests bypass the module-level mock of ./subscriptions and exercise
    // the real upsertSubscription against the mocked service-role client, so we
    // can assert that a subscription row is actually written to the DB after a
    // simulated webhook. This is the M8 billing integration check (#64).
    it("writes a subscription row with the expected user_id and tier", async () => {
      const subscriptions = await vi.importActual<
        typeof import("./subscriptions")
      >("./subscriptions");

      mockSubscriptionsSingle.mockResolvedValueOnce({
        data: { user_id: "user-from-db" },
      });

      const stripeSub = {
        id: "sub_create_e2e",
        customer: "cus_create_e2e",
        status: "active",
        current_period_start: 1700000000,
        current_period_end: 1702592000,
        items: { data: [{ price: { metadata: { tier: "pro" } } }] },
      };

      await subscriptions.upsertSubscription(
        stripeSub as unknown as import("stripe").default.Subscription,
      );

      expect(mockFrom).toHaveBeenCalledWith("subscriptions");
      expect(mockSubscriptionsUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: "user-from-db",
          stripe_subscription_id: "sub_create_e2e",
          stripe_customer_id: "cus_create_e2e",
          tier: "pro",
          status: "active",
        }),
        { onConflict: "user_id" },
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
