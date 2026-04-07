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

vi.mock("@repo/db/service-role", () => ({
  createServiceRoleClient: () => ({ from: mockFrom }),
}));

import { upsertSubscription, getSubscription } from "./subscriptions";

describe("upsertSubscription", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("maps Stripe subscription data and upserts to DB", async () => {
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
        stripe_subscription_id: "sub_123",
        stripe_customer_id: "cus_456",
        tier: "pro",
        status: "active",
      }),
      { onConflict: "stripe_subscription_id" },
    );
  });

  it("defaults tier to free when metadata is missing", async () => {
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
