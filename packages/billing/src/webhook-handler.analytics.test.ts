import { describe, it, expect, vi, beforeEach } from "vitest";

const mockCapture = vi.fn();
vi.mock("@repo/analytics/server", () => ({
  capture: (...args: unknown[]) => mockCapture(...args),
}));

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

const mockProcessedMaybeSingle = vi.fn().mockResolvedValue({
  data: null,
  error: null,
});
const mockProcessedEq = vi.fn(() => ({ maybeSingle: mockProcessedMaybeSingle }));
const mockProcessedSelect = vi.fn(() => ({ eq: mockProcessedEq }));
const mockProcessedInsert = vi.fn().mockResolvedValue({ error: null });

const mockAuditInsert = vi.fn().mockResolvedValue({ error: null });

let subLookupRow: { user_id: string; tier?: string } | null = null;
const mockSubLookupMaybeSingle = vi.fn(async () => ({
  data: subLookupRow,
  error: null,
}));
const mockSubLookupEq = vi.fn(() => ({ maybeSingle: mockSubLookupMaybeSingle }));
const mockSubLookupSelect = vi.fn(() => ({ eq: mockSubLookupEq }));
const mockSubUpdate = vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ error: null }) }));

const mockFrom = vi.fn((table: string) => {
  if (table === "processed_webhook_events") {
    return { select: mockProcessedSelect, insert: mockProcessedInsert };
  }
  if (table === "audit_log") {
    return { insert: mockAuditInsert };
  }
  return { update: mockSubUpdate, select: mockSubLookupSelect };
});

vi.mock("@repo/db/service-role", () => ({
  createServiceRoleClient: () => ({ from: mockFrom }),
}));

import { handleStripeWebhook } from "./webhook-handler";

describe("handleStripeWebhook analytics events", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    subLookupRow = null;
    mockProcessedMaybeSingle.mockResolvedValue({ data: null, error: null });
    vi.stubEnv("STRIPE_WEBHOOK_SECRET", "whsec_test");
  });

  it("captures webhook_received before signature verification", async () => {
    mockConstructEvent.mockImplementation(() => {
      throw new Error("bad signature");
    });

    await expect(
      handleStripeWebhook("body", "bad-sig"),
    ).rejects.toThrow("bad signature");

    expect(mockCapture).toHaveBeenCalledWith("system", "webhook_received", {
      type: "stripe",
    });
  });

  it("captures subscription_started on customer.subscription.created", async () => {
    subLookupRow = { user_id: "user-abc" };
    mockConstructEvent.mockReturnValue({
      id: "evt_started",
      type: "customer.subscription.created",
      data: {
        object: {
          id: "sub_1",
          customer: "cus_1",
          items: { data: [{ price: { metadata: { tier: "pro" } } }] },
        },
      },
    });

    await handleStripeWebhook("body", "sig");

    expect(mockCapture).toHaveBeenCalledWith(
      "user-abc",
      "subscription_started",
      { tier: "pro" },
    );
  });

  it("captures subscription_canceled on customer.subscription.deleted", async () => {
    subLookupRow = { user_id: "user-xyz", tier: "enterprise" };
    mockConstructEvent.mockReturnValue({
      id: "evt_canceled",
      type: "customer.subscription.deleted",
      data: { object: { id: "sub_2", customer: "cus_2" } },
    });

    await handleStripeWebhook("body", "sig");

    expect(mockCapture).toHaveBeenCalledWith(
      "user-xyz",
      "subscription_canceled",
      { tier: "enterprise" },
    );
  });
});
