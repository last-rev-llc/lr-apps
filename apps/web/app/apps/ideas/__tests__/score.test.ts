import { describe, it, expect } from "vitest";
import { computeComposite } from "../lib/score";

describe("computeComposite", () => {
  it.each([
    { name: "all null", feasibility: null, impact: null, effort: null, expected: null },
    { name: "feasibility null", feasibility: null, impact: 5, effort: "Low", expected: null },
    { name: "impact null", feasibility: 5, impact: null, effort: "Low", expected: null },
    { name: "effort null", feasibility: 5, impact: 5, effort: null, expected: null },
    { name: "effort empty string", feasibility: 5, impact: 5, effort: "", expected: null },
    { name: "Low effort", feasibility: 5, impact: 5, effort: "Low", expected: 10 },
    { name: "Medium effort", feasibility: 5, impact: 5, effort: "Medium", expected: 5 },
    { name: "High effort", feasibility: 6, impact: 3, effort: "High", expected: 3 },
    { name: "unknown effort", feasibility: 5, impact: 5, effort: "UNKNOWN", expected: null },
    { name: "lowercase effort (case-sensitive)", feasibility: 5, impact: 5, effort: "low", expected: null },
    { name: "boundary 0/0/Low", feasibility: 0, impact: 0, effort: "Low", expected: 0 },
  ])("$name → $expected", ({ feasibility, impact, effort, expected }) => {
    expect(computeComposite(feasibility, impact, effort)).toBe(expected);
  });

  it("boundary 10/10/High → ~6.667", () => {
    const result = computeComposite(10, 10, "High");
    expect(result).not.toBeNull();
    expect(result!).toBeCloseTo(20 / 3, 5);
  });

  it("boundary 10/10/Low → 20", () => {
    expect(computeComposite(10, 10, "Low")).toBe(20);
  });
});
