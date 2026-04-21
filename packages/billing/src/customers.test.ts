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

  it("handles empty string email when creating customer", async () => {
    mockSingle.mockResolvedValue({ data: null });
    mockCustomersCreate.mockResolvedValue({ id: "cus_empty_email" });

    const result = await getOrCreateCustomer("user-3", "");

    expect(result).toBe("cus_empty_email");
    expect(mockCustomersCreate).toHaveBeenCalledWith({
      email: "",
      metadata: { userId: "user-3" },
    });
  });

  it("propagates Stripe network error when customer creation fails", async () => {
    mockSingle.mockResolvedValue({ data: null });
    mockCustomersCreate.mockRejectedValue(new Error("Network error: connection refused"));

    await expect(getOrCreateCustomer("user-4", "user4@test.com")).rejects.toThrow(
      "Network error: connection refused",
    );
  });

  it("does not call stripe when existing customer is found", async () => {
    mockSingle.mockResolvedValue({
      data: { stripe_customer_id: "cus_already_exists" },
    });

    await getOrCreateCustomer("user-5", "user5@test.com");

    expect(mockCustomersCreate).not.toHaveBeenCalled();
  });
});
