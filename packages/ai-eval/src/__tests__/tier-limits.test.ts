import { describe, expect, it } from "vitest";
import {
  CONCURRENCY_CAP,
  PROMPT_TEMPLATE_MAX_BYTES,
  QUESTION_SET_QUOTA,
  RUNS_PER_DAY,
  enforceConcurrencyCap,
} from "../tier-limits";

describe("tier-limits constants", () => {
  it("exposes the documented quota numbers", () => {
    expect(QUESTION_SET_QUOTA).toEqual({ free: 3, pro: 50, enterprise: -1 });
    expect(CONCURRENCY_CAP).toEqual({ free: 3, pro: 10, enterprise: 25 });
    expect(RUNS_PER_DAY).toEqual({ free: 5, pro: 200, enterprise: 2000 });
    expect(PROMPT_TEMPLATE_MAX_BYTES).toBe(16 * 1024);
  });
});

describe("enforceConcurrencyCap", () => {
  it("clamps requests above the tier cap", () => {
    expect(enforceConcurrencyCap("free", 100)).toBe(3);
    expect(enforceConcurrencyCap("pro", 999)).toBe(10);
    expect(enforceConcurrencyCap("enterprise", 100)).toBe(25);
  });

  it("passes through requests at or below the cap", () => {
    expect(enforceConcurrencyCap("free", 2)).toBe(2);
    expect(enforceConcurrencyCap("pro", 5)).toBe(5);
    expect(enforceConcurrencyCap("enterprise", 25)).toBe(25);
  });

  it("clamps non-positive requests up to 1", () => {
    expect(enforceConcurrencyCap("free", 0)).toBe(1);
    expect(enforceConcurrencyCap("free", -5)).toBe(1);
    expect(enforceConcurrencyCap("pro", -100)).toBe(1);
  });

  it("floors fractional requests before applying the cap", () => {
    expect(enforceConcurrencyCap("pro", 7.9)).toBe(7);
    expect(enforceConcurrencyCap("free", 2.5)).toBe(2);
  });
});
