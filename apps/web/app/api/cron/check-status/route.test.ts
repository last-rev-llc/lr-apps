import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockEvaluateAndAlert = vi.fn();
const mockGetSettings = vi.fn();
vi.mock("./alerting", async () => {
  const actual = await vi.importActual<typeof import("./alerting")>("./alerting");
  return {
    ...actual,
    evaluateAndAlert: (...args: unknown[]) => mockEvaluateAndAlert(...args),
    getAlertSettingsForUser: (...args: unknown[]) => mockGetSettings(...args),
  };
});

let clientSiteUserIds: Array<{ user_id: string | null }> = [];
let usersById: Record<string, { id: string; email: string | null }> = {};
let sitesByUser: Record<string, Array<{
  client_id: string;
  client_name: string | null;
  url: string;
  status: string | null;
  score: number | null;
  prev_score: number | null;
  ssl_expiry: string | null;
}>> = {};

function makeQuery<T>(rows: T[]) {
  const builder: Record<string, unknown> = {
    eq: (col: string, val: unknown) => {
      rows = rows.filter((r) => (r as Record<string, unknown>)[col] === val);
      return builder;
    },
    is: (col: string, val: unknown) => {
      rows = rows.filter((r) => (r as Record<string, unknown>)[col] === val);
      return builder;
    },
    not: () => builder,
    limit: () => builder,
    maybeSingle: () => Promise.resolve({ data: rows[0] ?? null, error: null }),
    then: (resolve: (v: { data: T[]; error: null }) => unknown) =>
      resolve({ data: rows, error: null }),
  };
  return builder;
}

vi.mock("@repo/db/service-role", () => ({
  createServiceRoleClient: () => ({
    from: vi.fn((table: string) => {
      if (table === "client_sites") {
        return {
          select: () => makeQuery(clientSiteUserIds),
        };
      }
      if (table === "users") {
        return {
          select: () => makeQuery(Object.values(usersById)),
        };
      }
      if (table === "sites") {
        return {
          select: () => {
            const allRows: Array<Record<string, unknown>> = [];
            for (const [user_id, rows] of Object.entries(sitesByUser)) {
              for (const r of rows) allRows.push({ ...r, user_id });
            }
            return makeQuery(allRows);
          },
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    }),
  }),
}));

const mockIsAuthorized = vi.fn();
vi.mock("@/lib/cron-auth", () => ({
  isAuthorizedCronRequest: (...args: unknown[]) => mockIsAuthorized(...args),
}));

import { GET, buildCandidates } from "./route";

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  vi.clearAllMocks();
  process.env = { ...ORIGINAL_ENV };
  clientSiteUserIds = [];
  usersById = {};
  sitesByUser = {};
  mockEvaluateAndAlert.mockResolvedValue([]);
  mockGetSettings.mockResolvedValue({
    emailEnabled: true,
    alertEmail: null,
    sslWarnDays: 14,
    healthDropThreshold: 20,
  });
});
afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

function makeRequest(): Request {
  return new Request("http://localhost/api/cron/check-status");
}

