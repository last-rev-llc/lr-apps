import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  vi.stubEnv("NEXT_PUBLIC_ANALYTICS_HOST", "https://app.posthog.com");
  vi.stubEnv("POSTHOG_PROJECT_ID", "1234");
  vi.stubEnv("POSTHOG_PERSONAL_API_KEY", "phx_test");
  fetchMock.mockReset();
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

import {
  getEventTotalsBySlug,
  getRecentEvents,
  getTopEvents,
} from "../lib/posthog-client";

describe("posthog-client", () => {
  it("returns empty arrays when env is not configured", async () => {
    vi.stubEnv("POSTHOG_PROJECT_ID", "");
    expect(await getEventTotalsBySlug(7)).toEqual([]);
    expect(await getRecentEvents(50)).toEqual([]);
    expect(await getTopEvents(10, 7)).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("getEventTotalsBySlug aggregates by slug", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        results: [
          { event: "app_opened", timestamp: "t1", distinct_id: "u1", properties: { slug: "leads" } },
          { event: "app_opened", timestamp: "t2", distinct_id: "u2", properties: { slug: "leads" } },
          { event: "app_opened", timestamp: "t3", distinct_id: "u3", properties: { slug: "agents" } },
          { event: "login", timestamp: "t4", distinct_id: "u4" },
        ],
      }),
    });

    const totals = await getEventTotalsBySlug(7);
    expect(totals).toEqual([
      { slug: "leads", count: 2 },
      { slug: "agents", count: 1 },
      { slug: "(none)", count: 1 },
    ]);

    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toContain("/api/projects/1234/events/");
    expect(String(url)).toContain("after=");
    expect((init as RequestInit).headers).toEqual({
      Authorization: "Bearer phx_test",
    });
  });

  it("getRecentEvents hashes distinct_id and preserves order", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        results: [
          {
            event: "login",
            timestamp: "2026-04-29T00:00:00Z",
            distinct_id: "auth0|abc",
            properties: { method: "email" },
          },
          {
            event: "app_opened",
            timestamp: "2026-04-29T00:01:00Z",
            distinct_id: "auth0|xyz",
            properties: { slug: "leads" },
          },
        ],
      }),
    });

    const events = await getRecentEvents(50);
    expect(events).toHaveLength(2);
    expect(events[0]).toMatchObject({
      event: "login",
      timestamp: "2026-04-29T00:00:00Z",
      slug: null,
    });
    expect(events[0].userIdHash).toMatch(/^[a-f0-9]{64}$/);
    expect(events[1].slug).toBe("leads");
  });

  it("getTopEvents returns top N sorted desc and respects limit", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        results: [
          { event: "a", timestamp: "t", distinct_id: "x" },
          { event: "a", timestamp: "t", distinct_id: "x" },
          { event: "a", timestamp: "t", distinct_id: "x" },
          { event: "b", timestamp: "t", distinct_id: "x" },
          { event: "b", timestamp: "t", distinct_id: "x" },
          { event: "c", timestamp: "t", distinct_id: "x" },
        ],
      }),
    });

    const top = await getTopEvents(2, 7);
    expect(top).toEqual([
      { event: "a", count: 3 },
      { event: "b", count: 2 },
    ]);
  });

  it("throws when PostHog returns a non-ok response", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({}),
    });

    await expect(getEventTotalsBySlug(7)).rejects.toThrow("PostHog API error");
  });
});
