import type { Tier } from "@repo/billing";

export class QuotaExceededError extends Error {
  readonly feature: string;
  readonly current: number;
  readonly limit: number;
  readonly upgradeTier: Tier | undefined;

  constructor(params: {
    feature: string;
    current: number;
    limit: number;
    upgradeTier: Tier | undefined;
  }) {
    super(`quota exceeded for ${params.feature}: ${params.current}/${params.limit}`);
    this.name = "QuotaExceededError";
    this.feature = params.feature;
    this.current = params.current;
    this.limit = params.limit;
    this.upgradeTier = params.upgradeTier;
  }
}

export class RateLimitedError extends Error {
  readonly resetAt: number;

  constructor(resetAt: number) {
    super("Too many AI runs — try again in a few minutes");
    this.name = "RateLimitedError";
    this.resetAt = resetAt;
  }
}
