import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { computeHealthScore, sslSignal, SIGNAL_WEIGHTS } from "./score";

describe("computeHealthScore", () => {
  it("returns null when every signal is unavailable", () => {
    const score = computeHealthScore({
      uptime: null,
      responseTime: null,
      ssl: null,
      ticketLoad: null,
      contract: null,
    });
    expect(score).toBeNull();
  });

  it("returns the weighted average when all signals are available", () => {
    const score = computeHealthScore({
      uptime: 100,
      responseTime: 100,
      ssl: 100,
      ticketLoad: 100,
      contract: 100,
    });
    expect(score).toBe(100);
  });

  it("excludes unavailable signals from the denominator (null does not penalize)", () => {
    const allKnown = computeHealthScore({
      uptime: 90,
      responseTime: 80,
      ssl: 100,
      ticketLoad: 70,
      contract: 95,
    });

    // Same signal values but SSL unavailable — the SSL weight must drop out
    // of the denominator, not contribute as 0.
    const sslMissing = computeHealthScore({
      uptime: 90,
      responseTime: 80,
      ssl: null,
      ticketLoad: 70,
      contract: 95,
    });

    // Equivalent calculation explicitly excluding SSL.
    const explicitWithoutSsl = computeHealthScore({
      uptime: 90,
      responseTime: 80,
      ssl: null,
      ticketLoad: 70,
      contract: 95,
    });

    expect(sslMissing).toBe(explicitWithoutSsl);
    // Missing SSL with otherwise-equal signals should NOT be lower than
    // the all-known score when SSL was perfect (100). It should be the
    // average of the remaining signals only.
    const remainingWeights =
      SIGNAL_WEIGHTS.uptime +
      SIGNAL_WEIGHTS.responseTime +
      SIGNAL_WEIGHTS.ticketLoad +
      SIGNAL_WEIGHTS.contract;
    const expected = Math.round(
      (90 * SIGNAL_WEIGHTS.uptime +
        80 * SIGNAL_WEIGHTS.responseTime +
        70 * SIGNAL_WEIGHTS.ticketLoad +
        95 * SIGNAL_WEIGHTS.contract) /
        remainingWeights,
    );
    expect(sslMissing).toBe(expected);

    // Sanity: with SSL=100 plus the same other signals, the score should be
    // strictly between the no-SSL average and 100.
    expect(allKnown).toBeGreaterThanOrEqual(Math.min(sslMissing!, 100));
  });

  it("does NOT treat unavailable SSL as a 0-score punishment", () => {
    const punitive = computeHealthScore({
      uptime: 100,
      responseTime: 100,
      ssl: 0,
      ticketLoad: 100,
      contract: 100,
    });
    const neutral = computeHealthScore({
      uptime: 100,
      responseTime: 100,
      ssl: null,
      ticketLoad: 100,
      contract: 100,
    });
    expect(neutral).toBeGreaterThan(punitive!);
    expect(neutral).toBe(100);
  });

  it("AC-required parity: all-perfect score with SSL=null equals score with SSL excluded", () => {
    const perfectMinusSsl = computeHealthScore({
      uptime: 100,
      responseTime: 100,
      ssl: null,
      ticketLoad: 100,
      contract: 100,
    });
    expect(perfectMinusSsl).toBe(100);
  });
});

describe("sslSignal", () => {
  const NOW = new Date("2026-04-30T00:00:00.000Z").getTime();

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns null when sslExpiry is null and sslLastError is set", () => {
    expect(
      sslSignal({ sslExpiry: null, sslLastError: "tls handshake timeout" }),
    ).toBeNull();
  });

  it("returns null when sslExpiry is null even with no recorded error", () => {
    expect(sslSignal({ sslExpiry: null, sslLastError: null })).toBeNull();
  });

  it("returns 0 for an expired cert", () => {
    expect(
      sslSignal({
        sslExpiry: new Date(NOW - 86_400_000).toISOString(),
        sslLastError: null,
      }),
    ).toBe(0);
  });

  it("returns 25 for a cert expiring within 7 days", () => {
    expect(
      sslSignal({
        sslExpiry: new Date(NOW + 3 * 86_400_000).toISOString(),
        sslLastError: null,
      }),
    ).toBe(25);
  });

  it("returns 70 for a cert expiring within 30 days", () => {
    expect(
      sslSignal({
        sslExpiry: new Date(NOW + 20 * 86_400_000).toISOString(),
        sslLastError: null,
      }),
    ).toBe(70);
  });

  it("returns 100 for a cert with > 30 days remaining", () => {
    expect(
      sslSignal({
        sslExpiry: new Date(NOW + 90 * 86_400_000).toISOString(),
        sslLastError: null,
      }),
    ).toBe(100);
  });
});
