import { describe, it, expect, vi, beforeEach } from "vitest";
import type Stripe from "stripe";

const mockConstructEvent = vi.fn();
vi.mock("./stripe-client", () => ({
  getStripe: () => ({
    webhooks: { constructEvent: mockConstructEvent },
  }),
}));

const mockUpsertSubscription = vi.fn();
vi.mock("./subscriptions", () => ({
  upsertSubscription: (...args: unknown[]) =>
    mockUpsertSubscription(...args),
}));

const mockUpdate = vi.fn(() => ({ eq: vi.fn() }));
const mockFrom = vi.fn(() => ({ update: mockUpdate }));
vi.mock("@repo/db/service-role", () => ({
  createServiceRoleClient: () => ({ from: mockFrom }),
}));

import { handleStripeWebhook } from "./webhook-handler";

describe("handleStripeWebhook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("STRIPE_WEBHOOK_SECRET", "whsec_test");
  });

  it("calls upsertSubscription on customer.subscription.created", async () => {
    const subscription = { id: "sub_123", customer: "cus_456" };
    mockConstructEvent.mockReturnValue({
      type: "customer.subscription.created",
      data: { object: subscription },
    });

    const result = await handleStripeWebhook("body", "sig");

    expect(result).toEqual({ received: true });
    expect(mockUpsertSubscription).toHaveBeenCalledWith(subscription);
  });

  it("calls upsertSubscription on customer.subscription.updated", async () => {
    const subscription = { id: "sub_123", customer: "cus_456" };
    mockConstructEvent.mockReturnValue({
      type: "customer.subscription.updated",
      data: { object: subscription },
    });

    await handleStripeWebhook("body", "sig");

    expect(mockUpsertSubscription).toHaveBeenCalledWith(subscription);
  });

  it("updates status to canceled on customer.subscription.deleted", async () => {
    const subscription = { id: "sub_123", customer: "cus_456" };
    mockConstructEvent.mockReturnValue({
      type: "customer.subscription.deleted",
      data: { object: subscription },
    });

    await handleStripeWebhook("body", "sig");

    expect(mockUpsertSubscription).not.toHaveBeenCalled();
    expect(mockFrom).toHaveBeenCalledWith("subscriptions");
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ status: "canceled" }),
    );
  });

  it("returns received: true for unhandled event types", async () => {
    mockConstructEvent.mockReturnValue({
      type: "charge.succeeded",
      data: { object: {} },
    });

    const result = await handleStripeWebhook("body", "sig");

    expect(result).toEqual({ received: true });
    expect(mockUpsertSubscription).not.toHaveBeenCalled();
  });

  it("throws when STRIPE_WEBHOOK_SECRET is missing", async () => {
    vi.stubEnv("STRIPE_WEBHOOK_SECRET", "");

    await expect(handleStripeWebhook("body", "sig")).rejects.toThrow(
      "STRIPE_WEBHOOK_SECRET",
    );
  });
});
