import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// In-memory sites table — overridden per test
let sitesRows: Array<{ url: string }> = [];
const upsertCalls: Array<{
  url: string;
  payload: Record<string, unknown>;
}> = [];

function makeFromMock() {
  return (table: string) => {
    if (table === "client_sites") {
      return {
        select: vi.fn().mockResolvedValue({ data: sitesRows, error: null }),
      };
    }
    if (table === "site_metadata") {
      return {
        upsert: vi.fn(async (payload: Record<string, unknown>) => {
          upsertCalls.push({
            url: payload.url as string,
            payload,
          });
          return { error: null };
        }),
      };
    }
    throw new Error(`Unexpected table: ${table}`);
  };
}

vi.mock("@repo/db/service-role", () => ({
  createServiceRoleClient: () => ({ from: makeFromMock() }),
}));

const mockIsAuthorized = vi.fn();
vi.mock("@/lib/cron-auth", () => ({
  isAuthorizedCronRequest: (...args: unknown[]) => mockIsAuthorized(...args),
}));

// Mock the shared SSL check helper so the route test exercises orchestration
// logic without opening real sockets. The TLS code itself is exercised via
// the check-url unit tests.
type CertResult = { validTo: string; issuer: string | null } | { error: string };
const certMockMap = new Map<string, CertResult>();

vi.mock("./check-url", () => ({
  checkSslForUrl: vi.fn(async (url: string, db: { from: (t: string) => unknown }) => {
    const result = certMockMap.get(url);
    const checkedAt = new Date().toISOString();
    if (!result) {
      throw new Error(`no mock for ${url}`);
    }
    const table = db.from("site_metadata") as {
      upsert: (payload: Record<string, unknown>) => Promise<{ error: null }>;
    };
    if ("error" in result) {
      await table.upsert({ url, sslLastChecked: checkedAt, sslLastError: result.error });
      return { url, ok: false as const, error: result.error };
    }
    await table.upsert({
      url,
      sslExpiry: result.validTo,
      sslIssuer: result.issuer,
      sslLastChecked: checkedAt,
      sslLastError: null,
    });
    return { url, ok: true as const, sslExpiry: result.validTo, sslIssuer: result.issuer };
  }),
}));

import { GET } from "./route";

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  vi.clearAllMocks();
  process.env = { ...ORIGINAL_ENV };
  sitesRows = [];
  upsertCalls.length = 0;
  certMockMap.clear();
});
afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

function makeRequest(): Request {
  return new Request("http://localhost/api/cron/check-ssl");
}

describe("GET /api/cron/check-ssl", () => {
  it("returns 401 when authorization fails", async () => {
    mockIsAuthorized.mockReturnValue(false);
    const res = await GET(makeRequest());
    expect(res.status).toBe(401);
    expect(upsertCalls).toHaveLength(0);
  });

  it("upserts sslExpiry + sslIssuer on a successful cert read", async () => {
    mockIsAuthorized.mockReturnValue(true);
    sitesRows = [{ url: "https://valid.example.com" }];
    certMockMap.set("https://valid.example.com", {
      validTo: "2027-01-15T00:00:00.000Z",
      issuer: "Let's Encrypt",
    });

    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ checked: 1, ok: 1, failed: 0 });

    expect(upsertCalls).toHaveLength(1);
    const call = upsertCalls[0]!;
    expect(call.payload).toMatchObject({
      url: "https://valid.example.com",
      sslExpiry: "2027-01-15T00:00:00.000Z",
      sslIssuer: "Let's Encrypt",
      sslLastError: null,
    });
    expect(call.payload.sslLastChecked).toBeTruthy();
  });

  it("records sslLastError without sslExpiry on handshake failure", async () => {
    mockIsAuthorized.mockReturnValue(true);
    sitesRows = [{ url: "https://broken.example.com" }];
    certMockMap.set("https://broken.example.com", { error: "ECONNREFUSED" });

    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ checked: 1, ok: 0, failed: 1 });

    expect(upsertCalls).toHaveLength(1);
    const call = upsertCalls[0]!;
    // Failure path must NOT clobber prior sslExpiry/sslIssuer values.
    expect(call.payload).not.toHaveProperty("sslExpiry");
    expect(call.payload).not.toHaveProperty("sslIssuer");
    expect(call.payload.sslLastError).toBe("ECONNREFUSED");
    expect(call.payload.sslLastChecked).toBeTruthy();
  });

  it("still records expired certs (notAfter in the past)", async () => {
    mockIsAuthorized.mockReturnValue(true);
    sitesRows = [{ url: "https://expired.example.com" }];
    certMockMap.set("https://expired.example.com", {
      validTo: "2020-01-01T00:00:00.000Z",
      issuer: "DigiCert",
    });

    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(1);

    const call = upsertCalls[0]!;
    expect(call.payload.sslExpiry).toBe("2020-01-01T00:00:00.000Z");
    expect(call.payload.sslIssuer).toBe("DigiCert");
    expect(call.payload.sslLastError).toBeNull();
  });

  it("dedupes URLs that appear multiple times in client_sites", async () => {
    mockIsAuthorized.mockReturnValue(true);
    sitesRows = [
      { url: "https://shared.example.com" },
      { url: "https://shared.example.com" },
      { url: "https://shared.example.com" },
    ];
    certMockMap.set("https://shared.example.com", {
      validTo: "2027-01-01T00:00:00.000Z",
      issuer: "X",
    });

    const res = await GET(makeRequest());
    const body = await res.json();
    expect(body.checked).toBe(1);
    expect(upsertCalls).toHaveLength(1);
  });

  it("processes multiple distinct URLs with mixed outcomes", async () => {
    mockIsAuthorized.mockReturnValue(true);
    sitesRows = [
      { url: "https://a.example.com" },
      { url: "https://b.example.com" },
      { url: "https://c.example.com" },
    ];
    certMockMap.set("https://a.example.com", {
      validTo: "2027-06-01T00:00:00.000Z",
      issuer: "A-CA",
    });
    certMockMap.set("https://b.example.com", { error: "tls handshake timeout" });
    certMockMap.set("https://c.example.com", {
      validTo: "2027-12-01T00:00:00.000Z",
      issuer: "C-CA",
    });

    const res = await GET(makeRequest());
    const body = await res.json();
    expect(body).toEqual({ checked: 3, ok: 2, failed: 1 });
    expect(upsertCalls).toHaveLength(3);
  });
});
