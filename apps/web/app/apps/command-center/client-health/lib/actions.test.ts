import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const insertSelectSingle = vi.fn();
const insertSelect = vi.fn(() => ({ single: insertSelectSingle }));
const insertChain = vi.fn(() => ({ select: insertSelect }));
const fromMock = vi.fn(() => ({ insert: insertChain }));

vi.mock("@repo/db/service-role", () => ({
  createServiceRoleClient: () => ({ from: fromMock }),
}));

const headersMock = vi.fn();
vi.mock("next/headers", () => ({
  headers: () => headersMock(),
}));

import { addClientSite } from "./actions";

const ORIGINAL_ENV = { ...process.env };
const originalFetch = globalThis.fetch;

beforeEach(() => {
  vi.clearAllMocks();
  process.env = { ...ORIGINAL_ENV };
  process.env.CRON_SECRET = "test-secret";
  headersMock.mockResolvedValue(
    new Headers({ host: "apps.lastrev.com", "x-forwarded-proto": "https" }),
  );
});
afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  globalThis.fetch = originalFetch;
});

describe("addClientSite", () => {
  it("returns ok with the inserted id and fires the manual recheck", async () => {
    insertSelectSingle.mockResolvedValue({ data: { id: "site-1" }, error: null });
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const result = await addClientSite({ url: "https://example.com" });
    expect(result).toEqual({ ok: true, id: "site-1" });

    // Allow the queued microtask for the fire-and-forget fetch to flush.
    await new Promise<void>((resolve) => setTimeout(resolve, 0));

    expect(fromMock).toHaveBeenCalledWith("client_sites");
    expect(insertChain).toHaveBeenCalledWith({ url: "https://example.com", name: null });
    expect(fetchMock).toHaveBeenCalledOnce();
    const [target, init] = fetchMock.mock.calls[0]!;
    expect(target).toBe("https://apps.lastrev.com/api/cron/check-ssl/manual");
    expect((init as RequestInit).method).toBe("POST");
    expect((init as RequestInit).headers).toMatchObject({
      Authorization: "Bearer test-secret",
    });
  });

  it("does not block on a failing recheck fetch", async () => {
    insertSelectSingle.mockResolvedValue({ data: { id: "site-2" }, error: null });
    const fetchMock = vi.fn().mockRejectedValue(new Error("network"));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const result = await addClientSite({ url: "https://example.com" });
    expect(result).toEqual({ ok: true, id: "site-2" });

    // The action must complete even though fetch rejects.
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("returns invalid url for malformed input", async () => {
    const result = await addClientSite({ url: "not a url" });
    expect(result).toEqual({ ok: false, error: "invalid url" });
    expect(fromMock).not.toHaveBeenCalled();
  });

  it("propagates DB insert errors", async () => {
    insertSelectSingle.mockResolvedValue({ data: null, error: { message: "db down" } });
    const result = await addClientSite({ url: "https://example.com" });
    expect(result).toEqual({ ok: false, error: "db down" });
  });

  it("skips the recheck call when CRON_SECRET is unset", async () => {
    delete process.env.CRON_SECRET;
    insertSelectSingle.mockResolvedValue({ data: { id: "site-3" }, error: null });
    const fetchMock = vi.fn();
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const result = await addClientSite({ url: "https://example.com" });
    expect(result).toEqual({ ok: true, id: "site-3" });

    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
