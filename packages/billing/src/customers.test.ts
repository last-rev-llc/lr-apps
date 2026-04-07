import { describe, it, expect, vi, beforeEach } from "vitest";

const mockSingle = vi.fn();
const mockEq = vi.fn(() => ({ single: mockSingle }));
const mockSelect = vi.fn(() => ({ eq: mockEq }));
const mockUpsert = vi.fn(() => ({ error: null }));
const mockFrom = vi.fn((table: string) => ({
  select: mockSelect,
  upsert: mockUpsert,
}));

vi.mock("@repo/db/service-role", () => ({
  createServiceRoleClient: () => ({ from: mockFrom }),
}));

const mockCustomersCreate = vi.fn();
vi.mock("./stripe-client", () => ({
  getStripe: () => ({
    customers: { create: mockCustomersCreate },
  }),
}));

import { getOrCreateCustomer } from "./customers";

describe("getOrCreateCustomer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns existing stripe_customer_id when subscription exists", async () => {
    mockSingle.mockResolvedValue({
      data: { stripe_customer_id: "cus_existing123" },
    });

    const result = await getOrCreateCustomer("user-1", "user@test.com");

    expect(result).toBe("cus_existing123");
    expect(mockCustomersCreate).not.toHaveBeenCalled();
  });

  it("creates a new Stripe customer and inserts subscription when none exists", async () => {
    mockSingle.mockResolvedValue({ data: null });
    mockCustomersCreate.mockResolvedValue({ id: "cus_new456" });

    const result = await getOrCreateCustomer("user-2", "new@test.com");

    expect(result).toBe("cus_new456");
    expect(mockCustomersCreate).toHaveBeenCalledWith({
      email: "new@test.com",
      metadata: { userId: "user-2" },
    });
    expect(mockUpsert).toHaveBeenCalledWith(
      {
        user_id: "user-2",
        stripe_customer_id: "cus_new456",
        tier: "free",
        status: "active",
      },
      { onConflict: "user_id" },
    );
  });
});
