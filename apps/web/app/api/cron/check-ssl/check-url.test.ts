import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EventEmitter } from "node:events";

const logWarnMock = vi.fn();
const logErrorMock = vi.fn();
vi.mock("@repo/logger", () => ({
  log: {
    warn: (...args: unknown[]) => logWarnMock(...args),
    error: (...args: unknown[]) => logErrorMock(...args),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

// Build a mock TLS socket that fires `secureConnect` synchronously after the
// connect callback runs. Tests control its peer-cert via the cert argument.
type MockSocket = EventEmitter & {
  end: () => void;
  destroy: (err?: Error) => void;
  getPeerCertificate: () => Record<string, unknown>;
};

type ConnectScenario =
  | {
      type: "ok";
      cert: Record<string, unknown>;
    }
  | {
      type: "error";
      message: string;
    }
  | {
      type: "no-peer-cert";
    };

let scenario: ConnectScenario | null = null;

vi.mock("node:tls", () => ({
  default: {
    connect: vi.fn(
      (
        _opts: Record<string, unknown>,
        onSecureConnect: () => void,
      ): MockSocket => {
        const socket = new EventEmitter() as MockSocket;
        socket.end = vi.fn();
        socket.destroy = vi.fn();
        socket.getPeerCertificate = () => {
          if (scenario?.type === "no-peer-cert") return {};
          if (scenario?.type === "ok") return scenario.cert;
          return {};
        };

        // Fire scenario async to mimic real socket lifecycle
        queueMicrotask(() => {
          if (scenario?.type === "error") {
            socket.emit("error", new Error(scenario.message));
            return;
          }
          onSecureConnect();
        });

        return socket;
      },
    ),
  },
  connect: vi.fn(),
}));

import { readCertificate, checkSslForUrl } from "./check-url";

const upsertCalls: Array<Record<string, unknown>> = [];
function makeDb() {
  return {
    from: vi.fn(() => ({
      upsert: vi.fn(async (payload: Record<string, unknown>) => {
        upsertCalls.push(payload);
        return { error: null };
      }),
    })),
  } as unknown as Parameters<typeof checkSslForUrl>[1];
}

beforeEach(() => {
  scenario = null;
  upsertCalls.length = 0;
  logWarnMock.mockClear();
  logErrorMock.mockClear();
});

afterEach(() => {
  scenario = null;
});

describe("readCertificate", () => {
  it("returns ISO validTo and issuer CN on a valid handshake", async () => {
    scenario = {
      type: "ok",
      cert: {
        valid_to: "Jan 15 12:00:00 2027 GMT",
        issuer: { CN: "Let's Encrypt", O: "ISRG" },
      },
    };
    const result = await readCertificate("https://example.com");
    expect(result.validTo).toBe(new Date("Jan 15 12:00:00 2027 GMT").toISOString());
    expect(result.issuer).toBe("Let's Encrypt");
  });

  it("falls back to issuer.O when issuer.CN is absent", async () => {
    scenario = {
      type: "ok",
      cert: { valid_to: "Jan 1 00:00:00 2030 GMT", issuer: { O: "DigiCert" } },
    };
    const result = await readCertificate("https://example.com");
    expect(result.issuer).toBe("DigiCert");
  });

  it("rejects when the peer certificate is empty", async () => {
    scenario = { type: "no-peer-cert" };
    await expect(readCertificate("https://example.com")).rejects.toThrow(/no peer certificate/);
  });

  it("rejects when the socket emits an error", async () => {
    scenario = { type: "error", message: "ECONNREFUSED" };
    await expect(readCertificate("https://example.com")).rejects.toThrow("ECONNREFUSED");
  });

  it("rejects http and other non-tls protocols", async () => {
    await expect(readCertificate("ftp://example.com")).rejects.toThrow();
  });
});

describe("checkSslForUrl", () => {
  it("upserts sslExpiry + sslIssuer on success and clears sslLastError", async () => {
    scenario = {
      type: "ok",
      cert: {
        valid_to: "Jul 1 00:00:00 2027 GMT",
        issuer: { CN: "Test-CA" },
      },
    };
    const db = makeDb();
    const result = await checkSslForUrl("https://example.com", db);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.sslIssuer).toBe("Test-CA");
    }

    expect(upsertCalls).toHaveLength(1);
    const call = upsertCalls[0]!;
    expect(call).toMatchObject({
      url: "https://example.com",
      sslIssuer: "Test-CA",
      sslLastError: null,
    });
    expect(call.sslExpiry).toBeTruthy();
    expect(call.sslLastChecked).toBeTruthy();
  });

  it("on handshake failure, upserts sslLastError without touching sslExpiry/sslIssuer", async () => {
    scenario = { type: "error", message: "tls handshake timeout" };
    const db = makeDb();
    const result = await checkSslForUrl("https://example.com", db);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("tls handshake timeout");
    }

    expect(upsertCalls).toHaveLength(1);
    const call = upsertCalls[0]!;
    expect(call).not.toHaveProperty("sslExpiry");
    expect(call).not.toHaveProperty("sslIssuer");
    expect(call.sslLastError).toBe("tls handshake timeout");
  });

  it("issue #286: handshake failure logs warn (not error) and does NOT page", async () => {
    scenario = { type: "error", message: "tls handshake timeout" };
    const db = makeDb();
    await checkSslForUrl("https://broken.example.com", db);

    // Must use warn for handshake failures so on-call isn't woken up.
    expect(logWarnMock).toHaveBeenCalledWith(
      "ssl check failed",
      expect.objectContaining({ url: "https://broken.example.com" }),
    );
    // The only allowed log.error path is a DB upsert failure, which the
    // mock returns ok for in this test.
    expect(logErrorMock).not.toHaveBeenCalled();
  });

  it("issue #286: consecutive handshake failures do not clobber prior sslExpiry/sslIssuer", async () => {
    scenario = { type: "error", message: "ECONNREFUSED" };
    const db = makeDb();
    await checkSslForUrl("https://example.com", db);
    await checkSslForUrl("https://example.com", db);

    // Two upsert calls, neither sends sslExpiry/sslIssuer (so existing
    // values are preserved by the partial-column upsert).
    expect(upsertCalls).toHaveLength(2);
    for (const call of upsertCalls) {
      expect(call).not.toHaveProperty("sslExpiry");
      expect(call).not.toHaveProperty("sslIssuer");
      expect(call.sslLastError).toBe("ECONNREFUSED");
    }
  });

  it("records an expired cert without rejecting (notAfter in the past)", async () => {
    scenario = {
      type: "ok",
      cert: {
        valid_to: "Jan 1 00:00:00 2020 GMT",
        issuer: { CN: "Old-CA" },
      },
    };
    const db = makeDb();
    const result = await checkSslForUrl("https://example.com", db);
    expect(result.ok).toBe(true);
    expect(upsertCalls[0]!.sslExpiry).toBe(new Date("Jan 1 00:00:00 2020 GMT").toISOString());
  });
});
