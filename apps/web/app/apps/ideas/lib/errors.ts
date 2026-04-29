export class RateLimitedError extends Error {
  readonly resetAt: number;

  constructor(resetAt: number) {
    super("Too many AI runs — try again in a few minutes");
    this.name = "RateLimitedError";
    this.resetAt = resetAt;
  }
}
