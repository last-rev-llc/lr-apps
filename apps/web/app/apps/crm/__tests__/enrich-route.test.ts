import { describe, it, expect, vi, beforeEach } from "vitest";

const TEST_USER_ID = "11111111-1111-4111-8111-111111111111";
const VALID_CONTACT_ID = "22222222-2222-4222-8222-222222222222";

const requireAccessMock = vi.fn();
vi.mock("@repo/auth/server", () => ({
  requireAccess: (...args: unknown[]) => requireAccessMock(...args),
}));

const updateChain = {
  eq: vi.fn(),
};
const fromMock = vi.fn();
vi.mock("@repo/db/server", () => ({
  createClient: vi.fn(async () => ({ from: fromMock })),
}));

const enrichContactMock = vi.fn();
vi.mock("../lib/enrich", () => ({
  enrichContact: (...args: unknown[]) => enrichContactMock(...args),
}));

const getContactByIdMock = vi.fn();
vi.mock("../lib/queries", () => ({
  getContactById: (...args: unknown[]) => getContactByIdMock(...args),
}));

const logMocks = vi.hoisted(() => ({
  warn: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  debug: vi.fn(),
}));
vi.mock("@repo/logger", () => ({ log: logMocks }));

import { POST } from "../api/enrich/route";
import { _resetRateLimitStore } from "@/lib/rate-limit";

const fakeInsights = {
  confidence: "high",
  summary: "x",
  bestApproach: "y",
  communicationStyle: {
    formality: null,
    tone: null,
    responseSpeed: null,
    preferredChannel: null,
  },
  personality: {
    decisionStyle: null,
    detailOrientation: null,
    conflictStyle: null,
    motivators: [],
    stressors: [],
  },
  interests: { professional: [], personal: [], sharedWithAdam: [] },
  conversationStarters: [],
  topicsToAvoid: [],
};

function buildReq(body: unknown): Request {
  return new Request("http://localhost/apps/crm/api/enrich", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  _resetRateLimitStore();
  requireAccessMock.mockResolvedValue({
    user: { id: TEST_USER_ID, email: "u@example.com" },
    permission: "admin",
  });
  getContactByIdMock.mockResolvedValue({ id: VALID_CONTACT_ID, name: "Adam" });
  enrichContactMock.mockResolvedValue(fakeInsights);
  updateChain.eq = vi.fn().mockResolvedValue({ error: null });
  fromMock.mockReturnValue({
    update: vi.fn().mockReturnValue(updateChain),
  });
});

describe("POST /apps/crm/api/enrich", () => {
  it("returns 200 with insights and last_researched_at on success", async () => {
    const res = await POST(buildReq({ contactId: VALID_CONTACT_ID }) as never);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.insights).toEqual(fakeInsights);
    expect(typeof json.last_researched_at).toBe("string");
    expect(requireAccessMock).toHaveBeenCalledWith("crm", "admin");
    expect(enrichContactMock).toHaveBeenCalledWith(
      expect.objectContaining({ id: VALID_CONTACT_ID }),
    );
  });

  it("persists insights and last_researched_at via supabase", async () => {
    const updateSpy = vi.fn().mockReturnValue(updateChain);
    fromMock.mockReturnValue({ update: updateSpy });
    await POST(buildReq({ contactId: VALID_CONTACT_ID }) as never);
    expect(fromMock).toHaveBeenCalledWith("contacts");
    expect(updateSpy).toHaveBeenCalled();
    const updateArg = updateSpy.mock.calls[0][0];
    expect(updateArg.insights).toEqual(fakeInsights);
    expect(typeof updateArg.last_researched_at).toBe("string");
  });

  it("returns 400 on invalid body (missing contactId)", async () => {
    const res = await POST(buildReq({}) as never);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("invalid_input");
  });

  it("returns 400 when contactId is not a uuid", async () => {
    const res = await POST(buildReq({ contactId: "not-a-uuid" }) as never);
    expect(res.status).toBe(400);
  });

  it("returns 400 when body is not JSON", async () => {
    const req = new Request("http://localhost/apps/crm/api/enrich", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{not-json",
    });
    const res = await POST(req as never);
    expect(res.status).toBe(400);
  });

  it("returns 404 when the contact is not found", async () => {
    getContactByIdMock.mockResolvedValueOnce(null);
    const res = await POST(buildReq({ contactId: VALID_CONTACT_ID }) as never);
    expect(res.status).toBe(404);
  });

  it("returns 429 with Retry-After once the rate limit is exceeded", async () => {
    for (let i = 0; i < 30; i++) {
      const ok = await POST(buildReq({ contactId: VALID_CONTACT_ID }) as never);
      expect(ok.status).toBe(200);
    }
    const res = await POST(buildReq({ contactId: VALID_CONTACT_ID }) as never);
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBeTruthy();
  });

  it("returns 500 when the db update fails", async () => {
    fromMock.mockReturnValueOnce({
      update: () => ({
        eq: vi.fn().mockResolvedValue({ error: { message: "boom" } }),
      }),
    });
    const res = await POST(buildReq({ contactId: VALID_CONTACT_ID }) as never);
    expect(res.status).toBe(500);
    expect(logMocks.error).toHaveBeenCalled();
  });

  it("returns 500 when enrichContact throws", async () => {
    enrichContactMock.mockRejectedValueOnce(new Error("ai down"));
    const res = await POST(buildReq({ contactId: VALID_CONTACT_ID }) as never);
    expect(res.status).toBe(500);
    expect(logMocks.error).toHaveBeenCalled();
  });
});