describe("GET /api/cron/check-status", () => {
  it("returns 401 when authorization fails", async () => {
    mockIsAuthorized.mockReturnValue(false);
    const res = await GET(makeRequest());
    expect(res.status).toBe(401);
    expect(mockEvaluateAndAlert).not.toHaveBeenCalled();
  });

  it("iterates each distinct user and calls evaluateAndAlert per user", async () => {
    mockIsAuthorized.mockReturnValue(true);
    clientSiteUserIds = [{ user_id: "u1" }, { user_id: "u2" }, { user_id: "u1" }];
    usersById = {
      u1: { id: "u1", email: "u1@example.com" },
      u2: { id: "u2", email: "u2@example.com" },
    };
    sitesByUser = {
      u1: [
        {
          client_id: "c1",
          client_name: "Acme",
          url: "https://acme.example",
          status: "down",
          score: null,
          prev_score: null,
          ssl_expiry: null,
        },
      ],
      u2: [
        {
          client_id: "c2",
          client_name: "Beta",
          url: "https://beta.example",
          status: "up",
          score: null,
          prev_score: null,
          ssl_expiry: null,
        },
      ],
    };

    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.users).toBe(2);

    // u1 has a down site → candidate created. u2 has nothing → no candidates.
    const callsForU1 = mockEvaluateAndAlert.mock.calls.filter(
      (c) => c[0].userId === "u1",
    );
    expect(callsForU1).toHaveLength(1);
    expect(callsForU1[0][0].candidates).toHaveLength(1);
    expect(callsForU1[0][0].candidates[0].type).toBe("status-down");
    expect(callsForU1[0][0].userEmail).toBe("u1@example.com");
  });

  it("uses default settings when getAlertSettingsForUser rejects", async () => {
    mockIsAuthorized.mockReturnValue(true);
    mockGetSettings.mockRejectedValue(new Error("oops"));
    clientSiteUserIds = [{ user_id: "u1" }];
    usersById = { u1: { id: "u1", email: "u1@example.com" } };
    sitesByUser = {
      u1: [
        {
          client_id: "c1",
          client_name: "Acme",
          url: "https://acme.example",
          status: "down",
          score: null,
          prev_score: null,
          ssl_expiry: null,
        },
      ],
    };

    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
    const call = mockEvaluateAndAlert.mock.calls[0]?.[0];
    expect(call.settings).toEqual({
      emailEnabled: true,
      alertEmail: null,
      sslWarnDays: 14,
      healthDropThreshold: 20,
    });
  });
});

describe("buildCandidates", () => {
  const settings = { sslWarnDays: 14, healthDropThreshold: 20 };

  it("emits status-down when any site for the client is down", () => {
    const candidates = buildCandidates(
      [
        {
          client_id: "c1",
          client_name: "Acme",
          url: "https://acme.example/a",
          status: "down",
          score: null,
          prev_score: null,
          ssl_expiry: null,
        },
        {
          client_id: "c1",
          client_name: "Acme",
          url: "https://acme.example/b",
          status: "up",
          score: null,
          prev_score: null,
          ssl_expiry: null,
        },
      ],
      settings,
    );
    expect(candidates).toHaveLength(1);
    expect(candidates[0]!.type).toBe("status-down");
  });

  it("emits ssl-expired when ssl_expiry is in the past", () => {
    const candidates = buildCandidates(
      [
        {
          client_id: "c1",
          client_name: "Acme",
          url: "https://acme.example",
          status: "up",
          score: null,
          prev_score: null,
          ssl_expiry: "2020-01-01T00:00:00.000Z",
        },
      ],
      settings,
    );
    expect(candidates.map((c) => c.type)).toContain("ssl-expired");
  });

  it("emits ssl-expiring within the configured warn window", () => {
    const inFiveDays = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString();
    const candidates = buildCandidates(
      [
        {
          client_id: "c1",
          client_name: "Acme",
          url: "https://acme.example",
          status: "up",
          score: null,
          prev_score: null,
          ssl_expiry: inFiveDays,
        },
      ],
      settings,
    );
    expect(candidates.map((c) => c.type)).toContain("ssl-expiring");
  });

  it("emits score-drop when score falls more than the threshold", () => {
    const candidates = buildCandidates(
      [
        {
          client_id: "c1",
          client_name: "Acme",
          url: "https://acme.example",
          status: "up",
          score: 50,
          prev_score: 90,
          ssl_expiry: null,
        },
      ],
      settings,
    );
    expect(candidates.map((c) => c.type)).toContain("score-drop");
    const drop = candidates.find((c) => c.type === "score-drop")!;
    expect(drop.scoreDelta).toBe(-40);
  });

  it("does not emit score-drop when below the threshold", () => {
    const candidates = buildCandidates(
      [
        {
          client_id: "c1",
          client_name: "Acme",
          url: "https://acme.example",
          status: "up",
          score: 80,
          prev_score: 90,
          ssl_expiry: null,
        },
      ],
      settings,
    );
    expect(candidates.map((c) => c.type)).not.toContain("score-drop");
  });
});
