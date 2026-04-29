import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock next/headers ─────────────────────────────────────────────────────────
vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}));

// ── Mock @repo/auth/auth0-factory ─────────────────────────────────────────────
const mockGetSession = vi.fn();
vi.mock("@repo/auth/auth0-factory", () => ({
  getHostFromRequestHeaders: vi.fn().mockReturnValue("localhost:3000"),
  getAuth0ClientForHost: vi.fn().mockReturnValue({
    getSession: mockGetSession,
  }),
}));

// ── Mock @repo/billing ────────────────────────────────────────────────────────
const mockGetOrCreateCustomer = vi.fn();
const mockCheckoutSessionsCreate = vi.fn();
vi.mock("@repo/billing", () => ({
  getOrCreateCustomer: mockGetOrCreateCustomer,
  getStripe: vi.fn().mockReturnValue({
    checkout: {
      sessions: {
        create: mockCheckoutSessionsCreate,
      },
    },
  }),
}));

// ── Mock @repo/db for audit logging ───────────────────────────────────────────
const mockLogAuditEvent = vi.fn().mockResolvedValue(undefined);
vi.mock("@repo/db/audit", () => ({
  logAuditEvent: (...args: unknown[]) => mockLogAuditEvent(...args),
}));
vi.mock("@repo/db/service-role", () => ({
  createServiceRoleClient: vi.fn().mockReturnValue({}),
}));

const CSRF_VALUE = "test-csrf-token";

function makeRequest(
  body: unknown,
  options: { csrfCookie?: string | null; csrfHeader?: string | null } = {},
): Request {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const cookieVal = options.csrfCookie === undefined ? CSRF_VALUE : options.csrfCookie;
  const headerVal = options.csrfHeader === undefined ? CSRF_VALUE : options.csrfHeader;
  if (cookieVal !== null) headers["cookie"] = `csrf_token=${cookieVal}`;
  if (headerVal !== null) headers["x-csrf-token"] = headerVal;
  return new Request("http://localhost/api/checkout/session", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.APP_BASE_URL = "http://localhost:3000";
});

describe("POST /api/checkout/session", () => {
  it("returns 401 when no session", async () => {
    mockGetSession.mockResolvedValue(null);
    const { POST } = await import("../route");

    const res = await POST(makeRequest({ priceId: "price_123" }));

    expect(res.status).toBe(401);
    const data = await res.json() as { error: string };
    expect(data.error).toBe("Unauthorized");
  });

  it("returns 400 with invalid_input issues when priceId is missing", async () => {
    mockGetSession.mockResolvedValue({
      user: { sub: "user_1", email: "user@example.com" },
    });
    const { POST } = await import("../route");

    const res = await POST(makeRequest({}));

    expect(res.status).toBe(400);
    const data = (await res.json()) as {
      error: string;
      issues: Array<{ path: unknown; message: string }>;
    };
    expect(data.error).toBe("invalid_input");
    expect(data.issues).toBeInstanceOf(Array);
    expect(data.issues.length).toBeGreaterThan(0);
    expect(data.issues[0]?.path).toContain("priceId");
  });

  it("returns 400 with invalid_input when priceId is empty string", async () => {
    mockGetSession.mockResolvedValue({
      user: { sub: "user_1", email: "user@example.com" },
    });
    const { POST } = await import("../route");

    const res = await POST(makeRequest({ priceId: "" }));

    expect(res.status).toBe(400);
    const data = (await res.json()) as { error: string };
    expect(data.error).toBe("invalid_input");
  });

  it("creates checkout session and returns checkoutUrl", async () => {
    mockGetSession.mockResolvedValue({
      user: { sub: "user_1", email: "user@example.com" },
    });
    mockGetOrCreateCustomer.mockResolvedValue("cus_abc123");
    mockCheckoutSessionsCreate.mockResolvedValue({
      id: "cs_test_abc",
      url: "https://checkout.stripe.com/pay/cs_test_abc",
    });
    const { POST } = await import("../route");

    const res = await POST(makeRequest({ priceId: "price_pro_monthly" }));

    expect(res.status).toBe(200);
    const data = await res.json() as { checkoutUrl: string };
    expect(data.checkoutUrl).toBe("https://checkout.stripe.com/pay/cs_test_abc");
    expect(mockLogAuditEvent).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        userId: "user_1",
        action: "checkout.session.created",
        resource: "cs_test_abc",
        metadata: { priceId: "price_pro_monthly" },
      }),
    );
  });

  it("passes correct customer ID and price to Stripe", async () => {
    mockGetSession.mockResolvedValue({
      user: { sub: "user_1", email: "user@example.com" },
    });
    mockGetOrCreateCustomer.mockResolvedValue("cus_abc123");
    mockCheckoutSessionsCreate.mockResolvedValue({ url: "https://stripe.com/pay/x" });
    const { POST } = await import("../route");

    await POST(makeRequest({ priceId: "price_pro_monthly" }));

    expect(mockGetOrCreateCustomer).toHaveBeenCalledWith("user_1", "user@example.com");
    expect(mockCheckoutSessionsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        customer: "cus_abc123",
        line_items: [{ price: "price_pro_monthly", quantity: 1 }],
        mode: "subscription",
        success_url: expect.stringContaining("/checkout/success"),
        cancel_url: expect.stringContaining("/checkout/cancel"),
      }),
    );
  });

  it("returns 500 when Stripe throws", async () => {
    mockGetSession.mockResolvedValue({
      user: { sub: "user_1", email: "user@example.com" },
    });
    mockGetOrCreateCustomer.mockResolvedValue("cus_abc123");
    mockCheckoutSessionsCreate.mockRejectedValue(new Error("Stripe error"));
    const { POST } = await import("../route");

    const res = await POST(makeRequest({ priceId: "price_pro_monthly" }));

    expect(res.status).toBe(500);
    const data = await res.json() as { error: string };
    expect(data.error).toBe("Stripe error");
  });

  it("returns 400 invalid_json when request body is not valid JSON", async () => {
    mockGetSession.mockResolvedValue({
      user: { sub: "user_1", email: "user@example.com" },
    });
    const { POST } = await import("../route");
    const req = new Request("http://localhost/api/checkout/session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie: `csrf_token=${CSRF_VALUE}`,
        "x-csrf-token": CSRF_VALUE,
      },
      body: "not-json",
    });

    const res = await POST(req);

    expect(res.status).toBe(400);
    const data = (await res.json()) as { error: string };
    expect(data.error).toBe("invalid_json");
  });

  it("returns 403 csrf_invalid when the csrf cookie is missing", async () => {
    mockGetSession.mockResolvedValue({
      user: { sub: "user_1", email: "user@example.com" },
    });
    const { POST } = await import("../route");

    const res = await POST(
      makeRequest({ priceId: "price_pro_monthly" }, { csrfCookie: null }),
    );

    expect(res.status).toBe(403);
    const data = (await res.json()) as { error: string };
    expect(data.error).toBe("csrf_invalid");
  });

  it("returns 403 csrf_invalid when header and cookie mismatch", async () => {
    mockGetSession.mockResolvedValue({
      user: { sub: "user_1", email: "user@example.com" },
    });
    const { POST } = await import("../route");

    const res = await POST(
      makeRequest(
        { priceId: "price_pro_monthly" },
        { csrfHeader: "different-token" },
      ),
    );

    expect(res.status).toBe(403);
  });
});
