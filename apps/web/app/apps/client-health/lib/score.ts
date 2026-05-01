// Client-health composite score (issue #286).
//
// Each contributing signal is weighted; signals reporting `null` (data
// unavailable) are excluded from BOTH the numerator and denominator so that
// missing data does not penalize the overall score. This is the design
// codified for the SSL signal: when an SSL handshake fails we set
// `sslExpiry = null` and `sslLastError = <message>`, and the score must
// remain neutral rather than treat the site as having a bad cert.

export type SignalKey =
  | "uptime"
  | "responseTime"
  | "ssl"
  | "ticketLoad"
  | "contract";

export type Signals = {
  /** 0..100 — uptime percentage. `null` means unavailable. */
  uptime: number | null;
  /** 0..100 — derived from response-time bands. `null` means unavailable. */
  responseTime: number | null;
  /** 0..100 — derived from days-until-expiry. `null` means unavailable. */
  ssl: number | null;
  /** 0..100 — derived from ticket backlog. `null` means unavailable. */
  ticketLoad: number | null;
  /** 0..100 — health of contract/billing relationship. `null` means unavailable. */
  contract: number | null;
};

export const SIGNAL_WEIGHTS: Record<SignalKey, number> = {
  uptime: 30,
  responseTime: 15,
  ssl: 15,
  ticketLoad: 25,
  contract: 15,
};

/**
 * Computes the composite client-health score (0–100) from the provided
 * signals. Returns `null` if every signal is unavailable.
 *
 * Unavailable signals (`null`) are excluded from both the weighted sum and
 * the weight denominator, so they do not penalize or reward the score.
 */
export function computeHealthScore(signals: Signals): number | null {
  let weightedSum = 0;
  let totalWeight = 0;

  for (const key of Object.keys(SIGNAL_WEIGHTS) as SignalKey[]) {
    const value = signals[key];
    if (value == null) continue;
    const w = SIGNAL_WEIGHTS[key];
    weightedSum += value * w;
    totalWeight += w;
  }

  if (totalWeight === 0) return null;
  return Math.round(weightedSum / totalWeight);
}

/**
 * Maps raw SSL state to a 0–100 signal value. Returns `null` when the
 * handshake failed (sslExpiry === null && sslLastError !== null) so that
 * the score treats SSL as data-unavailable instead of a bad cert.
 */
export function sslSignal(input: {
  sslExpiry: string | null;
  sslLastError: string | null;
}): number | null {
  if (input.sslExpiry === null) {
    // Either we never checked the URL, or the last check failed. Either
    // way, treat it as unavailable so the score is neutral.
    return null;
  }
  const days = (Date.parse(input.sslExpiry) - Date.now()) / 86_400_000;
  if (days <= 0) return 0;
  if (days < 7) return 25;
  if (days < 30) return 70;
  return 100;
}
