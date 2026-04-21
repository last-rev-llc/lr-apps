import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockSelect = vi.fn();
const mockLt = vi.fn(() => ({ select: mockSelect }));
const mockDelete = vi.fn(() => ({ lt: mockLt }));
const mockFrom = vi.fn(() => ({ delete: mockDelete }));

vi.mock("@repo/db/service-role", () => ({
  createServiceRoleClient: () => ({ from: mockFrom }),
}));

const mockIsAuthorized = vi.fn();
vi.mock("@/lib/cron-auth", () => ({
  isAuthorizedCronRequest: (...args: unknown[]) => mockIsAuthorized(...args),
}));

import { GET } from "./route";

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  vi.clearAllMocks();
  process.env = { ...ORIGINAL_ENV };
});
afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

function makeRequest(): Request {
  return new Request("http://localhost/api/cron/cleanup");
}

describe("GET /api/cron/cleanup", () => {
  it("returns 401 when isAuthorizedCronRequest returns false", async () => {
    mockIsAuthorized.mockReturnValue(false);
    const res = await GET(makeRequest());
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json).toEqual({ error: "Unauthorized" });
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("returns 200 with deleted count when authorized", async () => {
    mockIsAuthorized.mockReturnValue(true);
    mockSelect.mockResolvedValue({
      data: [{ event_id: "e1" }, { event_id: "e2" }],
      error: null,
    });

    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.deleted).toBe(2);
    expect(typeof json.cutoff).toBe("string");
    expect(mockFrom).toHaveBeenCalledWith("processed_webhook_events");
    expect(mockDelete).toHaveBeenCalledOnce();
    expect(mockLt).toHaveBeenCalledWith("processed_at", expect.any(String));
  });

  it("returns 500 when the delete query errors", async () => {
    mockIsAuthorized.mockReturnValue(true);
    mockSelect.mockResolvedValue({
      data: null,
      error: { message: "db down" },
    });

    const res = await GET(makeRequest());
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json).toEqual({ error: "db down" });
  });

  it("uses a 30-day retention cutoff", async () => {
    mockIsAuthorized.mockReturnValue(true);
    mockSelect.mockResolvedValue({ data: [], error: null });

    const before = Date.now();
    await GET(makeRequest());
    const after = Date.now();

    const cutoffArg = mockLt.mock.calls[0][1];
    const cutoffMs = Date.parse(cutoffArg);
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    expect(cutoffMs).toBeGreaterThanOrEqual(before - thirtyDaysMs - 1000);
    expect(cutoffMs).toBeLessThanOrEqual(after - thirtyDaysMs + 1000);
  });
});
