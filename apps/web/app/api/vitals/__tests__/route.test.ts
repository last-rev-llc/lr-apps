import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const logInfo = vi.fn();
vi.mock("@repo/logger", () => ({
  log: { info: (...args: unknown[]) => logInfo(...args) },
}));

import { POST } from "../route";

function jsonRequest(body: unknown): Request {
  return new Request("http://localhost/api/vitals", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/vitals", () => {
  beforeEach(() => {
    logInfo.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("accepts a valid metric and returns 204", async () => {
    const res = await POST(
      jsonRequest({
        name: "LCP",
        value: 1234.5,
        id: "v1-1234",
        rating: "good",
        path: "/apps/accounts",
        appSlug: "accounts",
      }),
    );
    expect(res.status).toBe(204);
    expect(logInfo).toHaveBeenCalledWith(
      "web-vital",
      expect.objectContaining({
        metric: "LCP",
        value: 1234.5,
        rating: "good",
        path: "/apps/accounts",
        appSlug: "accounts",
      }),
    );
  });

  it("rejects unknown metric name with 400", async () => {
    const res = await POST(
      jsonRequest({ name: "BOGUS", value: 1, id: "x" }),
    );
    expect(res.status).toBe(400);
    expect(logInfo).not.toHaveBeenCalled();
  });

  it("rejects malformed JSON with 400", async () => {
    const req = new Request("http://localhost/api/vitals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not json{{{",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect(logInfo).not.toHaveBeenCalled();
  });

  it("rejects missing required field with 400", async () => {
    const res = await POST(jsonRequest({ name: "CLS", value: 0.1 }));
    expect(res.status).toBe(400);
  });

  it("accepts INP / TTFB / FCP / FID / CLS as valid metric names", async () => {
    for (const name of ["INP", "TTFB", "FCP", "FID", "CLS"]) {
      const res = await POST(jsonRequest({ name, value: 1, id: `id-${name}` }));
      expect(res.status).toBe(204);
    }
  });
});
