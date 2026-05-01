import { describe, it, expect, vi, beforeEach } from "vitest";
import { InsightsSchema } from "../lib/schemas";

const TEST_USER_ID = "11111111-1111-4111-8111-111111111111";
const VALID_CONTACT_ID = "22222222-2222-4222-8222-222222222222";

const insightsFixture = {
  confidence: "high" as const,
  summary: "VP Engineering at Acme; data-driven decision-maker.",
  bestApproach: "Lead with concrete platform examples and metrics.",
  communicationStyle: {
    formality: "professional",
    tone: "warm",
    responseSpeed: "within 24h",
    preferredChannel: "email",
  },
  personality: {
    decisionStyle: "data-driven",
    detailOrientation: "high",
    conflictStyle: "direct",
    motivators: ["impact"],
    stressors: [],
  },
  interests: {
    professional: ["design systems"],
    personal: [],
    sharedWithAdam: ["consultancy"],
  },
  conversationStarters: ["How is the platform team structured?"],
  topicsToAvoid: [],
};

const generateObjectMock = vi.fn();
vi.mock("ai", () => ({
  generateObject: (...args: unknown[]) => generateObjectMock(...args),
}));

const anthropicMock = vi.fn((id: string) => ({ provider: "anthropic", id }));
vi.mock("@ai-sdk/anthropic", () => ({
  anthropic: (id: string) => anthropicMock(id),
}));

const requireAccessMock = vi.fn();
vi.mock("@repo/auth/server", () => ({
  requireAccess: (...args: unknown[]) => requireAccessMock(...args),
}));

const updateEqMock = vi.fn();
const updateMock: ReturnType<
  typeof vi.fn<(arg: Record<string, unknown>) => { eq: typeof updateEqMock }>
