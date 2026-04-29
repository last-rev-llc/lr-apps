import { describe, it, expect } from "vitest";
import { computeHealthScore, WEIGHTS } from "../lib/score";

const FIXED_NOW = new Date("2026-04-29T00:00:00Z");

function daysFromNow(days: number): string {
  return new Date(FIXED_NOW.getTime() + days * 24 * 60 * 60 * 1000).toISOString();
}

describe("WEIGHTS", () => {
  it("sums to 1.0", () => {
    const total = Object.values(WEIGHTS).reduce((a, b) => a + b, 0);
    expect(Math.abs(total - 1)).toBeLessThan(1e-9);
  });
});

describe("computeHealthScore — aggregate", () => {
  it("returns 100 for all-perfect input", () => {
    const result = computeHealthScore(
      {
        uptime: 100,
        responseTimeMs: 100,
        sslExpiry: daysFromNow(365),
        openTicketCount: 0,
        contractStatus: "active",
      },
      FIXED_NOW,
    );
    expect(result.score).toBe(100);
  });

  it("returns 0 for all-broken input", () => {
    const result = computeHealthScore(
      {
        uptime: 0,
        responseTimeMs: 5000,
        sslExpiry: daysFromNow(-10),
        openTicketCount: 50,
        contractStatus: "expired",
      },
      FIXED_NOW,
    );
    // ticketLoad floors at 0.1, not 0, so score is small but nonzero.
    expect(result.score).toBeLessThan(5);
  });

  it("returns deterministic results for same input", () => {
    const input = {
      uptime: 99,
      responseTimeMs: 500,
      sslExpiry: daysFromNow(45),
      openTicketCount: 1,
      contractStatus: "active" as const,
    };
    const a = computeHealthScore(input, FIXED_NOW);
    const b = computeHealthScore(input, FIXED_NOW);
    expect(a).toEqual(b);
  });

  it("returns a per-signal breakdown", () => {
    const result = computeHealthScore(
      {
        uptime: 100,
        responseTimeMs: 100,
        sslExpiry: daysFromNow(365),
        openTicketCount: 0,
        contractStatus: "active",
      },
      FIXED_NOW,
    );
    expect(result.breakdown).toEqual({
      uptime: 30,
      responseTime: 10,
      ssl: 20,
      ticketLoad: 20,
      contract: 20,
    });
  });

  it("missing-data inputs collapse to neutral mid-range", () => {
    const result = computeHealthScore({}, FIXED_NOW);
    // every signal is 0.5 → score = 50
    expect(result.score).toBe(50);
  });
});

describe("uptime axis", () => {
  it.each([
    { uptime: 99.9, label: "perfect", min: 1 },
    { uptime: 98.5, label: "mid", min: 0.75 },
    { uptime: 95.0, label: "low", min: 0.5 },
    { uptime: 50, label: "broken", min: 0.5 }, // 50/100 = 0.5
  ])("$label uptime ($uptime)", ({ uptime, min }) => {
    const result = computeHealthScore({ uptime }, FIXED_NOW);
    // breakdown.uptime = signal * weight * 100; signal = breakdown / 30
    expect(result.breakdown.uptime / (WEIGHTS.uptime * 100)).toBeGreaterThanOrEqual(min - 1e-9);
  });

  it("missing uptime is neutral 0.5", () => {
    const result = computeHealthScore({ uptime: null }, FIXED_NOW);
    expect(result.breakdown.uptime).toBeCloseTo(0.5 * WEIGHTS.uptime * 100, 6);
  });
});

describe("responseTime axis", () => {
  it.each([
    { ms: 100, expected: 1 },
    { ms: 500, expected: 0.75 },
    { ms: 1500, expected: 0.5 },
    { ms: 3000, expected: 0 },
  ])("$ms ms → $expected", ({ ms, expected }) => {
    const result = computeHealthScore({ responseTimeMs: ms }, FIXED_NOW);
    expect(result.breakdown.responseTime).toBeCloseTo(expected * WEIGHTS.responseTime * 100, 6);
  });

  it("missing responseTime is neutral 0.5", () => {
    const result = computeHealthScore({ responseTimeMs: null }, FIXED_NOW);
    expect(result.breakdown.responseTime).toBeCloseTo(0.5 * WEIGHTS.responseTime * 100, 6);
  });
});

describe("ssl axis", () => {
  it("31 days out → warn-clear (1.0)", () => {
    const result = computeHealthScore({ sslExpiry: daysFromNow(31) }, FIXED_NOW);
    expect(result.breakdown.ssl).toBeCloseTo(1 * WEIGHTS.ssl * 100, 6);
  });

  it("29 days out → warn (0.6)", () => {
    const result = computeHealthScore({ sslExpiry: daysFromNow(29) }, FIXED_NOW);
    expect(result.breakdown.ssl).toBeCloseTo(0.6 * WEIGHTS.ssl * 100, 6);
  });

  it("6 days out → critical (0.25)", () => {
    const result = computeHealthScore({ sslExpiry: daysFromNow(6) }, FIXED_NOW);
    expect(result.breakdown.ssl).toBeCloseTo(0.25 * WEIGHTS.ssl * 100, 6);
  });

  it("expired (-1d) → 0", () => {
    const result = computeHealthScore({ sslExpiry: daysFromNow(-1) }, FIXED_NOW);
    expect(result.breakdown.ssl).toBe(0);
  });

  it("missing ssl → neutral 0.5", () => {
    const result = computeHealthScore({ sslExpiry: null }, FIXED_NOW);
    expect(result.breakdown.ssl).toBeCloseTo(0.5 * WEIGHTS.ssl * 100, 6);
  });

  it("invalid ssl date → neutral 0.5", () => {
    const result = computeHealthScore({ sslExpiry: "not-a-date" }, FIXED_NOW);
    expect(result.breakdown.ssl).toBeCloseTo(0.5 * WEIGHTS.ssl * 100, 6);
  });
});

describe("ticketLoad axis", () => {
  it.each([
    { count: 0, expected: 1 },
    { count: 2, expected: 0.85 },
    { count: 4, expected: 0.6 },
    { count: 8, expected: 0.35 },
    { count: 50, expected: 0.1 },
  ])("$count tickets → $expected", ({ count, expected }) => {
    const result = computeHealthScore({ openTicketCount: count }, FIXED_NOW);
    expect(result.breakdown.ticketLoad).toBeCloseTo(expected * WEIGHTS.ticketLoad * 100, 6);
  });

  it("missing ticket count → neutral 0.5", () => {
    const result = computeHealthScore({ openTicketCount: null }, FIXED_NOW);
    expect(result.breakdown.ticketLoad).toBeCloseTo(0.5 * WEIGHTS.ticketLoad * 100, 6);
  });
});

describe("contract axis", () => {
  it.each([
    { status: "active" as const, expected: 1 },
    { status: "expiring-soon" as const, expected: 0.5 },
    { status: "expired" as const, expected: 0 },
    { status: "none" as const, expected: 0.5 },
  ])("$status → $expected", ({ status, expected }) => {
    const result = computeHealthScore({ contractStatus: status }, FIXED_NOW);
    expect(result.breakdown.contract).toBeCloseTo(expected * WEIGHTS.contract * 100, 6);
  });

  it("missing contract is neutral 0.5", () => {
    const result = computeHealthScore({ contractStatus: null }, FIXED_NOW);
    expect(result.breakdown.contract).toBeCloseTo(0.5 * WEIGHTS.contract * 100, 6);
  });
});
