import { describe, it, expect, vi, beforeEach } from "vitest";
import type Stripe from "stripe";

const mockUpsert = vi.fn(() => ({ error: null }));
const mockSingle = vi.fn();
const mockEq = vi.fn(() => ({ single: mockSingle }));
const mockSelect = vi.fn(() => ({ eq: mockEq }));
const mockFrom = vi.fn(() => ({
  select: mockSelect,
  upsert: mockUpsert,
}));

// For upsertSubscription, the first call to from().select().eq().single()
// looks up user_id by stripe_customer_id, then the second call does the upsert.

vi.mock("@repo/db/service-role", () => ({
  createServiceRoleClient: () => ({ from: mockFrom }),
}));

import { upsertSubscription, getSubscription } from "./subscriptions";

describe("upsertSubscription", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("maps Stripe subscription data and upserts to DB", async () => {
    // First call: lookup user_id by stripe_customer_id
    mockSingle.mockResolvedValueOnce({ data: { user_id: "user-1" } });

    const stripeSub = {
      id: "sub_123",
      customer: "cus_456",
      status: "active",
      current_period_start: 1700000000,
      current_period_end: 1702592000,
      items: {
        data: [{ price: { metadata: { tier: "pro" } } }],
      },
    } as unknown as Stripe.Subscription;

    await upsertSubscription(stripeSub);

    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "user-1",
        stripe_subscription_id: "sub_123",
        stripe_customer_id: "cus_456",
        tier: "pro",
        status: "active",
      }),
      { onConflict: "user_id" },
    );
  });

  it("defaults tier to free when metadata is missing", async () => {
    mockSingle.mockResolvedValueOnce({ data: { user_id: "user-2" } });

    const stripeSub = {
      id: "sub_789",
      customer: "cus_000",
      status: "trialing",
      current_period_start: 1700000000,
      current_period_end: 1702592000,
      items: { data: [{ price: { metadata: {} } }] },
    } as unknown as Stripe.Subscription;

    await upsertSubscription(stripeSub);

    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ tier: "free", status: "trialing" }),
      expect.anything(),
    );
  });

  it("throws when no existing subscription row is found", async () => {
    mockSingle.mockResolvedValueOnce({ data: null });

    const stripeSub = {
      id: "sub_999",
      customer: "cus_unknown",
      status: "active",
      current_period_start: 1700000000,
      current_period_end: 1702592000,
      items: { data: [{ price: { metadata: { tier: "pro" } } }] },
    } as unknown as Stripe.Subscription;

    await expect(upsertSubscription(stripeSub)).rejects.toThrow(
      "No subscription row found",
    );
  });

  it("maps past_due Stripe status to past_due in DB", async () => {
    mockSingle.mockResolvedValueOnce({ data: { user_id: "user-3" } });

    const stripeSub = {
      id: "sub_past_due",
      customer: "cus_789",
      status: "past_due",
      current_period_start: 1700000000,
      current_period_end: 1702592000,
      items: { data: [{ price: { metadata: { tier: "pro" } } }] },
    } as unknown as Stripe.Subscription;

    await upsertSubscription(stripeSub);

    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ status: "past_due" }),
      expect.anything(),
    );
  });

  it("maps incomplete Stripe status to incomplete in DB", async () => {
    mockSingle.mockResolvedValueOnce({ data: { user_id: "user-4" } });

    const stripeSub = {
      id: "sub_incomplete",
      customer: "cus_111",
      status: "incomplete",
      current_period_start: 1700000000,
      current_period_end: 1702592000,
      items: { data: [{ price: { metadata: { tier: "free" } } }] },
    } as unknown as Stripe.Subscription;

    await upsertSubscription(stripeSub);

    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ status: "incomplete" }),
      expect.anything(),
    );
  });

  it("maps unpaid Stripe status to past_due in DB", async () => {
    mockSingle.mockResolvedValueOnce({ data: { user_id: "user-5" } });

    const stripeSub = {
      id: "sub_unpaid",
      customer: "cus_222",
      status: "unpaid",
      current_period_start: 1700000000,
      current_period_end: 1702592000,
      items: { data: [{ price: { metadata: { tier: "pro" } } }] },
    } as unknown as Stripe.Subscription;

    await upsertSubscription(stripeSub);

    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ status: "past_due" }),
      expect.anything(),
    );
  });

  it("maps incomplete_expired to incomplete in DB", async () => {
    mockSingle.mockResolvedValueOnce({ data: { user_id: "user-6" } });

    const stripeSub = {
      id: "sub_exp",
      customer: "cus_333",
      status: "incomplete_expired",
      current_period_start: 1700000000,
      current_period_end: 1702592000,
      items: { data: [{ price: { metadata: {} } }] },
    } as unknown as Stripe.Subscription;

    await upsertSubscription(stripeSub);

    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ status: "incomplete" }),
      expect.anything(),
    );
  });
});

describe("getSubscription", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns subscription when found", async () => {
    const sub = { id: "sub-1", user_id: "user-1", tier: "pro" };
    mockSingle.mockResolvedValue({ data: sub });

    const result = await getSubscription("user-1");

    expect(result).toEqual(sub);
    expect(mockFrom).toHaveBeenCalledWith("subscriptions");
  });

  it("returns null when no subscription exists", async () => {
    mockSingle.mockResolvedValue({ data: null });

    const result = await getSubscription("user-none");

    expect(result).toBeNull();
  });
});
