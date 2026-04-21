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

// Mock DB: tracks inserted event IDs and supports maybeSingle lookup
let processedEventIds: Set<string> = new Set();
let insertShouldFail = false;

const mockMaybeSingle = vi.fn();
const mockEq = vi.fn(() => ({ maybeSingle: mockMaybeSingle }));
const mockSelect = vi.fn(() => ({ eq: mockEq }));
const mockInsert = vi.fn();
const mockUpdate = vi.fn(() => ({ eq: vi.fn() }));
const mockFrom = vi.fn((table: string) => {
  if (table === "processed_webhook_events") {
    return {
      select: mockSelect,
      insert: mockInsert,
    };
  }
  return { update: mockUpdate };
});

vi.mock("@repo/db/service-role", () => ({
  createServiceRoleClient: () => ({ from: mockFrom }),
}));

import { handleStripeWebhook } from "./webhook-handler";

describe("handleStripeWebhook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    processedEventIds = new Set();
    insertShouldFail = false;
    vi.stubEnv("STRIPE_WEBHOOK_SECRET", "whsec_test");

    // Default: event not yet processed
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });
    // Default: insert succeeds
    mockInsert.mockResolvedValue({ error: null });
  });

  it("calls upsertSubscription on customer.subscription.created", async () => {
    const subscription = { id: "sub_123", customer: "cus_456" };
    mockConstructEvent.mockReturnValue({
      id: "evt_001",
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
      id: "evt_002",
      type: "customer.subscription.updated",
      data: { object: subscription },
    });

    await handleStripeWebhook("body", "sig");

    expect(mockUpsertSubscription).toHaveBeenCalledWith(subscription);
  });

  it("updates status to canceled on customer.subscription.deleted", async () => {
    const subscription = { id: "sub_123", customer: "cus_456" };
    mockConstructEvent.mockReturnValue({
      id: "evt_003",
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
      id: "evt_004",
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

  it("propagates error when constructEvent throws due to invalid signature", async () => {
    mockConstructEvent.mockImplementation(() => {
      throw new Error("No signatures found matching the expected signature for payload");
    });

    await expect(handleStripeWebhook("tampered-body", "bad-sig")).rejects.toThrow(
      "No signatures found",
    );
  });

  it("handles customer.subscription.deleted with missing subscription id gracefully", async () => {
    mockConstructEvent.mockReturnValue({
      id: "evt_deleted_no_id",
      type: "customer.subscription.deleted",
      data: { object: { id: undefined, customer: "cus_456" } },
    });
    const mockEqInner = vi.fn().mockResolvedValue({ error: null });
    mockUpdate.mockReturnValue({ eq: mockEqInner });

    const result = await handleStripeWebhook("body", "sig");

    expect(result).toEqual({ received: true });
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ status: "canceled" }),
    );
  });

  it("returns early without calling upsertSubscription for a duplicate event ID", async () => {
    const subscription = { id: "sub_dup", customer: "cus_456" };
    mockConstructEvent.mockReturnValue({
      id: "evt_duplicate",
      type: "customer.subscription.created",
      data: { object: subscription },
    });

    mockMaybeSingle.mockResolvedValue({
      data: { event_id: "evt_duplicate" },
      error: null,
    });

    const result = await handleStripeWebhook("body", "sig");

    expect(result).toEqual({ received: true });
    expect(mockUpsertSubscription).not.toHaveBeenCalled();
  });

  it("inserts event ID into processed_webhook_events after processing", async () => {
    const subscription = { id: "sub_new", customer: "cus_456" };
    mockConstructEvent.mockReturnValue({
      id: "evt_new",
      type: "customer.subscription.created",
      data: { object: subscription },
    });

    await handleStripeWebhook("body", "sig");

    expect(mockInsert).toHaveBeenCalledWith({ event_id: "evt_new" });
  });

  it("does not throw when insert into processed_webhook_events fails (fail open)", async () => {
    const subscription = { id: "sub_failopen", customer: "cus_456" };
    mockConstructEvent.mockReturnValue({
      id: "evt_failopen",
      type: "customer.subscription.created",
      data: { object: subscription },
    });

    mockInsert.mockRejectedValue(new Error("DB write failed"));

    const result = await handleStripeWebhook("body", "sig");

    expect(result).toEqual({ received: true });
    expect(mockUpsertSubscription).toHaveBeenCalledWith(subscription);
  });
});
