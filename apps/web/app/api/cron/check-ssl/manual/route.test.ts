import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { _resetRateLimitStore } from "@/lib/rate-limit";

const mockCheckSsl = vi.fn();
vi.mock("../check-url", () => ({
  checkSslForUrl: (...args: unknown[]) => mockCheckSsl(...args),
}));

vi.mock("@repo/db/service-role", () => ({
  createServiceRoleClient: () => ({ from: vi.fn() }),
}));

const mockIsAuthorized = vi.fn();
vi.mock("@/lib/cron-auth", () => ({
  isAuthorizedCronRequest: (...args: unknown[]) => mockIsAuthorized(...args),
}));

import { POST } from "./route";

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  vi.clearAllMocks();
  process.env = { ...ORIGINAL_ENV };
  _resetRateLimitStore();
});
afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

function makeRequest(body: unknown, headers: Record<string, string> = {}): Request {
  return new Request("http://localhost/api/cron/check-ssl/manual", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

describe("POST /api/cron/check-ssl/manual", () => {
  it("returns 401 when authorization fails", async () => {
    mockIsAuthorized.mockReturnValue(false);
    const res = await POST(makeRequest({ url: "https://example.com" }));
    expect(res.status).toBe(401);
    expect(mockCheckSsl).not.toHaveBeenCalled();
  });

  it("returns 200 and invokes checkSslForUrl on a valid request", async () => {
    mockIsAuthorized.mockReturnValue(true);
    mockCheckSsl.mockResolvedValue({
      url: "https://example.com",
      ok: true,
      sslExpiry: "2027-01-01T00:00:00.000Z",
      sslIssuer: "Test-CA",
    });

    const res = await POST(makeRequest({ url: "https://example.com" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.result).toMatchObject({ url: "https://example.com", ok: true });
    expect(mockCheckSsl).toHaveBeenCalledOnce();
    expect(mockCheckSsl).toHaveBeenCalledWith("https://example.com", expect.any(Object));
  });

  it("returns 400 when the url is not a valid URL", async () => {
    mockIsAuthorized.mockReturnValue(true);
    const res = await POST(makeRequest({ url: "not a url" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("invalid_body");
    expect(mockCheckSsl).not.toHaveBeenCalled();
  });

  it("returns 400 when the body is missing the url field", async () => {
    mockIsAuthorized.mockReturnValue(true);
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
    expect(mockCheckSsl).not.toHaveBeenCalled();
  });

  it("returns 400 when the body is malformed JSON", async () => {
    mockIsAuthorized.mockReturnValue(true);
    const res = await POST(makeRequest("not json"));
    expect(res.status).toBe(400);
  });

  it("returns 429 once the per-IP rate limit is exhausted", async () => {
    mockIsAuthorized.mockReturnValue(true);
    mockCheckSsl.mockResolvedValue({ url: "x", ok: true, sslExpiry: "x", sslIssuer: null });

    // Exhaust the 30/min budget for one IP
    for (let i = 0; i < 30; i += 1) {
      const res = await POST(
        makeRequest({ url: "https://example.com" }, { "x-forwarded-for": "9.9.9.9" }),
      );
      expect(res.status).toBe(200);
    }

    const overflow = await POST(
      makeRequest({ url: "https://example.com" }, { "x-forwarded-for": "9.9.9.9" }),
    );
    expect(overflow.status).toBe(429);
  });
});
