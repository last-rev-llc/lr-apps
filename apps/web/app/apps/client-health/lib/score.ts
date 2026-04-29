// Health-score helper. Locked weights, deterministic, no I/O — safe to
// call from anywhere (server queries, tooltip rendering, tests).

export const WEIGHTS = {
  uptime: 0.30,
  responseTime: 0.10,
  ssl: 0.20,
  ticketLoad: 0.20,
  contract: 0.20,
} as const;

export type ContractStatus = "active" | "expiring-soon" | "expired" | "none";

export type ScoreInput = {
  uptime?: number | null;
  responseTimeMs?: number | null;
  sslExpiry?: string | Date | null;
  openTicketCount?: number | null;
  contractStatus?: ContractStatus | null;
};

export type ScoreBreakdown = Record<keyof typeof WEIGHTS, number>;

export type ScoreResult = {
  score: number;
  breakdown: ScoreBreakdown;
};

const NEUTRAL = 0.5;
const DAY_MS = 24 * 60 * 60 * 1000;

function uptimeSignal(uptime?: number | null): number {
  if (uptime == null) return NEUTRAL;
  if (uptime >= 99.5) return 1;
  if (uptime >= 98) return 0.75;
  if (uptime >= 95) return 0.5;
  return Math.max(0, uptime / 100);
}

function responseTimeSignal(ms?: number | null): number {
  if (ms == null) return NEUTRAL;
  if (ms < 300) return 1;
  if (ms < 800) return 0.75;
  if (ms < 2000) return 0.5;
  return 0;
}

function sslSignal(expiry?: string | Date | null, now: Date = new Date()): number {
  if (expiry == null) return NEUTRAL;
  const expiryDate = expiry instanceof Date ? expiry : new Date(expiry);
  if (Number.isNaN(expiryDate.getTime())) return NEUTRAL;
  const days = Math.floor((expiryDate.getTime() - now.getTime()) / DAY_MS);
  if (days < 0) return 0;
  if (days < 7) return 0.25;
  if (days < 30) return 0.6;
  return 1;
}

function ticketLoadSignal(count?: number | null): number {
  if (count == null) return NEUTRAL;
  if (count <= 0) return 1;
  if (count <= 2) return 0.85;
  if (count <= 5) return 0.6;
  if (count <= 10) return 0.35;
  return 0.1;
}

function contractSignal(status?: ContractStatus | null): number {
  switch (status) {
    case "active":
      return 1;
    case "expiring-soon":
      return 0.5;
    case "expired":
      return 0;
    case "none":
    case null:
    case undefined:
    default:
      return NEUTRAL;
  }
}

export function computeHealthScore(
  input: ScoreInput,
  now: Date = new Date(),
): ScoreResult {
  const signals: Record<keyof typeof WEIGHTS, number> = {
    uptime: uptimeSignal(input.uptime),
    responseTime: responseTimeSignal(input.responseTimeMs),
    ssl: sslSignal(input.sslExpiry, now),
    ticketLoad: ticketLoadSignal(input.openTicketCount),
    contract: contractSignal(input.contractStatus),
  };

  const breakdown: ScoreBreakdown = {
    uptime: signals.uptime * WEIGHTS.uptime * 100,
    responseTime: signals.responseTime * WEIGHTS.responseTime * 100,
    ssl: signals.ssl * WEIGHTS.ssl * 100,
    ticketLoad: signals.ticketLoad * WEIGHTS.ticketLoad * 100,
    contract: signals.contract * WEIGHTS.contract * 100,
  };

  const total =
    breakdown.uptime +
    breakdown.responseTime +
    breakdown.ssl +
    breakdown.ticketLoad +
    breakdown.contract;

  return {
    score: Math.round(total),
    breakdown,
  };
}
