import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";
import { _resetRateLimitStore } from "@/lib/rate-limit";

const mockHandleStripeWebhook = vi.fn();
vi.mock("@repo/billing/webhook-handler", () => ({
  handleStripeWebhook: (...args: unknown[]) => mockHandleStripeWebhook(...args),
}));

function makeRequest(body: string, headers: Record<string, string> = {}): Request {
  return new Request("http://localhost/api/webhooks/stripe", {
    method: "POST",
    body,
    headers,
  });
}

describe("POST /api/webhooks/stripe", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    _resetRateLimitStore();
  });

  it("returns 200 with { received: true } on valid signature", async () => {
    mockHandleStripeWebhook.mockResolvedValue({ received: true });

    const request = makeRequest("payload", { "stripe-signature": "sig_valid" });
    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({ received: true });
    expect(mockHandleStripeWebhook).toHaveBeenCalledOnce();
  });

  it("returns 400 when stripe-signature header is missing", async () => {
    const request = makeRequest("payload");
    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json).toEqual({ error: "Missing stripe-signature header" });
    expect(mockHandleStripeWebhook).not.toHaveBeenCalled();
  });

  it("returns 400 when handleStripeWebhook throws", async () => {
    mockHandleStripeWebhook.mockRejectedValue(new Error("No signatures found"));

    const request = makeRequest("payload", { "stripe-signature": "sig_bad" });
    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json).toEqual({ error: "No signatures found" });
  });

  it("passes raw body as Buffer to handleStripeWebhook", async () => {
    mockHandleStripeWebhook.mockResolvedValue({ received: true });

    const request = makeRequest("raw-body", { "stripe-signature": "sig_test" });
    await POST(request);

    const [body, signature] = mockHandleStripeWebhook.mock.calls[0];
    expect(Buffer.isBuffer(body)).toBe(true);
    expect(body.toString()).toBe("raw-body");
    expect(signature).toBe("sig_test");
  });

  it("includes X-RateLimit headers on successful response", async () => {
    mockHandleStripeWebhook.mockResolvedValue({ received: true });
    const request = makeRequest("payload", {
      "stripe-signature": "sig_ok",
      "x-forwarded-for": "9.9.9.9",
    });
    const response = await POST(request);

    expect(response.headers.get("X-RateLimit-Limit")).toBe("100");
    expect(response.headers.get("X-RateLimit-Remaining")).toBe("99");
    expect(response.headers.get("X-RateLimit-Reset")).toBeTruthy();
  });

  it("returns 429 after exceeding the webhook rate limit", async () => {
    mockHandleStripeWebhook.mockResolvedValue({ received: true });
    const headers = { "stripe-signature": "sig_ok", "x-forwarded-for": "8.8.8.8" };
    for (let i = 0; i < 100; i++) {
      const res = await POST(makeRequest("payload", headers));
      expect(res.status).toBe(200);
    }
    const blocked = await POST(makeRequest("payload", headers));
    expect(blocked.status).toBe(429);
    expect(blocked.headers.get("Retry-After")).toBeTruthy();
    expect(blocked.headers.get("X-RateLimit-Remaining")).toBe("0");
  });
});