> = vi.fn((_arg: Record<string, unknown>) => ({ eq: updateEqMock }));
const fromMock = vi.fn(() => ({ update: updateMock }));
vi.mock("@repo/db/server", () => ({
  createClient: vi.fn(async () => ({ from: fromMock })),
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

function buildReq(body: unknown): Request {
  return new Request("http://localhost/apps/crm/api/enrich", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

function makeNextRedirectError(target: string): Error {
  const err = new Error("NEXT_REDIRECT");
  (err as unknown as { digest: string }).digest = `NEXT_REDIRECT;replace;${target};307;`;
  return err;
}

beforeEach(() => {
  vi.clearAllMocks();
  _resetRateLimitStore();
  requireAccessMock.mockResolvedValue({
    user: { id: TEST_USER_ID, email: "u@example.com" },
    permission: "admin",
  });
  getContactByIdMock.mockResolvedValue({
    id: VALID_CONTACT_ID,
    name: "Jane Doe",
    title: "VP Engineering",
    company: "Acme",
  });
  generateObjectMock.mockResolvedValue({ object: insightsFixture });
  updateEqMock.mockResolvedValue({ error: null });
  fromMock.mockReturnValue({ update: updateMock });
});

describe("POST /apps/crm/api/enrich (route handler)", () => {
  describe("happy path", () => {
    it("returns 200 with insights and last_researched_at", async () => {
      const res = await POST(
        buildReq({ contactId: VALID_CONTACT_ID }) as never,
      );
      expect(res.status).toBe(200);
      const json = (await res.json()) as {
        insights: unknown;
        last_researched_at: string;
      };
      expect(json.insights).toEqual(insightsFixture);
      expect(typeof json.last_researched_at).toBe("string");
      // Confirm the AI fixture matches the InsightsSchema
      expect(InsightsSchema.safeParse(json.insights).success).toBe(true);
    });

    it("invokes the mocked Anthropic model and generateObject — no real network", async () => {
      await POST(buildReq({ contactId: VALID_CONTACT_ID }) as never);
      expect(anthropicMock).toHaveBeenCalledWith("claude-sonnet-4-6");
      expect(generateObjectMock).toHaveBeenCalledTimes(1);
      const arg = generateObjectMock.mock.calls[0]?.[0] as {
        schema: unknown;
        prompt: string;
        system: string;
      };
      expect(arg.schema).toBe(InsightsSchema);
      expect(arg.prompt).toContain("Jane Doe");
    });

    it("persists insights and last_researched_at to supabase contacts row", async () => {
      await POST(buildReq({ contactId: VALID_CONTACT_ID }) as never);
      expect(fromMock).toHaveBeenCalledWith("contacts");
      const updateArg = updateMock.mock.calls[0]?.[0] as {
        insights: unknown;
        last_researched_at: string;
      };
      expect(updateArg.insights).toEqual(insightsFixture);
      expect(typeof updateArg.last_researched_at).toBe("string");
      expect(updateEqMock).toHaveBeenCalledWith("id", VALID_CONTACT_ID);
    });

    it("requires the crm:admin permission", async () => {
      await POST(buildReq({ contactId: VALID_CONTACT_ID }) as never);
      expect(requireAccessMock).toHaveBeenCalledWith("crm", "admin");
    });
  });

  describe("auth gating", () => {
    it("propagates the redirect (401-equivalent) when unauthenticated", async () => {
      requireAccessMock.mockRejectedValueOnce(
        makeNextRedirectError("/login?redirect=crm"),
      );
      await expect(
        POST(buildReq({ contactId: VALID_CONTACT_ID }) as never),
      ).rejects.toMatchObject({
        message: "NEXT_REDIRECT",
      });
      expect(generateObjectMock).not.toHaveBeenCalled();
    });

    it("propagates the redirect (403-equivalent) when missing crm:admin", async () => {
      requireAccessMock.mockRejectedValueOnce(
        makeNextRedirectError("/unauthorized?app=crm"),
      );
      await expect(
        POST(buildReq({ contactId: VALID_CONTACT_ID }) as never),
      ).rejects.toMatchObject({
        message: "NEXT_REDIRECT",
      });
      expect(generateObjectMock).not.toHaveBeenCalled();
    });
  });

  describe("input validation", () => {
    it("returns 400 when contactId is missing", async () => {
      const res = await POST(buildReq({}) as never);
      expect(res.status).toBe(400);
      const json = (await res.json()) as { error: string };
      expect(json.error).toBe("invalid_input");
    });

    it("returns 400 when contactId is not a uuid", async () => {
      const res = await POST(
        buildReq({ contactId: "not-a-uuid" }) as never,
      );
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
  });

  describe("missing contact", () => {
    it("returns 404 when getContactById returns null", async () => {
      getContactByIdMock.mockResolvedValueOnce(null);
      const res = await POST(
        buildReq({ contactId: VALID_CONTACT_ID }) as never,
      );
      expect(res.status).toBe(404);
      const json = (await res.json()) as { error: string };
      expect(json.error).toBe("not_found");
      expect(generateObjectMock).not.toHaveBeenCalled();
    });
  });

  describe("rate limiting", () => {
    it("returns 429 with Retry-After once the per-user limit is exceeded", async () => {
      for (let i = 0; i < 30; i++) {
        const ok = await POST(
          buildReq({ contactId: VALID_CONTACT_ID }) as never,
        );
        expect(ok.status).toBe(200);
      }
      const res = await POST(
        buildReq({ contactId: VALID_CONTACT_ID }) as never,
      );
      expect(res.status).toBe(429);
      expect(res.headers.get("Retry-After")).toBeTruthy();
      const json = (await res.json()) as { error: string };
      expect(json.error).toBe("rate_limited");
    });
  });

  describe("persistence failure", () => {
    it("returns 500 when the supabase update errors", async () => {
      updateEqMock.mockResolvedValueOnce({ error: { message: "boom" } });
      const res = await POST(
        buildReq({ contactId: VALID_CONTACT_ID }) as never,
      );
      expect(res.status).toBe(500);
      expect(logMocks.error).toHaveBeenCalled();
    });
  });
});
